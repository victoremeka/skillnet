import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Star,
  Clock,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  ShoppingCart,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getInitials,
} from "@/lib/utils";
import { api } from "@/lib/queryClient";
import type { SafeUser, ServiceWithProvider, ReviewWithAuthor, ProjectWithDetails, Proposal } from "@shared/schema";

// Platform fee percentage (must match server-side constant)
const PLATFORM_FEE_PERCENTAGE = 0.10;

interface ServiceDetailProps {
  serviceId: string;
  user: SafeUser | null;
}

type PricingTier = "basic" | "standard" | "premium";

const requestServiceSchema = z.object({
  requirements: z.string().min(20, "Please provide more detail about your requirements (at least 20 characters)"),
  customBudget: z.string().optional(),
});

type RequestServiceForm = z.infer<typeof requestServiceSchema>;

export default function ServiceDetail({ serviceId, user }: ServiceDetailProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier>("basic");

  const { data: service, isLoading, error } = useQuery<ServiceWithProvider>({
    queryKey: [`/api/services/${serviceId}`],
  });

  const { data: reviews } = useQuery<ReviewWithAuthor[]>({
    queryKey: [`/api/users/${service?.providerId}/reviews`],
    enabled: !!service?.providerId,
  });

  const form = useForm<RequestServiceForm>({
    resolver: zodResolver(requestServiceSchema),
    defaultValues: {
      requirements: "",
      customBudget: "",
    },
  });

  const requestMutation = useMutation({
    mutationFn: async (data: RequestServiceForm) => {
      const payload: { tier: PricingTier; requirements: string; customBudget?: number } = {
        tier: selectedTier,
        requirements: data.requirements,
      };
      if (data.customBudget && parseFloat(data.customBudget) > 0) {
        payload.customBudget = parseFloat(data.customBudget);
      }
      return api.post<{ project: ProjectWithDetails; proposal: Proposal; message: string }>(
        `/api/services/${serviceId}/request`,
        payload
      );
    },
    onSuccess: (data) => {
      const projectId = data.project.id;
      setIsModalOpen(false);
      form.reset();
      toast({
        title: "Service Requested!",
        description: "Your request has been sent to the freelancer. They'll respond shortly.",
        variant: "success",
      });
      // Navigate after state updates
      setTimeout(() => navigate(`/projects/${projectId}`), 100);
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit service request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RequestServiceForm) => {
    if (requestMutation.isPending) return;
    requestMutation.mutate(data);
  };

  const handleDialogChange = (open: boolean) => {
    if (requestMutation.isPending) return;
    setIsModalOpen(open);
  };

  const getTierPrice = (tier: PricingTier): number | null => {
    if (!service) return null;
    switch (tier) {
      case "basic":
        return service.priceBasic;
      case "standard":
        return service.priceStandard;
      case "premium":
        return service.pricePremium;
    }
  };

  const getTierDelivery = (tier: PricingTier): number | null => {
    if (!service?.deliveryDays) return null;
    switch (tier) {
      case "basic":
        return service.deliveryDays;
      case "standard":
        return Math.ceil(service.deliveryDays * 1.5);
      case "premium":
        return service.deliveryDays * 2;
    }
  };

  const getTierDescription = (tier: PricingTier): string | null => {
    if (!service) return null;
    switch (tier) {
      case "basic":
        return service.descriptionBasic;
      case "standard":
        return service.descriptionStandard;
      case "premium":
        return service.descriptionPremium;
    }
  };

  const openRequestModal = (tier: PricingTier) => {
    setSelectedTier(tier);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Service Not Found</CardTitle>
            <CardDescription>
              The service you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/marketplace">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Marketplace
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const provider = service.provider;
  const profile = provider.profile;
  const selectedPrice = getTierPrice(selectedTier);
  const selectedDelivery = getTierDelivery(selectedTier);

  return (
    <div className="container py-8">
      {/* Back Button */}
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/marketplace">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Header */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {service.category}
                </Badge>
                <h1 className="text-3xl font-bold">{service.title}</h1>
              </div>
            </div>

            {/* Provider Quick Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(provider.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{provider.name}</span>
                  {provider.universityVerified && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                {profile && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {profile.rating && parseFloat(String(profile.rating)) > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {parseFloat(String(profile.rating)).toFixed(1)}
                        <span className="text-xs">({profile.reviewCount} reviews)</span>
                      </span>
                    )}
                    {profile.availability && (
                      <Badge className={getStatusColor(profile.availability)}>
                        {getStatusLabel(profile.availability)}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Service Description */}
          <div>
            <h2 className="text-xl font-semibold mb-4">About This Service</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {service.description}
            </p>
          </div>

          {/* Sample Work */}
          {service.sampleUrls && service.sampleUrls.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Sample Work</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {service.sampleUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-primary" />
                    <span className="truncate">Sample {index + 1}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Info */}
          {service.deliveryDays && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Delivery Time</p>
                <p className="text-sm text-muted-foreground">
                  Starting from {service.deliveryDays} day{service.deliveryDays !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}

          {/* Reviews Section */}
          {reviews && reviews.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Reviews</h2>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getInitials(review.author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{review.author.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 my-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Choose a package that fits your needs</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full" onValueChange={(v) => setSelectedTier(v as PricingTier)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic" disabled={!service.priceBasic}>
                    Basic
                  </TabsTrigger>
                  <TabsTrigger value="standard" disabled={!service.priceStandard}>
                    Standard
                  </TabsTrigger>
                  <TabsTrigger value="premium" disabled={!service.pricePremium}>
                    Premium
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 pt-4">
                  {service.priceBasic ? (
                    <>
                      <div className="text-3xl font-bold">
                        {formatCurrency(service.priceBasic)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {service.deliveryDays || "TBD"} days delivery
                      </div>
                      {service.descriptionBasic && (
                        <p className="text-sm text-muted-foreground pt-2 border-t">
                          {service.descriptionBasic}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Not available</p>
                  )}
                </TabsContent>

                <TabsContent value="standard" className="space-y-4 pt-4">
                  {service.priceStandard ? (
                    <>
                      <div className="text-3xl font-bold">
                        {formatCurrency(service.priceStandard)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {service.deliveryDays ? Math.ceil(service.deliveryDays * 1.5) : "TBD"} days delivery
                      </div>
                      {service.descriptionStandard && (
                        <p className="text-sm text-muted-foreground pt-2 border-t">
                          {service.descriptionStandard}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Not available</p>
                  )}
                </TabsContent>

                <TabsContent value="premium" className="space-y-4 pt-4">
                  {service.pricePremium ? (
                    <>
                      <div className="text-3xl font-bold">
                        {formatCurrency(service.pricePremium)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {service.deliveryDays ? service.deliveryDays * 2 : "TBD"} days delivery
                      </div>
                      {service.descriptionPremium && (
                        <p className="text-sm text-muted-foreground pt-2 border-t">
                          {service.descriptionPremium}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Not available</p>
                  )}
                </TabsContent>
              </Tabs>

              <Separator className="my-4" />

              {user ? (
                user.role === "client" ? (
                  <Button 
                    className="w-full" 
                    onClick={() => openRequestModal(selectedTier)}
                    disabled={!getTierPrice(selectedTier)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Request This Service
                  </Button>
                ) : user.id === service.providerId ? (
                  <Button className="w-full" variant="outline" disabled>
                    This is your service
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Only clients can hire
                  </Button>
                )
              ) : (
                <Button className="w-full" asChild>
                  <Link href="/register">
                    Sign up to hire
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Provider Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About the Seller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials(provider.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{provider.name}</span>
                    {provider.universityVerified && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {provider.role}
                  </p>
                </div>
              </div>

              {profile?.bio && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {profile.bio}
                </p>
              )}

              <Separator />

              <div className="space-y-3 text-sm">
                {profile?.rating && parseFloat(String(profile.rating)) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {parseFloat(String(profile.rating)).toFixed(1)} ({profile.reviewCount})
                    </span>
                  </div>
                )}

                {profile?.rate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hourly Rate</span>
                    <span className="font-medium">{formatCurrency(profile.rate)}/hr</span>
                  </div>
                )}

                {profile?.languages && profile.languages.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Languages</span>
                    <span className="font-medium">{profile.languages.join(", ")}</span>
                  </div>
                )}

                {provider.universityEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">University</span>
                    <span className="font-medium text-xs">
                      {provider.universityEmail.split("@")[1]}
                    </span>
                  </div>
                )}
              </div>

              {/* Skills */}
              {profile?.skills && profile.skills.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.slice(0, 6).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Request Service Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Request Service
            </DialogTitle>
            <DialogDescription>
              Tell {provider.name} about your project requirements
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Selected Package Summary */}
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{service.title}</span>
                <Badge>{selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedDelivery} days delivery
                </span>
                <span className="text-lg font-bold text-foreground">
                  {selectedPrice ? formatCurrency(selectedPrice) : "N/A"}
                </span>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <Label htmlFor="requirements">
                Project Requirements <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="requirements"
                placeholder="Describe what you need in detail. Include any specific features, preferences, deadlines, or files you'll provide..."
                className="min-h-[120px]"
                {...form.register("requirements")}
              />
              {form.formState.errors.requirements && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.requirements.message}
                </p>
              )}
            </div>

            {/* Custom Budget (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="customBudget">
                Custom Budget <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="customBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={selectedPrice ? selectedPrice.toString() : "0"}
                  className="pl-7"
                  {...form.register("customBudget")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to use the listed price. Suggest a different amount if you have specific needs.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={requestMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={requestMutation.isPending}>
                {requestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}