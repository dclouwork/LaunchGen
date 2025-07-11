import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { businessInfoSchema, type BusinessInfo, type LaunchPlanResponse } from "@shared/schema";
import { Rocket, Edit, Upload, Brain, ChartLine, Copy, Download, Share, Clock, Target, Wrench, ChevronDown, ChevronRight, Save, X, Share2, Plus } from "lucide-react";
import jsPDF from "jspdf";
import CommunityFeedback from "@/components/CommunityFeedback";
import SEO from "@/components/SEO";
import { Stepper, StepperProgress, type Step } from "@/components/ui/stepper";

export default function Home() {
  const [inputMethod, setInputMethod] = useState<'text' | 'pdf'>('text');
  const [generatedPlan, setGeneratedPlan] = useState<LaunchPlanResponse | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPlan, setEditedPlan] = useState<LaunchPlanResponse | null>(null);
  const [planId, setPlanId] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [planTitle, setPlanTitle] = useState("Your 30-Day Launch Plan");
  const [editedPlanTitle, setEditedPlanTitle] = useState("Your 30-Day Launch Plan");
  const [currentGenerationStep, setCurrentGenerationStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Define the generation steps
  const generationSteps: Step[] = [
    { id: 1, label: "Core Plan Generation", description: "Creating your 30-day framework" },
    { id: 2, label: "Proofread & Draft Posts", description: "Polishing content and drafting social posts" },
    { id: 3, label: "QA & Completion", description: "Final quality checks and validation" },
    { id: 4, label: "Delivered", description: "Your plan is ready!" }
  ];

  // Function to extract business name from executive summary
  const extractBusinessName = (overview: string): string | null => {
    // Common patterns for business names in executive summaries
    const patterns = [
      /^([A-Z][A-Za-z0-9\s&'-]+)\s+is\s+/,
      /^([A-Z][A-Za-z0-9\s&'-]+)\s+will\s+/,
      /^([A-Z][A-Za-z0-9\s&'-]+)\s+aims\s+/,
      /^([A-Z][A-Za-z0-9\s&'-]+)\s+provides\s+/,
      /^([A-Z][A-Za-z0-9\s&'-]+)\s+offers\s+/,
      /Launch\s+([A-Z][A-Za-z0-9\s&'-]+)\s+as\s+/,
      /Build\s+([A-Z][A-Za-z0-9\s&'-]+)\s+as\s+/,
      /Create\s+([A-Z][A-Za-z0-9\s&'-]+)\s+as\s+/,
    ];

    for (const pattern of patterns) {
      const match = overview.match(pattern);
      if (match && match[1]) {
        const businessName = match[1].trim();
        // Avoid generic terms
        if (!['This', 'The', 'A', 'An', 'Our'].includes(businessName)) {
          return businessName;
        }
      }
    }
    return null;
  };

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

  // Create a separate form for PDF upload with only the additional fields
  const pdfForm = useForm<Omit<BusinessInfo, 'businessIdea'> & { businessIdea?: string }>({
    resolver: zodResolver(businessInfoSchema.omit({ businessIdea: true }).extend({
      businessIdea: businessInfoSchema.shape.businessIdea.optional(),
    })),
    defaultValues: {
      industry: "",
      targetMarket: "",
      timeCommitment: "10 hours/week",
      budget: "$0 (Zero-budget)",
      additionalDetails: "",
    },
  });

  const generatePlanMutation = useMutation({
    mutationFn: async (data: BusinessInfo) => {
      // Set initial state
      setIsGenerating(true);
      setCurrentGenerationStep(1);
      
      // Simulate progression through the stages
      setTimeout(() => setCurrentGenerationStep(2), 8000); // Move to stage 2 after 8 seconds
      setTimeout(() => setCurrentGenerationStep(3), 20000); // Move to stage 3 after 20 seconds
      
      const response = await apiRequest("POST", "/api/generate-plan", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        // Move to final step
        setCurrentGenerationStep(4);
        
        setGeneratedPlan(data.plan);
        setPlanId(data.planId);
        setEditedPlan(data.plan);
        
        // Extract business name and set plan title
        const businessName = extractBusinessName(data.plan.overview);
        if (businessName) {
          const newTitle = `${businessName} - 30-Day Launch Plan`;
          setPlanTitle(newTitle);
          setEditedPlanTitle(newTitle);
        }
        
        // Delay slightly to show completion before hiding stepper
        setTimeout(() => {
          setIsGenerating(false);
          toast({
            title: "Success!",
            description: "Your 30-day launch plan has been generated.",
          });
        }, 1000);
      } else {
        throw new Error(data.error);
      }
    },
    onError: (error) => {
      setIsGenerating(false);
      setCurrentGenerationStep(0);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate launch plan",
        variant: "destructive",
      });
    },
  });

  const generatePlanFromPDFMutation = useMutation({
    mutationFn: async ({ file, formData }: { file: File; formData: Omit<BusinessInfo, 'businessIdea'> }) => {
      // Set initial state
      setIsGenerating(true);
      setCurrentGenerationStep(1);
      
      // Simulate progression through the stages
      setTimeout(() => setCurrentGenerationStep(2), 8000); // Move to stage 2 after 8 seconds
      setTimeout(() => setCurrentGenerationStep(3), 20000); // Move to stage 3 after 20 seconds
      
      const data = new FormData();
      data.append('pdf', file);
      data.append('industry', formData.industry);
      data.append('targetMarket', formData.targetMarket);
      data.append('timeCommitment', formData.timeCommitment);
      data.append('budget', formData.budget);
      data.append('additionalDetails', formData.additionalDetails || '');
      
      const response = await fetch('/api/generate-plan-pdf', {
        method: 'POST',
        body: data,
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
        // Move to final step
        setCurrentGenerationStep(4);
        
        setGeneratedPlan(data.plan);
        setPlanId(data.planId);
        setEditedPlan(data.plan);
        
        // Extract business name and set plan title
        const businessName = extractBusinessName(data.plan.overview);
        if (businessName) {
          const newTitle = `${businessName} - 30-Day Launch Plan`;
          setPlanTitle(newTitle);
          setEditedPlanTitle(newTitle);
        }
        
        // Delay slightly to show completion before hiding stepper
        setTimeout(() => {
          setIsGenerating(false);
          toast({
            title: "Success!",
            description: "Your business plan PDF has been processed and launch plan generated.",
          });
        }, 1000);
        
        // Reset the form and file
        pdfForm.reset();
        setPdfFile(null);
      } else {
        throw new Error(data.error);
      }
    },
    onError: (error) => {
      setIsGenerating(false);
      setCurrentGenerationStep(0);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive",
      });
    },
  });

  const savePlanMutation = useMutation({
    mutationFn: async (updatedPlan: LaunchPlanResponse) => {
      if (!planId) throw new Error("No plan ID available");
      const response = await apiRequest("PUT", `/api/plan/${planId}`, {
        generatedPlan: updatedPlan
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedPlan(editedPlan);
        setIsEditMode(false);
        toast({
          title: "Saved!",
          description: "Your changes have been saved successfully.",
        });
      } else {
        throw new Error("Failed to save plan");
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive",
      });
    },
  });

  const sharePlanMutation = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error("No plan ID available");
      const response = await apiRequest("POST", `/api/plan/${planId}/share`, {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        const fullUrl = `${window.location.origin}${data.shareUrl}`;
        setShareUrl(fullUrl);
        setShowShareDialog(true);
      } else {
        throw new Error("Failed to generate share link");
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate share link",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BusinessInfo) => {
    generatePlanMutation.mutate(data);
  };

  const onPdfSubmit = (data: Omit<BusinessInfo, 'businessIdea'>) => {
    if (!pdfFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file before submitting.",
        variant: "destructive",
      });
      return;
    }
    generatePlanFromPDFMutation.mutate({ file: pdfFile, formData: data });
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

    setPdfFile(file);
    toast({
      title: "File uploaded",
      description: `${file.name} ready for processing`,
    });
  }, [toast]);

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
      addTextWithPageBreak(planTitle, 20, true);
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
      const dateStr = new Date().toISOString().split('T')[0];
      const sanitizedTitle = planTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
      const fileName = `${sanitizedTitle}_${dateStr}.pdf`;
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
    <>
      <SEO />
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
                  onClick={() => {
                    setInputMethod('text');
                    setPdfFile(null); // Clear PDF file when switching
                  }}
                  className="text-sm font-medium"
                  disabled={isLoading}
                >
                  Text Input
                </Button>
                <Button
                  type="button"
                  variant={inputMethod === 'pdf' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setInputMethod('pdf');
                  }}
                  className="text-sm font-medium"
                  disabled={isLoading}
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
                      disabled={isLoading}
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
                        disabled={isLoading}
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
                        disabled={isLoading}
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
                      <Select onValueChange={(value) => form.setValue("timeCommitment", value)} defaultValue={form.getValues("timeCommitment")} disabled={isLoading}>
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
                      <Select onValueChange={(value) => form.setValue("budget", value)} defaultValue={form.getValues("budget")} disabled={isLoading}>
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
                      disabled={isLoading}
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
                <form onSubmit={pdfForm.handleSubmit(onPdfSubmit)} className="space-y-4">
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
                            if (file) {
                              setPdfFile(file);
                              toast({
                                title: "File uploaded",
                                description: `${file.name} ready for processing`,
                              });
                            }
                          };
                          input.click();
                        }}
                        disabled={isLoading}
                      >
                        {pdfFile ? pdfFile.name : (isLoading ? "Processing..." : "Choose File")}
                      </Button>
                    </div>
                  </div>

                  {/* Additional Fields for PDF Upload */}
                  <div className="space-y-4 mt-6">
                    <p className="text-sm text-muted-foreground">Provide additional context for your business plan:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pdf-industry">Industry</Label>
                        <Input
                          id="pdf-industry"
                          placeholder="e.g., SaaS, E-commerce, Consulting"
                          className="mt-2"
                          disabled={isLoading}
                          {...pdfForm.register("industry")}
                        />
                        {pdfForm.formState.errors.industry && (
                          <p className="text-sm text-destructive mt-1">{pdfForm.formState.errors.industry.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="pdf-targetMarket">Target Market</Label>
                        <Input
                          id="pdf-targetMarket"
                          placeholder="e.g., Small businesses, Millennials"
                          className="mt-2"
                          disabled={isLoading}
                          {...pdfForm.register("targetMarket")}
                        />
                        {pdfForm.formState.errors.targetMarket && (
                          <p className="text-sm text-destructive mt-1">{pdfForm.formState.errors.targetMarket.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pdf-timeCommitment">Time Commitment (hours/week)</Label>
                        <Select onValueChange={(value) => pdfForm.setValue("timeCommitment", value)} defaultValue={pdfForm.getValues("timeCommitment")} disabled={isLoading}>
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
                        <Label htmlFor="pdf-budget">Budget Range</Label>
                        <Select onValueChange={(value) => pdfForm.setValue("budget", value)} defaultValue={pdfForm.getValues("budget")} disabled={isLoading}>
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
                      <Label htmlFor="pdf-additionalDetails">Additional Details</Label>
                      <Textarea
                        id="pdf-additionalDetails"
                        placeholder="Any specific goals, constraints, or requirements for your launch plan..."
                        className="mt-2"
                        rows={3}
                        disabled={isLoading}
                        {...pdfForm.register("additionalDetails")}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button 
                      type="submit"
                      className="w-full py-4 text-lg font-semibold"
                      disabled={isLoading || !pdfFile}
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
                      {!pdfFile ? "Please select a PDF file first" : "This may take 30-60 seconds to generate your customized plan"}
                    </p>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              {/* Progress Stepper */}
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="hidden sm:block">
                      <Stepper 
                        steps={generationSteps} 
                        currentStep={currentGenerationStep}
                        orientation="horizontal"
                        className="mb-4"
                      />
                    </div>
                    <div className="block sm:hidden">
                      <Stepper 
                        steps={generationSteps} 
                        currentStep={currentGenerationStep}
                        orientation="vertical"
                        className="mb-4"
                      />
                    </div>
                    <StepperProgress 
                      currentStep={currentGenerationStep} 
                      totalSteps={generationSteps.length}
                      className="text-center"
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Loading Message */}
              <Card className="shadow-sm">
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Brain className="text-primary w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {currentGenerationStep === 1 && "Generating Core Plan..."}
                        {currentGenerationStep === 2 && "Proofreading & Creating Post Drafts..."}
                        {currentGenerationStep === 3 && "Finalizing Your Launch Strategy..."}
                        {currentGenerationStep === 0 && "Generating Your Launch Plan"}
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        {currentGenerationStep === 1 && "Creating your 30-day framework with daily tasks and milestones"}
                        {currentGenerationStep === 2 && "Polishing content and drafting engaging social media posts"}
                        {currentGenerationStep === 3 && "Running quality checks and ensuring everything is perfect"}
                        {currentGenerationStep === 0 && "Our AI is analyzing your business information and creating a detailed 30-day strategy..."}
                      </p>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce-dot"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce-dot"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce-dot"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Section */}
          {generatedPlan && (
            <div className="space-y-6">
              {/* Progress Stepper - Show only when generating or recently completed */}
              {(isGenerating || currentGenerationStep === 4) && (
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="hidden sm:block">
                        <Stepper 
                          steps={generationSteps} 
                          currentStep={currentGenerationStep}
                          orientation="horizontal"
                          className="mb-4"
                        />
                      </div>
                      <div className="block sm:hidden">
                        <Stepper 
                          steps={generationSteps} 
                          currentStep={currentGenerationStep}
                          orientation="vertical"
                          className="mb-4"
                        />
                      </div>
                      <StepperProgress 
                        currentStep={currentGenerationStep} 
                        totalSteps={generationSteps.length}
                        className="text-center"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Plan Overview */}
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <ChartLine className="text-[hsl(142,76%,36%)] w-5 h-5" />
                      {isEditMode ? (
                        <Input
                          className="text-xl font-semibold max-w-xs"
                          value={editedPlanTitle}
                          onChange={(e) => setEditedPlanTitle(e.target.value)}
                          placeholder="Enter plan title"
                        />
                      ) : (
                        <h3 className="text-xl font-semibold">{planTitle}</h3>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {isEditMode ? (
                        <>
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => {
                              if (editedPlan) {
                                savePlanMutation.mutate(editedPlan);
                                setPlanTitle(editedPlanTitle);
                              }
                            }}
                            disabled={savePlanMutation.isPending}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setIsEditMode(false);
                              setEditedPlan(generatedPlan);
                              setEditedPlanTitle(planTitle);
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={copyToClipboard}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setIsEditMode(true);
                              setEditedPlanTitle(planTitle);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => sharePlanMutation.mutate()}
                            disabled={sharePlanMutation.isPending}
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Plan Summary */}
                  <div className="bg-muted rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-foreground mb-2">Executive Summary</h4>
                    {isEditMode ? (
                      <Textarea
                        className="text-sm leading-relaxed min-h-[100px]"
                        value={editedPlan?.overview || ''}
                        onChange={(e) => {
                          if (editedPlan) {
                            setEditedPlan({
                              ...editedPlan,
                              overview: e.target.value
                            });
                          }
                        }}
                      />
                    ) : (
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {generatedPlan.overview}
                      </p>
                    )}
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
                            {/* Group tasks by day */}
                            {(() => {
                              const tasksToDisplay = isEditMode ? editedPlan?.weeklyPlan[weekIndex]?.dailyTasks || [] : week.dailyTasks;
                              const tasksByDay = tasksToDisplay.reduce((acc, task, index) => {
                                const day = task.day;
                                if (!acc[day]) acc[day] = [];
                                acc[day].push({ ...task, originalIndex: index });
                                return acc;
                              }, {} as Record<string, Array<any>>);

                              return Object.entries(tasksByDay).map(([day, dayTasks]) => (
                                <div key={day} className="space-y-2">
                                  {/* Day Header */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-semibold text-primary">{day}</span>
                                      </div>
                                      <h6 className="text-sm font-medium text-muted-foreground">Tasks for {day}</h6>
                                    </div>
                                    {isEditMode && (
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => {
                                          if (editedPlan) {
                                            const newTask = {
                                              day: day,
                                              description: "New task",
                                              timeEstimate: "30 min",
                                              tool: "Tool",
                                              kpi: "Metric"
                                            };
                                            const newPlan = { ...editedPlan };
                                            // Insert the new task after the last task of this day
                                            const lastDayTaskIndex = Math.max(...dayTasks.map(t => t.originalIndex));
                                            newPlan.weeklyPlan[weekIndex].dailyTasks.splice(lastDayTaskIndex + 1, 0, newTask);
                                            setEditedPlan(newPlan);
                                          }
                                        }}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {/* Tasks for this day */}
                                  <div className="ml-10 space-y-2">
                                    {dayTasks.map((task) => (
                                      <div key={task.originalIndex} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                                        <div className="flex-grow">
                                          {isEditMode ? (
                                            <>
                                              <Input
                                                className="font-medium text-sm mb-2"
                                                value={editedPlan?.weeklyPlan[weekIndex]?.dailyTasks[task.originalIndex]?.description || ''}
                                                onChange={(e) => {
                                                  if (editedPlan) {
                                                    const newPlan = { ...editedPlan };
                                                    newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].description = e.target.value;
                                                    setEditedPlan(newPlan);
                                                  }
                                                }}
                                              />
                                              <div className="grid grid-cols-3 gap-2 mt-2">
                                                <Input
                                                  className="text-xs"
                                                  placeholder="Time estimate"
                                                  value={editedPlan?.weeklyPlan[weekIndex]?.dailyTasks[task.originalIndex]?.timeEstimate || ''}
                                                  onChange={(e) => {
                                                    if (editedPlan) {
                                                      const newPlan = { ...editedPlan };
                                                      newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].timeEstimate = e.target.value;
                                                      setEditedPlan(newPlan);
                                                    }
                                                  }}
                                                />
                                                <Input
                                                  className="text-xs"
                                                  placeholder="Tool"
                                                  value={editedPlan?.weeklyPlan[weekIndex]?.dailyTasks[task.originalIndex]?.tool || ''}
                                                  onChange={(e) => {
                                                    if (editedPlan) {
                                                      const newPlan = { ...editedPlan };
                                                      newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].tool = e.target.value;
                                                      setEditedPlan(newPlan);
                                                    }
                                                  }}
                                                />
                                                <Input
                                                  className="text-xs"
                                                  placeholder="KPI"
                                                  value={editedPlan?.weeklyPlan[weekIndex]?.dailyTasks[task.originalIndex]?.kpi || ''}
                                                  onChange={(e) => {
                                                    if (editedPlan) {
                                                      const newPlan = { ...editedPlan };
                                                      newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].kpi = e.target.value;
                                                      setEditedPlan(newPlan);
                                                    }
                                                  }}
                                                />
                                              </div>
                                              
                                              {/* Social Media Post Draft - Edit Mode */}
                                              {(task.postDraft || editedPlan?.weeklyPlan[weekIndex]?.dailyTasks[task.originalIndex]?.postDraft) && (
                                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                  <h6 className="font-medium text-blue-800 text-xs mb-2">
                                                    {task.postDraft?.title ? 'Reddit Post Draft' : 'Social Media Post Draft'}
                                                  </h6>
                                                  
                                                  {/* Title */}
                                                  <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-blue-700">Title:</Label>
                                                    <Input
                                                      className="text-xs bg-white"
                                                      placeholder="Post title (for Reddit posts)"
                                                      value={editedPlan?.weeklyPlan[weekIndex]?.dailyTasks[task.originalIndex]?.postDraft?.title || ''}
                                                      onChange={(e) => {
                                                        if (editedPlan) {
                                                          const newPlan = { ...editedPlan };
                                                          if (!newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft) {
                                                            newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft = {};
                                                          }
                                                          newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft.title = e.target.value;
                                                          setEditedPlan(newPlan);
                                                        }
                                                      }}
                                                    />
                                                  </div>
                                                  
                                                  {/* Body */}
                                                  <div className="space-y-2 mt-2">
                                                    <Label className="text-xs font-semibold text-blue-700">Body:</Label>
                                                    <Textarea
                                                      className="text-xs bg-white"
                                                      placeholder="Post body content"
                                                      rows={4}
                                                      value={editedPlan?.weeklyPlan[weekIndex]?.dailyTasks[task.originalIndex]?.postDraft?.body || ''}
                                                      onChange={(e) => {
                                                        if (editedPlan) {
                                                          const newPlan = { ...editedPlan };
                                                          if (!newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft) {
                                                            newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft = {};
                                                          }
                                                          newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft.body = e.target.value;
                                                          setEditedPlan(newPlan);
                                                        }
                                                      }}
                                                    />
                                                  </div>
                                                  
                                                  {/* Thread */}
                                                  <div className="space-y-2 mt-2">
                                                    <Label className="text-xs font-semibold text-blue-700">Thread (for Twitter posts):</Label>
                                                    <div className="space-y-2">
                                                      {(editedPlan?.weeklyPlan[weekIndex]?.dailyTasks[task.originalIndex]?.postDraft?.thread || []).map((tweet: string, tweetIndex: number) => (
                                                        <div key={tweetIndex} className="flex items-start space-x-2">
                                                          <span className="text-xs text-blue-600 mt-1">{tweetIndex + 1}.</span>
                                                          <Input
                                                            className="text-xs bg-white flex-grow"
                                                            value={tweet}
                                                            onChange={(e) => {
                                                              if (editedPlan) {
                                                                const newPlan = { ...editedPlan };
                                                                if (!newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft) {
                                                                  newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft = {};
                                                                }
                                                                if (!newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft.thread) {
                                                                  newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft.thread = [];
                                                                }
                                                                newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft.thread[tweetIndex] = e.target.value;
                                                                setEditedPlan(newPlan);
                                                              }
                                                            }}
                                                          />
                                                          <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive h-6 w-6 p-0"
                                                            onClick={() => {
                                                              if (editedPlan) {
                                                                const newPlan = { ...editedPlan };
                                                                if (newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft?.thread) {
                                                                  newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft.thread = 
                                                                    newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft.thread.filter((_, i) => i !== tweetIndex);
                                                                }
                                                                setEditedPlan(newPlan);
                                                              }
                                                            }}
                                                          >
                                                            <X className="w-3 h-3" />
                                                          </Button>
                                                        </div>
                                                      ))}
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs h-7"
                                                        onClick={() => {
                                                          if (editedPlan) {
                                                            const newPlan = { ...editedPlan };
                                                            if (!newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft) {
                                                              newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft = {};
                                                            }
                                                            if (!newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft.thread) {
                                                              newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft.thread = [];
                                                            }
                                                            newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft.thread.push('');
                                                            setEditedPlan(newPlan);
                                                          }
                                                        }}
                                                      >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        Add Tweet
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                              
                                              {/* Add Post Draft Button - Only show if no post draft exists */}
                                              {!task.postDraft && !editedPlan?.weeklyPlan[weekIndex]?.dailyTasks[task.originalIndex]?.postDraft && (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="text-xs h-7 mt-2"
                                                  onClick={() => {
                                                    if (editedPlan) {
                                                      const newPlan = { ...editedPlan };
                                                      newPlan.weeklyPlan[weekIndex].dailyTasks[task.originalIndex].postDraft = {
                                                        title: '',
                                                        body: '',
                                                        thread: []
                                                      };
                                                      setEditedPlan(newPlan);
                                                    }
                                                  }}
                                                >
                                                  <Plus className="w-3 h-3 mr-1" />
                                                  Add Social Media Post Draft
                                                </Button>
                                              )}
                                            </>
                                          ) : (
                                            <>
                                              <h6 className="font-medium text-foreground text-sm">{task.description}</h6>
                                              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                                <span><Clock className="w-3 h-3 mr-1 inline" />{task.timeEstimate}</span>
                                                <span><Wrench className="w-3 h-3 mr-1 inline" />{task.tool}</span>
                                                <span><Target className="w-3 h-3 mr-1 inline" />{task.kpi}</span>
                                              </div>
                                              
                                              {/* Social Media Post Draft */}
                                              {task.postDraft && (
                                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                  <h6 className="font-medium text-blue-800 text-xs mb-2">
                                                    {task.postDraft.title ? 'Reddit Post Draft' : 'Social Media Post Draft'}
                                                  </h6>
                                                  {task.postDraft.title && (
                                                    <div className="space-y-2">
                                                      <p className="text-xs font-semibold text-blue-700">Title:</p>
                                                      <p className="text-xs text-blue-600">{task.postDraft.title}</p>
                                                    </div>
                                                  )}
                                                  {task.postDraft.body && (
                                                    <div className="space-y-2 mt-2">
                                                      <p className="text-xs font-semibold text-blue-700">Body:</p>
                                                      <p className="text-xs text-blue-600 whitespace-pre-wrap">{task.postDraft.body}</p>
                                                    </div>
                                                  )}
                                                  {task.postDraft.thread && (
                                                    <div className="space-y-2">
                                                      <p className="text-xs font-semibold text-blue-700">Thread:</p>
                                                      {task.postDraft.thread.map((tweet: string, index: number) => (
                                                        <p key={index} className="text-xs text-blue-600 pl-2">
                                                          {index + 1}. {tweet}
                                                        </p>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                        {isEditMode && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive flex-shrink-0"
                                            onClick={() => {
                                              if (editedPlan) {
                                                const newPlan = { ...editedPlan };
                                                newPlan.weeklyPlan[weekIndex].dailyTasks = newPlan.weeklyPlan[weekIndex].dailyTasks.filter((_, i) => i !== task.originalIndex);
                                                setEditedPlan(newPlan);
                                              }
                                            }}
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ));
                            })()}

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
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Wrench className="text-secondary w-5 h-5" />
                        <h4 className="text-lg font-semibold">Recommended Tools</h4>
                      </div>
                      {isEditMode && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            if (editedPlan) {
                              const newTool = {
                                name: "New Tool",
                                purpose: "Tool purpose",
                                pricing: "Free / Paid"
                              };
                              setEditedPlan({
                                ...editedPlan,
                                recommendedTools: [...editedPlan.recommendedTools, newTool]
                              });
                            }
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Tool
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {(isEditMode ? editedPlan?.recommendedTools || [] : generatedPlan.recommendedTools).map((tool, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                            <Wrench className="text-secondary w-4 h-4" />
                          </div>
                          <div className="flex-grow">
                            {isEditMode ? (
                              <div className="space-y-2">
                                <Input
                                  className="text-sm font-medium"
                                  placeholder="Tool name"
                                  value={editedPlan?.recommendedTools[index]?.name || ''}
                                  onChange={(e) => {
                                    if (editedPlan) {
                                      const newPlan = { ...editedPlan };
                                      newPlan.recommendedTools[index].name = e.target.value;
                                      setEditedPlan(newPlan);
                                    }
                                  }}
                                />
                                <Input
                                  className="text-xs"
                                  placeholder="Purpose"
                                  value={editedPlan?.recommendedTools[index]?.purpose || ''}
                                  onChange={(e) => {
                                    if (editedPlan) {
                                      const newPlan = { ...editedPlan };
                                      newPlan.recommendedTools[index].purpose = e.target.value;
                                      setEditedPlan(newPlan);
                                    }
                                  }}
                                />
                                <Input
                                  className="text-xs"
                                  placeholder="Pricing"
                                  value={editedPlan?.recommendedTools[index]?.pricing || ''}
                                  onChange={(e) => {
                                    if (editedPlan) {
                                      const newPlan = { ...editedPlan };
                                      newPlan.recommendedTools[index].pricing = e.target.value;
                                      setEditedPlan(newPlan);
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <>
                                <h6 className="font-medium text-foreground text-sm">{tool.name}</h6>
                                <p className="text-xs text-muted-foreground">{tool.purpose}</p>
                                <p className="text-xs text-[hsl(142,76%,36%)] font-medium mt-1">{tool.pricing}</p>
                              </>
                            )}
                          </div>
                          {isEditMode && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                if (editedPlan) {
                                  const newTools = editedPlan.recommendedTools.filter((_, i) => i !== index);
                                  setEditedPlan({
                                    ...editedPlan,
                                    recommendedTools: newTools
                                  });
                                }
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <ChartLine className="text-[hsl(142,76%,36%)] w-5 h-5" />
                        <h4 className="text-lg font-semibold">Key Performance Indicators</h4>
                      </div>
                      {isEditMode && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            if (editedPlan) {
                              const newKPI = {
                                metric: "New KPI",
                                target: "Target value",
                                tracking: "How to track"
                              };
                              setEditedPlan({
                                ...editedPlan,
                                kpis: [...editedPlan.kpis, newKPI]
                              });
                            }
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add KPI
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {(isEditMode ? editedPlan?.kpis || [] : generatedPlan.kpis).map((kpi, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          {isEditMode ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <Input
                                  className="text-sm font-medium flex-grow"
                                  placeholder="KPI metric"
                                  value={editedPlan?.kpis[index]?.metric || ''}
                                  onChange={(e) => {
                                    if (editedPlan) {
                                      const newPlan = { ...editedPlan };
                                      newPlan.kpis[index].metric = e.target.value;
                                      setEditedPlan(newPlan);
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive flex-shrink-0"
                                  onClick={() => {
                                    if (editedPlan) {
                                      const newKPIs = editedPlan.kpis.filter((_, i) => i !== index);
                                      setEditedPlan({
                                        ...editedPlan,
                                        kpis: newKPIs
                                      });
                                    }
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              <Input
                                className="text-xs"
                                placeholder="Target"
                                value={editedPlan?.kpis[index]?.target || ''}
                                onChange={(e) => {
                                  if (editedPlan) {
                                    const newPlan = { ...editedPlan };
                                    newPlan.kpis[index].target = e.target.value;
                                    setEditedPlan(newPlan);
                                  }
                                }}
                              />
                              <Input
                                className="text-xs"
                                placeholder="How to track"
                                value={editedPlan?.kpis[index]?.tracking || ''}
                                onChange={(e) => {
                                  if (editedPlan) {
                                    const newPlan = { ...editedPlan };
                                    newPlan.kpis[index].tracking = e.target.value;
                                    setEditedPlan(newPlan);
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <h6 className="font-medium text-foreground text-sm">{kpi.metric}</h6>
                                <span className="text-sm font-semibold text-[hsl(142,76%,36%)]">{kpi.target}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{kpi.tracking}</p>
                            </>
                          )}
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
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                    onClick={() => sharePlanMutation.mutate()}
                    disabled={sharePlanMutation.isPending}
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Share Plan
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Community Feedback Section */}
          <div className="mt-16">
            <CommunityFeedback />
          </div>
        </div>
      </main>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Launch Plan</DialogTitle>
            <DialogDescription>
              Share this launch plan with your team or save the link for later access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex items-center space-x-2">
                <Input
                  readOnly
                  value={shareUrl || ''}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={async () => {
                    if (shareUrl) {
                      await navigator.clipboard.writeText(shareUrl);
                      toast({
                        title: "Copied!",
                        description: "Share link copied to clipboard.",
                      });
                    }
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {/* Mobile Share Options */}
            {navigator.share && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  if (shareUrl) {
                    navigator.share({
                      title: 'My Launch Plan',
                      text: 'Check out my 30-day business launch plan!',
                      url: shareUrl,
                    }).catch((err) => console.error('Error sharing:', err));
                  }
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share via Device
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        
      </footer>
    </div>
    </>
  );
}
