import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Clock,
  DollarSign,
  Briefcase,
  FileText,
  ArrowRight,
  Filter,
} from "lucide-react";
import {
  formatCurrency,
  formatRelativeTime,
  getInitials,
} from "@/lib/utils";
import type { SafeUser, ProjectWithDetails } from "@shared/schema";

interface BrowseProjectsProps {
  user: SafeUser | null;
}

export default function BrowseProjects({ user }: BrowseProjectsProps) {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects, isLoading } = useQuery<ProjectWithDetails[]>({
    queryKey: ["/api/projects", "open"],
    queryFn: () => api.get<ProjectWithDetails[]>("/api/projects?status=open"),
  });

  // Filter projects based on search
  const filteredProjects = projects?.filter((project) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.title.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query)
    );
  });

  // Not logged in
  if (!user) {
    return (
      <div className="container py-12">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to browse and apply to projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not a student
  if (user.role !== "student") {
    return (
      <div className="container py-12">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Students Only</CardTitle>
            <CardDescription>
              Project browsing is for student freelancers looking for work. As a
              client, you can post your own projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild>
              <Link href="/post-project">Post a Project</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Projects</h1>
        <p className="text-muted-foreground">
          Find projects that match your skills and submit proposals
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results Count */}
      {!isLoading && filteredProjects && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredProjects.length} open project
          {filteredProjects.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Projects List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-32" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} userId={user.id} />
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {searchQuery
                ? "Try adjusting your search query"
                : "There are no open projects at the moment. Check back later!"}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  userId,
}: {
  project: ProjectWithDetails;
  userId: string;
}) {
  const hasSubmittedProposal = project.proposals?.some(
    (p) => p.providerId === userId
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                Open
              </Badge>
              {hasSubmittedProposal && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                  Proposal Submitted
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl">{project.title}</CardTitle>
          </div>
          {project.budgetMin && project.budgetMax && (
            <div className="text-right">
              <p className="text-lg font-bold text-primary">
                {formatCurrency(project.budgetMin)} -{" "}
                {formatCurrency(project.budgetMax)}
              </p>
              <p className="text-xs text-muted-foreground">Budget</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground line-clamp-3">
          {project.description}
        </p>

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Client Info */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(project.client.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{project.client.name}</p>
              <p className="text-xs text-muted-foreground">Client</p>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatRelativeTime(project.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {project.proposals?.length || 0} proposal
              {(project.proposals?.length || 0) !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="ml-auto">
          <Link href={`/projects/${project.id}`}>
            {hasSubmittedProposal ? "View Project" : "View & Apply"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}