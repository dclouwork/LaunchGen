import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartLine, ChevronRight, ChevronDown, Calendar, Clock, Target, Wrench, Copy, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { type LaunchPlanResponse } from "@shared/schema";
import SEO from "@/components/SEO";

export default function SharePage() {
  const { token } = useParams();
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<{
    success: boolean;
    plan: LaunchPlanResponse;
    isEditable: boolean;
  }>({
    queryKey: [`/api/share/${token}`],
    enabled: !!token,
  });

  const plan = data?.success ? data.plan : null;

  const toggleWeekExpansion = (weekIndex: number) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekIndex]: !prev[weekIndex]
    }));
  };

  const copyToClipboard = async () => {
    if (!plan) return;
    
    try {
      const planText = JSON.stringify(plan, null, 2);
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

  // Generate SEO metadata based on the plan
  const seoTitle = plan ? `${plan.overview.split('.')[0]} - Launch Plan` : "Shared Launch Plan";
  const seoDescription = plan ? 
    `Detailed 30-day launch plan: ${plan.overview.substring(0, 150)}...` : 
    "View this detailed 30-day business launch plan with weekly tasks and daily actions.";
  
  if (isLoading) {
    return (
      <>
        <SEO title="Loading Launch Plan..." description="Loading shared business launch plan..." />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading shared plan...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !plan) {
    return (
      <>
        <SEO 
          title="Plan Not Found - Launch Plan Generator" 
          description="This shared launch plan doesn't exist or has expired."
          noIndex={true}
        />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Plan Not Found</h2>
            <p className="text-muted-foreground">This shared plan doesn't exist or has expired.</p>
            <Link href="/">
              <Button>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title={seoTitle}
        description={seoDescription}
        ogUrl={`${window.location.origin}/share/${token}`}
      />
      <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">Shared Launch Plan</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <ChartLine className="text-[hsl(142,76%,36%)] w-5 h-5" />
                  <h3 className="text-xl font-semibold">30-Day Launch Plan</h3>
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
                  {plan.overview}
                </p>
              </div>

              {/* Week-by-Week Breakdown */}
              <div className="space-y-4">
                {plan.weeklyPlan.map((week, weekIndex) => (
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

          {/* Tools & KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Wrench className="text-secondary w-5 h-5" />
                  <h4 className="text-lg font-semibold">Recommended Tools</h4>
                </div>
                <div className="space-y-3">
                  {plan.recommendedTools.map((tool, index) => (
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
                  <Target className="text-primary w-5 h-5" />
                  <h4 className="text-lg font-semibold">Key Performance Indicators</h4>
                </div>
                <div className="space-y-3">
                  {plan.kpis.map((kpi, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4 py-2">
                      <h6 className="font-semibold text-foreground text-sm">{kpi.metric}</h6>
                      <p className="text-xs text-muted-foreground">Target: {kpi.target}</p>
                      <p className="text-xs text-muted-foreground">Tracking: {kpi.tracking}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}