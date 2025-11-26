import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { api, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Star, Loader2, CheckCircle } from "lucide-react";
import { getInitials, cn } from "@/lib/utils";
import type { SafeUser, ProjectWithDetails, Review } from "@shared/schema";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters")
    .max(1000, "Comment must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
});

type ReviewForm = z.infer<typeof reviewSchema>;

interface SubmitReviewProps {
  projectId: string;
  user: SafeUser | null;
}

export default function SubmitReview({ projectId, user }: SubmitReviewProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [hoveredRating, setHoveredRating] = useState(0);

  const {
    data: project,
    isLoading,
    error,
  } = useQuery<ProjectWithDetails>({
    queryKey: [`/api/projects/${projectId}`],
  });

  const form = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const selectedRating = form.watch("rating");

  const submitReviewMutation = useMutation({
    mutationFn: async (data: ReviewForm) => {
      return api.post<Review>(`/api/projects/${projectId}/review`, {
        rating: data.rating,
        comment: data.comment || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
        variant: "success",
      });
      navigate(`/projects/${projectId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReviewForm) => {
    submitReviewMutation.mutate(data);
  };

  // Not logged in
  if (!user) {
    return (
      <div className="container py-12">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to submit a review</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-8 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Project Not Found</CardTitle>
            <CardDescription>
              The project you're trying to review doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is a participant
  const isClient = user.id === project.clientId;
  const isProvider = project.acceptedProposal?.providerId === user.id;

  if (!isClient && !isProvider) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
            <CardDescription>
              Only project participants can submit reviews.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if project is completed or delivered
  if (project.status !== "completed" && project.status !== "delivered") {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Project Not Completed</CardTitle>
            <CardDescription>
              You can only review a project after it has been completed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/projects/${projectId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine who is being reviewed
  const reviewTarget = isClient
    ? project.acceptedProposal?.provider
    : project.client;

  if (!reviewTarget) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Cannot Submit Review</CardTitle>
            <CardDescription>
              Unable to determine who to review for this project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/projects/${projectId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ratingLabels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="container py-8 max-w-2xl">
      {/* Back Button */}
      <Button variant="ghost" className="mb-6" asChild>
        <Link href={`/projects/${projectId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Leave a Review</CardTitle>
              <CardDescription>
                Share your experience working on "{project.title}"
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Review Target Info */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getInitials(reviewTarget.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">
                {isClient ? "Reviewing freelancer" : "Reviewing client"}
              </p>
              <p className="font-semibold text-lg">{reviewTarget.name}</p>
              {reviewTarget.universityVerified && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>University Verified</span>
                </div>
              )}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Star Rating */}
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className="p-1 transition-transform hover:scale-110 focus:outline-none"
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              onClick={() => field.onChange(star)}
                            >
                              <Star
                                className={cn(
                                  "h-10 w-10 transition-colors",
                                  star <= (hoveredRating || selectedRating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300 hover:text-yellow-200"
                                )}
                              />
                            </button>
                          ))}
                        </div>
                        {(hoveredRating || selectedRating) > 0 && (
                          <p className="text-sm font-medium text-center">
                            {ratingLabels[(hoveredRating || selectedRating) - 1]}
                          </p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Comment */}
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share details about your experience..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Help others by sharing specific details about your experience.
                      Minimum 10 characters if provided.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitReviewMutation.isPending || selectedRating === 0}
                >
                  {submitReviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4" />
                      Submit Review
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/projects/${projectId}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}