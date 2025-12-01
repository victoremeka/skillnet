import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  MessageSquare,
  Star,
  CheckCircle,
  Send,
  Loader2,
  User,
  AlertCircle,
  Check,
  FileText,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getStatusColor,
  getStatusLabel,
  getInitials,
} from "@/lib/utils";
import type {
  SafeUser,
  ProjectWithDetails,
  ProposalWithProvider,
  Transaction,
} from "@shared/schema";

// Platform fee percentage (must match server-side constant)
const PLATFORM_FEE_PERCENTAGE = 0.10;

const proposalSchema = z.object({
  coverLetter: z
    .string()
    .min(50, "Cover letter must be at least 50 characters")
    .max(2000, "Cover letter must be less than 2000 characters"),
  price: z.string().min(1, "Please enter your price"),
  deliveryDays: z.string().min(1, "Please enter delivery time"),
});

type ProposalForm = z.infer<typeof proposalSchema>;

interface ProjectDetailProps {
  projectId: string;
  user: SafeUser | null;
}

export default function ProjectDetail({ projectId, user }: ProjectDetailProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [acceptingProposalId, setAcceptingProposalId] = useState<string | null>(null);

  const {
    data: project,
    isLoading,
    error,
  } = useQuery<ProjectWithDetails>({
    queryKey: [`/api/projects/${projectId}`],
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: [`/api/payments/transactions?projectId=${projectId}`],
    enabled: !!project,
  });

  const proposalForm = useForm<ProposalForm>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      coverLetter: "",
      price: "",
      deliveryDays: "",
    },
  });

  const submitProposalMutation = useMutation({
    mutationFn: async (data: ProposalForm) => {
      return api.post("/api/proposals", {
        projectId,
        coverLetter: data.coverLetter,
        price: parseFloat(data.price),
        deliveryDays: parseInt(data.deliveryDays),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      setShowProposalDialog(false);
      proposalForm.reset();
      toast({
        title: "Proposal submitted!",
        description: "The client will be notified of your proposal.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit proposal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const acceptProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      return api.post(`/api/projects/${projectId}/accept`, { proposalId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      setAcceptingProposalId(null);
      toast({
        title: "Proposal accepted!",
        description: "The project is now in progress.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept proposal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return api.patch(`/api/projects/${projectId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: "Project updated!",
        description: "Project status has been updated.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const releasePaymentMutation = useMutation({
    mutationFn: async () => {
      return api.post("/api/payments/release", { projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: "Payment released!",
        description: "The funds have been released to the freelancer.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to release payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitProposal = (data: ProposalForm) => {
    submitProposalMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
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
              The project you're looking for doesn't exist or has been removed.
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

  const isClient = user?.id === project.clientId;
  const isAcceptedProvider = project.acceptedProposal?.providerId === user?.id;
  const hasSubmittedProposal = project.proposals?.some(
    (p) => p.providerId === user?.id
  );
  const userProposal = project.proposals?.find((p) => p.providerId === user?.id);

  return (
    <div className="container py-8">
      {/* Back Button */}
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                    {project.acceptedProposal && (
                      <Badge variant="secondary">
                        Working with {project.acceptedProposal.provider.name}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {project.description}
              </p>

              <Separator />

              <div className="flex flex-wrap gap-6 text-sm">
                {project.budgetMin && project.budgetMax && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Budget: {formatCurrency(project.budgetMin)} -{" "}
                      {formatCurrency(project.budgetMax)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Posted {formatRelativeTime(project.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{project.proposals?.length || 0} proposals</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/projects/${projectId}/messages`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </Link>
              </Button>
              {project.status === "completed" && (
                <Button variant="outline" asChild>
                  <Link href={`/projects/${projectId}/review`}>
                    <Star className="mr-2 h-4 w-4" />
                    Leave Review
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Action Buttons based on role and status */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Student Actions */}
                {user.role === "student" && project.status === "open" && (
                  <>
                    {hasSubmittedProposal ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>You've already submitted a proposal</span>
                      </div>
                    ) : (
                      <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
                        <DialogTrigger asChild>
                          <Button>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Proposal
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Submit a Proposal</DialogTitle>
                            <DialogDescription>
                              Convince the client why you're the right fit for this project.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...proposalForm}>
                            <form
                              onSubmit={proposalForm.handleSubmit(onSubmitProposal)}
                              className="space-y-4"
                            >
                              <FormField
                                control={proposalForm.control}
                                name="coverLetter"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Cover Letter</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Explain why you're a great fit for this project..."
                                        className="min-h-[150px]"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Minimum 50 characters
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                  control={proposalForm.control}
                                  name="price"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Your Price (₦)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="1"
                                          placeholder="400000"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={proposalForm.control}
                                  name="deliveryDays"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Delivery (days)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="1"
                                          placeholder="7"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <DialogFooter>
                                <Button
                                  type="submit"
                                  disabled={submitProposalMutation.isPending}
                                >
                                  {submitProposalMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Submitting...
                                    </>
                                  ) : (
                                    "Submit Proposal"
                                  )}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </>
                )}

                {/* Accepted Provider Actions */}
                {isAcceptedProvider && project.status === "in_progress" && (
                  <Button
                    onClick={() => updateStatusMutation.mutate("delivered")}
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Marking...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Mark as Delivered
                      </>
                    )}
                  </Button>
                )}

                {/* Client Actions */}
                {isClient && project.status === "delivered" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          Work has been delivered!
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Review the work and release payment when satisfied.
                        </p>
                        {project.escrowAmount && (
                          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                            <div>Provider will receive: <strong>{formatCurrency(Number(project.escrowAmount) * (1 - PLATFORM_FEE_PERCENTAGE))}</strong></div>
                            <div className="text-xs">Platform fee (10%): {formatCurrency(Number(project.escrowAmount) * PLATFORM_FEE_PERCENTAGE)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => releasePaymentMutation.mutate()}
                      disabled={releasePaymentMutation.isPending}
                      variant="success"
                    >
                      {releasePaymentMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Releasing...
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Approve & Release Payment
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {project.status === "completed" && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Project Completed!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Payment has been released to the freelancer.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Proposals Section - Only visible to client */}
          {isClient && project.status === "open" && project.proposals && project.proposals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Proposals ({project.proposals.length})
              </h2>
              {project.proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onAccept={() => {
                    setAcceptingProposalId(proposal.id);
                    acceptProposalMutation.mutate(proposal.id);
                  }}
                  isAccepting={acceptingProposalId === proposal.id}
                />
              ))}
            </div>
          )}

          {/* User's own proposal */}
          {userProposal && !isClient && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Proposal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{userProposal.coverLetter}</p>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">{formatCurrency(userProposal.price)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{userProposal.deliveryDays} days</span>
                  </div>
                </div>
                {project.acceptedProposalId === userProposal.id && (
                  <Badge variant="success">Accepted!</Badge>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(project.client.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{project.client.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Member since {formatDate(project.client.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accepted Provider Info */}
          {project.acceptedProposal && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Freelancer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(project.acceptedProposal.provider.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {project.acceptedProposal.provider.name}
                      </p>
                      {project.acceptedProposal.provider.universityVerified && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {project.acceptedProposal.provider.profile?.rating && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>
                          {Number(
                            project.acceptedProposal.provider.profile.rating
                          ).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agreed Price</span>
                    <span className="font-medium">
                      {formatCurrency(project.acceptedProposal.price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Time</span>
                    <span className="font-medium">
                      {project.acceptedProposal.deliveryDays} days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Escrow Info */}
          {project.escrowAmount && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Escrow</span>
                    <span className="font-semibold">
                      {formatCurrency(project.escrowAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Platform Fee (10%)</span>
                    <span className="text-muted-foreground">
                      -{formatCurrency(Number(project.escrowAmount) * PLATFORM_FEE_PERCENTAGE)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Provider Receives</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(Number(project.escrowAmount) * (1 - PLATFORM_FEE_PERCENTAGE))}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {project.status === "completed"
                    ? "Payment has been released"
                    : "Funds held securely until project completion"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ProposalCard({
  proposal,
  onAccept,
  isAccepting,
}: {
  proposal: ProposalWithProvider;
  onAccept: () => void;
  isAccepting: boolean;
}) {
  const provider = proposal.provider;
  const profile = provider.profile;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(provider.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{provider.name}</span>
                {provider.universityVerified && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
              {profile?.rating && Number(profile.rating) > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{Number(profile.rating).toFixed(1)}</span>
                  <span>({profile.reviewCount} reviews)</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">
                {proposal.coverLetter}
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1 font-medium">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  {formatCurrency(proposal.price)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {proposal.deliveryDays} day{proposal.deliveryDays !== 1 ? "s" : ""} delivery
                </span>
                <span className="text-muted-foreground">
                  Submitted {formatRelativeTime(proposal.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <Button onClick={onAccept} disabled={isAccepting}>
            {isAccepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Accept
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}