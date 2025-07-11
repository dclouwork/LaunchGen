import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Link2, MessageSquare, User, Building } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CommunityFeedback as FeedbackType } from "@shared/schema";

interface FeedbackWithVote extends FeedbackType {
  userVote?: 'upvote' | 'downvote';
}

export default function CommunityFeedback() {
  const [name, setName] = useState("");
  const [startupName, setStartupName] = useState("");
  const [domain, setDomain] = useState("");
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();

  // Fetch all feedback
  const { data: feedbackData, isLoading } = useQuery<{ success: boolean; feedback: FeedbackWithVote[] }>({
    queryKey: ['/api/feedback'],
  });

  // Create feedback mutation
  const createFeedbackMutation = useMutation({
    mutationFn: async (data: { name?: string; startupName?: string; domain?: string; feedback: string }) => {
      return apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });
      // Reset form
      setName("");
      setStartupName("");
      setDomain("");
      setFeedback("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ feedbackId, voteType }: { feedbackId: number; voteType: 'upvote' | 'downvote' }) => {
      return apiRequest(`/api/feedback/${feedbackId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ voteType }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    createFeedbackMutation.mutate({
      name: name.trim() || undefined,
      startupName: startupName.trim() || undefined,
      domain: domain.trim() || undefined,
      feedback: feedback.trim(),
    });
  };

  const handleVote = (feedbackId: number, voteType: 'upvote' | 'downvote', currentVote?: string) => {
    // If clicking same vote type, do nothing
    if (currentVote === voteType) return;
    
    voteMutation.mutate({ feedbackId, voteType });
  };

  const formatDomain = (domain: string) => {
    if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
      return `https://${domain}`;
    }
    return domain;
  };

  return (
    <div className="space-y-8">
      {/* Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Community Feedback
          </CardTitle>
          <CardDescription>
            Share your thoughts, suggest features, or tell us what you love or hate about LaunchPlan Generator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="startupName">Startup Name (optional)</Label>
                <Input
                  id="startupName"
                  placeholder="Your startup"
                  value={startupName}
                  onChange={(e) => setStartupName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="domain">Website (optional)</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="feedback">Your Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="What features would you like to see? What do you love or hate? Share your thoughts..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-1 min-h-[100px]"
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={createFeedbackMutation.isPending || !feedback.trim()}
            >
              {createFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">What Others Are Saying</h3>
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center">Loading feedback...</p>
            </CardContent>
          </Card>
        ) : feedbackData?.feedback && feedbackData.feedback.length > 0 ? (
          feedbackData.feedback.map((item) => (
            <Card key={item.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {/* Header with user info */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{item.name}</span>
                        {item.startupName && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{item.startupName}</span>
                          </>
                        )}
                      </div>
                      {item.domain && (
                        <a
                          href={formatDomain(item.domain)}
                          target="_blank"
                          rel="dofollow"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Link2 className="w-3 h-3" />
                          {item.domain}
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Feedback content */}
                  <p className="text-foreground whitespace-pre-wrap">{item.feedback}</p>

                  {/* Voting */}
                  <div className="flex items-center gap-4">
                    <Button
                      variant={item.userVote === 'upvote' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleVote(item.id, 'upvote', item.userVote)}
                      disabled={voteMutation.isPending}
                      className="gap-2"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      {item.upvotes}
                    </Button>
                    <Button
                      variant={item.userVote === 'downvote' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleVote(item.id, 'downvote', item.userVote)}
                      disabled={voteMutation.isPending}
                      className="gap-2"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      {item.downvotes}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center">
                No feedback yet. Be the first to share your thoughts!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}