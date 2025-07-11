import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { businessInfoSchema, type BusinessInfo, type LaunchPlanResponse } from "@shared/schema";
import { Rocket, Edit, Upload, Brain, ChartLine, Copy, Download, Calendar, Share, Clock, Target, Wrench, ChevronDown, ChevronRight } from "lucide-react";
import jsPDF from "jspdf";

export default function Home() {
  const [inputMethod, setInputMethod] = useState<'text' | 'pdf'>('text');
  const [generatedPlan, setGeneratedPlan] = useState<LaunchPlanResponse | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const form = useForm<BusinessInfo>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessIdea: "",
      industry: "",
      targetMarket: "",
      timeCommitment: "10 hours/week",
      budget: "$0 (Zero-budget)",
      additionalDetails: "",
    },
  });

  const generatePlanMutation = useMutation({
    mutationFn: async (data: BusinessInfo) => {
      const response = await apiRequest("POST", "/api/generate-plan", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedPlan(data.plan);
        toast({
          title: "Success!",
          description: "Your 30-day launch plan has been generated.",
        });
      } else {
        throw new Error(data.error);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate launch plan",
        variant: "destructive",
      });
    },
  });

  const generatePlanFromPDFMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('pdf', file);
      
      const response = await fetch('/api/generate-plan-pdf', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process PDF');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedPlan(data.plan);
        toast({
          title: "Success!",
          description: "Your business plan PDF has been processed and launch plan generated.",
        });
      } else {
        throw new Error(data.error);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BusinessInfo) => {
    generatePlanMutation.mutate(data);
  };

  const handleFileUpload = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    generatePlanFromPDFMutation.mutate(file);
  }, [generatePlanFromPDFMutation, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const toggleWeekExpansion = (weekIndex: number) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekIndex]: !prev[weekIndex]
    }));
  };

  const copyToClipboard = async () => {
    if (!generatedPlan) return;
    
    try {
      const planText = JSON.stringify(generatedPlan, null, 2);
      await navigator.clipboard.writeText(planText);
      toast({
        title: "Copied!",
        description: "Launch plan copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const downloadPDF = () => {
    if (!generatedPlan) return;

    try {
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 15;
      let yPosition = margin;
      const lineHeight = 7;
      const maxWidth = pdf.internal.pageSize.width - 2 * margin;

      // Helper function to add text with page breaks
      const addTextWithPageBreak = (text: string, fontSize: number = 10, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", isBold ? "bold" : "normal");
        
        const lines = pdf.splitTextToSize(text, maxWidth);
        
        for (const line of lines) {
          if (yPosition + lineHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        }
      };

      // Title
      addTextWithPageBreak("30-Day Business Launch Plan", 20, true);
      yPosition += 5;

      // Overview
      addTextWithPageBreak("Executive Summary", 14, true);
      yPosition += 2;
      addTextWithPageBreak(generatedPlan.overview, 10);
      yPosition += 10;

      // Weekly Plans
      generatedPlan.weeklyPlan.forEach((week, weekIndex) => {
        // Check if we need a new page for the week
        if (yPosition + 30 > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        // Week Title
        addTextWithPageBreak(`${week.title}`, 12, true);
        addTextWithPageBreak(`Goal: ${week.goal}`, 10);
        yPosition += 5;

        // Daily Tasks
        week.dailyTasks.forEach((task) => {
          if (yPosition + 20 > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          addTextWithPageBreak(`${task.day}: ${task.description}`, 10, true);
          addTextWithPageBreak(`Time: ${task.timeEstimate} | Tool: ${task.tool}`, 9);
          addTextWithPageBreak(`KPI: ${task.kpi}`, 9);
          yPosition += 3;
        });

        // Reddit Tips
        if (week.redditTips && week.redditTips.length > 0) {
          addTextWithPageBreak("Reddit Marketing Tips:", 10, true);
          week.redditTips.forEach((tip) => {
            addTextWithPageBreak(`• ${tip}`, 9);
          });
        }
        yPosition += 8;
      });

      // Add new page for tools and KPIs
      pdf.addPage();
      yPosition = margin;

      // Recommended Tools
      addTextWithPageBreak("Recommended Tools", 14, true);
      yPosition += 3;
      generatedPlan.recommendedTools.forEach((tool) => {
        if (yPosition + 15 > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        addTextWithPageBreak(`${tool.name} - ${tool.pricing}`, 10, true);
        addTextWithPageBreak(`${tool.purpose}`, 9);
        yPosition += 5;
      });

      yPosition += 10;

      // KPIs
      if (yPosition + 30 > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      addTextWithPageBreak("Key Performance Indicators", 14, true);
      yPosition += 3;
      generatedPlan.kpis.forEach((kpi) => {
        if (yPosition + 15 > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        addTextWithPageBreak(`${kpi.metric}: ${kpi.target}`, 10, true);
        addTextWithPageBreak(`Tracking: ${kpi.tracking}`, 9);
        yPosition += 5;
      });

      // Save the PDF
      const fileName = `LaunchPlan_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Downloaded!",
        description: "Your launch plan has been saved as a PDF.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isLoading = generatePlanMutation.isPending || generatePlanFromPDFMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Rocket className="text-primary-foreground w-4 h-4" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">LaunchPlan Generator</h1>
            </div>
            <div className="text-sm text-muted-foreground">30-Day Business Launch Strategy</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-foreground">Generate Your 30-Day Launch Plan</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your business idea into a detailed, actionable launch strategy using AI. 
              Input your business details or upload a PDF to get started.
            </p>
          </div>

          {/* Input Section */}
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <Edit className="text-primary w-5 h-5" />
                <h3 className="text-xl font-semibold">Business Information</h3>
              </div>

              {/* Input Method Toggle */}
              <div className="flex space-x-1 bg-muted rounded-lg p-1 w-fit">
                <Button
                  type="button"
                  variant={inputMethod === 'text' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInputMethod('text')}
                  className="text-sm font-medium"
                >
                  Text Input
                </Button>
                <Button
                  type="button"
                  variant={inputMethod === 'pdf' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInputMethod('pdf')}
                  className="text-sm font-medium"
                >
                  PDF Upload
                </Button>
              </div>

              {/* Text Input Section */}
              {inputMethod === 'text' && (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="businessIdea">Business Idea</Label>
                    <Textarea
                      id="businessIdea"
                      placeholder="Describe your business idea, target market, and value proposition..."
                      className="mt-2"
                      rows={4}
                      {...form.register("businessIdea")}
                    />
                    {form.formState.errors.businessIdea && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.businessIdea.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        placeholder="e.g., SaaS, E-commerce, Consulting"
                        className="mt-2"
                        {...form.register("industry")}
                      />
                      {form.formState.errors.industry && (
                        <p className="text-sm text-destructive mt-1">{form.formState.errors.industry.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="targetMarket">Target Market</Label>
                      <Input
                        id="targetMarket"
                        placeholder="e.g., Small businesses, Millennials"
                        className="mt-2"
                        {...form.register("targetMarket")}
                      />
                      {form.formState.errors.targetMarket && (
                        <p className="text-sm text-destructive mt-1">{form.formState.errors.targetMarket.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timeCommitment">Time Commitment (hours/week)</Label>
                      <Select onValueChange={(value) => form.setValue("timeCommitment", value)} defaultValue={form.getValues("timeCommitment")}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10 hours/week">10 hours/week (default)</SelectItem>
                          <SelectItem value="20 hours/week">20 hours/week</SelectItem>
                          <SelectItem value="40 hours/week">40 hours/week</SelectItem>
                          <SelectItem value="Custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="budget">Budget Range</Label>
                      <Select onValueChange={(value) => form.setValue("budget", value)} defaultValue={form.getValues("budget")}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="$0 (Zero-budget)">$0 (Zero-budget)</SelectItem>
                          <SelectItem value="$100-500">$100-500</SelectItem>
                          <SelectItem value="$500-1000">$500-1000</SelectItem>
                          <SelectItem value="$1000+">$1000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="additionalDetails">Additional Details</Label>
                    <Textarea
                      id="additionalDetails"
                      placeholder="Any specific goals, constraints, or requirements for your launch plan..."
                      className="mt-2"
                      rows={3}
                      {...form.register("additionalDetails")}
                    />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button 
                      type="submit"
                      className="w-full py-4 text-lg font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Brain className="w-5 h-5 mr-2 animate-spin" />
                          Generating Plan...
                        </>
                      ) : (
                        <>
                          <Brain className="w-5 h-5 mr-2" />
                          Generate My 30-Day Launch Plan
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      This may take 30-60 seconds to generate your customized plan
                    </p>
                  </div>
                </form>
              )}

              {/* PDF Upload Section */}
              {inputMethod === 'pdf' && (
                <div>
                  <div 
                    className={`file-upload-zone border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-foreground">Upload Business Plan PDF</p>
                        <p className="text-sm text-muted-foreground mt-1">Drag and drop your file here, or click to browse</p>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                        <span>PDF only</span>
                        <span>•</span>
                        <span>Max 10MB</span>
                      </div>
                      <Button 
                        type="button"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.pdf';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleFileUpload(file);
                          };
                          input.click();
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? "Processing..." : "Choose File"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card className="shadow-sm">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Brain className="text-primary w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Generating Your Launch Plan</h3>
                    <p className="text-muted-foreground mt-2">Our AI is analyzing your business information and creating a detailed 30-day strategy...</p>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce-dot"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce-dot"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce-dot"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Section */}
          {generatedPlan && (
            <div className="space-y-6">
              {/* Plan Overview */}
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <ChartLine className="text-[hsl(142,76%,36%)] w-5 h-5" />
                      <h3 className="text-xl font-semibold">Your 30-Day Launch Plan</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Plan
                    </Button>
                  </div>

                  {/* Plan Summary */}
                  <div className="bg-muted rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-foreground mb-2">Executive Summary</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {generatedPlan.overview}
                    </p>
                  </div>

                  {/* Week-by-Week Breakdown */}
                  <div className="space-y-4">
                    {generatedPlan.weeklyPlan.map((week, weekIndex) => (
                      <div key={weekIndex} className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-muted px-4 py-3 border-b border-border">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-foreground">{week.title}</h5>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleWeekExpansion(weekIndex)}
                            >
                              {expandedWeeks[weekIndex] ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{week.goal}</p>
                        </div>
                        
                        {expandedWeeks[weekIndex] && (
                          <div className="p-4 space-y-3">
                            {/* Daily Tasks */}
                            {week.dailyTasks.map((task, taskIndex) => (
                              <div key={taskIndex} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-semibold text-primary">{task.day}</span>
                                </div>
                                <div className="flex-grow">
                                  <h6 className="font-medium text-foreground text-sm">{task.description}</h6>
                                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                    <span><Clock className="w-3 h-3 mr-1 inline" />{task.timeEstimate}</span>
                                    <span><Wrench className="w-3 h-3 mr-1 inline" />{task.tool}</span>
                                    <span><Target className="w-3 h-3 mr-1 inline" />{task.kpi}</span>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Reddit Tips Section */}
                            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <h6 className="font-medium text-orange-800 text-sm mb-2">
                                Reddit Marketing Tips for {week.title}
                              </h6>
                              <ul className="text-xs text-orange-700 space-y-1">
                                {week.redditTips.map((tip, tipIndex) => (
                                  <li key={tipIndex}>• {tip}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tools & Resources */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Wrench className="text-secondary w-5 h-5" />
                      <h4 className="text-lg font-semibold">Recommended Tools</h4>
                    </div>
                    <div className="space-y-3">
                      {generatedPlan.recommendedTools.map((tool, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                            <Wrench className="text-secondary w-4 h-4" />
                          </div>
                          <div>
                            <h6 className="font-medium text-foreground text-sm">{tool.name}</h6>
                            <p className="text-xs text-muted-foreground">{tool.purpose}</p>
                            <p className="text-xs text-[hsl(142,76%,36%)] font-medium mt-1">{tool.pricing}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <ChartLine className="text-[hsl(142,76%,36%)] w-5 h-5" />
                      <h4 className="text-lg font-semibold">Key Performance Indicators</h4>
                    </div>
                    <div className="space-y-3">
                      {generatedPlan.kpis.map((kpi, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <h6 className="font-medium text-foreground text-sm">{kpi.metric}</h6>
                            <span className="text-sm font-semibold text-[hsl(142,76%,36%)]">{kpi.target}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{kpi.tracking}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Next Actions */}
              <div className="gradient-primary-secondary rounded-xl p-6 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <Rocket className="w-5 h-5" />
                  <h4 className="text-lg font-semibold">Ready to Launch?</h4>
                </div>
                <p className="text-white/90 mb-4">
                  Your plan is ready! Start with Day 1 and follow the structured approach to turn your idea into reality.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" size="sm" onClick={downloadPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                    <Calendar className="w-4 h-4 mr-2" />
                    Add to Calendar
                  </Button>
                  <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                    <Share className="w-4 h-4 mr-2" />
                    Share Plan
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Brain className="w-4 h-4" />
              <span className="text-sm">Powered by OpenAI GPT-4</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
              LaunchPlan Generator creates personalized business launch strategies based on proven Reddit-first marketing principles. 
              Your data is processed securely and not stored after plan generation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
