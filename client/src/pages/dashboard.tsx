import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Briefcase,
  Plus,
  Star,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Package,
  Inbox,
  X,
  Send,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getInitials,
  formatRelativeTime,
} from "@/lib/utils";
import type {
  SafeUser,
  ServiceWithProvider,
  ProjectWithDetails,
  Profile,
  ServiceRequest,
} from "@shared/schema";
import { useState } from "react";

interface DashboardProps {
  user: SafeUser | null;
}

export default function Dashboard({ user }: DashboardProps) {
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated
  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="container py-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user.name.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            {user.role === "student"
              ? "Manage your services and track your projects"
              : "Post projects and find talented students"}
          </p>
        </div>
        <div>
          {user.role === "student" ? (
            <Button asChild>
              <Link href="/create-service">
                <Plus className="mr-2 h-4 w-4" />
                Create Service
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/post-project">
                <Plus className="mr-2 h-4 w-4" />
                Post Project
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* University Verification Banner for Students */}
      {user.role === "student" && !user.universityVerified && (
        <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Verify your university email
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Complete verification to unlock all features
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/verify-university">Verify Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {user.role === "student" ? (
        <StudentDashboard user={user} />
      ) : (
        <ClientDashboard user={user} />
      )}
    </div>
  );
}

function StudentDashboard({ user }: { user: SafeUser }) {
  const queryClient = useQueryClient();
  const { data: profileData } = useQuery<{ profile: Profile | null }>({
    queryKey: ["/api/profile"],
  });

  const { data: services, isLoading: servicesLoading } = useQuery<
    ServiceWithProvider[]
  >({
    queryKey: ["/api/services", { providerId: user.id }],
    queryFn: async () => {
      const res = await fetch(`/api/services?providerId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<
    ProjectWithDetails[]
  >({
    queryKey: ["/api/projects"],
  });

  const { data: serviceRequests = [], isLoading: requestsLoading } = useQuery<
    ServiceRequest[]
  >({
    queryKey: ["/api/service-requests"],
    queryFn: async () => {
      const res = await fetch("/api/service-requests", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const pendingRequests = serviceRequests.filter(
    (r) => r.status === "pending" || r.status === "countered",
  );

  const profile = profileData?.profile;

  // Calculate stats
  const activeProjects =
    projects?.filter(
      (p) => p.status === "in_progress" || p.status === "delivered",
    ).length || 0;
  const completedProjects =
    projects?.filter((p) => p.status === "completed").length || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Services
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Services listed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects}</div>
            <p className="text-xs text-muted-foreground">Projects finished</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile?.rating ? Number(profile.rating).toFixed(1) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile?.reviewCount || 0} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Services and Projects */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests" className="relative">
            Service Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="services">My Services</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {requestsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  role="provider"
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No pending requests
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  When clients request your services, they'll appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          {projectsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  userRole="student"
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start submitting proposals to get your first project
                </p>
                <Button asChild>
                  <Link href="/browse-projects">Browse Projects</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          {servicesLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : services && services.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No services yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first service to start receiving orders
                </p>
                <Button asChild>
                  <Link href="/create-service">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Service
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClientDashboard({ user }: { user: SafeUser }) {
  const { data: projects, isLoading } = useQuery<ProjectWithDetails[]>({
    queryKey: ["/api/projects"],
  });

  const { data: serviceRequests = [], isLoading: requestsLoading } = useQuery<
    ServiceRequest[]
  >({
    queryKey: ["/api/service-requests"],
    queryFn: async () => {
      const res = await fetch("/api/service-requests", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const pendingRequests = serviceRequests.filter(
    (r) => r.status === "pending" || r.status === "countered",
  );

  // Calculate stats
  const openProjects = projects?.filter((p) => p.status === "open").length || 0;
  const activeProjects =
    projects?.filter(
      (p) => p.status === "in_progress" || p.status === "delivered",
    ).length || 0;
  const completedProjects =
    projects?.filter((p) => p.status === "completed").length || 0;
  const totalSpent =
    projects
      ?.filter((p) => p.status === "completed" && p.escrowAmount)
      .reduce((sum, p) => sum + (p.escrowAmount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Projects</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openProjects}</div>
            <p className="text-xs text-muted-foreground">Accepting proposals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects}</div>
            <p className="text-xs text-muted-foreground">Projects finished</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Service Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pending Service Requests</h2>
            <Badge variant="secondary">{pendingRequests.length} pending</Badge>
          </div>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <ServiceRequestCard
                key={request.id}
                request={request}
                role="client"
              />
            ))}
          </div>
        </div>
      )}

      {/* Projects List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Projects</h2>
          <Button asChild>
            <Link href="/post-project">
              <Plus className="mr-2 h-4 w-4" />
              Post Project
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                userRole="client"
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Post your first project to find talented students
              </p>
              <Button asChild>
                <Link href="/post-project">
                  <Plus className="mr-2 h-4 w-4" />
                  Post Project
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  userRole,
}: {
  project: ProjectWithDetails;
  userRole: "student" | "client";
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2">
              <h3 className="text-lg font-semibold">{project.title}</h3>
              <Badge className={getStatusColor(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {project.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {project.budgetMin && project.budgetMax && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(project.budgetMin)} -{" "}
                  {formatCurrency(project.budgetMax)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDate(project.createdAt)}
              </span>
              {project.proposals && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {project.proposals.length} proposal
                  {project.proposals.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {project.acceptedProposal && userRole === "client" && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(project.acceptedProposal.provider.name)}
                  </AvatarFallback>
                </Avatar>
                <span>
                  Working with {project.acceptedProposal.provider.name}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${project.id}/messages`}>
                <MessageSquare className="h-4 w-4 mr-1" />
                Messages
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/projects/${project.id}`}>
                View
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceCard({ service }: { service: ServiceWithProvider }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{service.title}</CardTitle>
            <CardDescription>{service.category}</CardDescription>
          </div>
          <Badge variant="secondary">
            {service.priceBasic
              ? formatCurrency(service.priceBasic)
              : "Contact"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
          {service.description}
        </p>
        <div className="flex items-center justify-between">
          {service.deliveryDays && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {service.deliveryDays} days delivery
            </span>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/services/${service.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Service Request Card with accept/decline/counter actions
function ServiceRequestCard({
  request,
  role,
}: {
  request: ServiceRequest;
  role: "provider" | "client";
}) {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState(
    request.price?.toString() || "",
  );
  const [counterDays, setCounterDays] = useState(
    request.deliveryDays?.toString() || "",
  );
  const [counterMsg, setCounterMsg] = useState("");

  // Provider accepts a pending request
  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/service-requests/${request.id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to accept");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      // Navigate to the newly created project
      if (data.project?.id) {
        navigate(`/projects/${data.project.id}`);
      }
    },
  });

  // Provider declines a pending request
  const declineMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/service-requests/${request.id}/decline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to decline");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] }),
  });

  // Client accepts a counter-offer
  const acceptCounterMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/service-requests/${request.id}/accept-counter`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      if (!res.ok) throw new Error("Failed to accept counter-offer");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      // Navigate to the newly created project
      if (data.project?.id) {
        navigate(`/projects/${data.project.id}`);
      }
    },
  });

  // Client cancels their request
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/service-requests/${request.id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to cancel");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] }),
  });

  const counterMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/service-requests/${request.id}/counter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          counterPrice: parseFloat(counterPrice) || null,
          counterDeliveryDays: parseInt(counterDays) || null,
          counterMessage: counterMsg || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to counter");
      return res.json();
    },
    onSuccess: () => {
      setCounterOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
    },
  });

  const statusBadge =
    {
      pending: "bg-blue-100 text-blue-800",
      countered: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
    }[request.status] || "bg-gray-100 text-gray-800";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2">
              <h3 className="text-lg font-semibold">Service Request</h3>
              <Badge className={statusBadge}>
                {request.status === "countered"
                  ? "Counter-offer"
                  : request.status}
              </Badge>
              {request.tier && <Badge variant="outline">{request.tier}</Badge>}
            </div>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {request.requirements}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {request.price && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(request.price)}
                </span>
              )}
              {request.deliveryDays && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {request.deliveryDays} days
                </span>
              )}
              {request.expiresAt && (
                <span className="flex items-center gap-1 text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  Expires {formatRelativeTime(request.expiresAt)}
                </span>
              )}
            </div>
            {request.status === "countered" && request.counterPrice && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Counter-offer:
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {formatCurrency(request.counterPrice)} •{" "}
                  {request.counterDeliveryDays} days
                </p>
                {request.counterMessage && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    {request.counterMessage}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {role === "provider" && request.status === "pending" && (
              <>
                <Button
                  size="sm"
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Send className="h-4 w-4 mr-1" />
                      Counter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Counter-Offer</DialogTitle>
                      <DialogDescription>
                        Propose different terms to the client.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium">Price (₦)</label>
                        <Input
                          type="number"
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                          placeholder="Enter price"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Delivery Days
                        </label>
                        <Input
                          type="number"
                          value={counterDays}
                          onChange={(e) => setCounterDays(e.target.value)}
                          placeholder="Enter days"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Message (optional)
                        </label>
                        <Textarea
                          value={counterMsg}
                          onChange={(e) => setCounterMsg(e.target.value)}
                          placeholder="Explain your counter-offer..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setCounterOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => counterMutation.mutate()}
                        disabled={counterMutation.isPending}
                      >
                        Send Counter-Offer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => declineMutation.mutate()}
                  disabled={declineMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </>
            )}
            {role === "client" && request.status === "countered" && (
              <>
                <Button
                  size="sm"
                  onClick={() => acceptCounterMutation.mutate()}
                  disabled={acceptCounterMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept Counter
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </>
            )}
            {role === "client" && request.status === "pending" && (
              <>
                <Badge variant="outline" className="mr-2">
                  Waiting for response
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel Request
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
