import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
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
import { Briefcase, Loader2, ArrowLeft, DollarSign, Info } from "lucide-react";
import type { SafeUser, Project } from "@shared/schema";

const postProjectSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description must be less than 5000 characters"),
  budgetMin: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      "Must be a valid number"
    ),
  budgetMax: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      "Must be a valid number"
    ),
}).refine(
  (data) => {
    if (data.budgetMin && data.budgetMax) {
      return parseFloat(data.budgetMin) <= parseFloat(data.budgetMax);
    }
    return true;
  },
  {
    message: "Maximum budget must be greater than minimum budget",
    path: ["budgetMax"],
  }
);

type PostProjectForm = z.infer<typeof postProjectSchema>;

interface PostProjectProps {
  user: SafeUser | null;
}

export default function PostProject({ user }: PostProjectProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<PostProjectForm>({
    resolver: zodResolver(postProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      budgetMin: "",
      budgetMax: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: PostProjectForm) => {
      return api.post<Project>("/api/projects", {
        title: data.title,
        description: data.description,
        budgetMin: data.budgetMin ? parseFloat(data.budgetMin) : null,
        budgetMax: data.budgetMax ? parseFloat(data.budgetMax) : null,
      });
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project posted!",
        description: "Your project is now live and accepting proposals.",
        variant: "success",
      });
      navigate(`/projects/${project.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PostProjectForm) => {
    createProjectMutation.mutate(data);
  };

  // Not logged in
  if (!user) {
    return (
      <div className="container py-12">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to post a project
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

  // Not a client
  if (user.role !== "client") {
    return (
      <div className="container py-12">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Clients Only</CardTitle>
            <CardDescription>
              Only client accounts can post projects. As a student, you can browse
              and submit proposals to existing projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild>
              <Link href="/browse-projects">Browse Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      {/* Back Button */}
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Post a New Project</CardTitle>
              <CardDescription>
                Describe your project to attract talented student freelancers
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Build a responsive landing page for my startup"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A clear, descriptive title helps freelancers understand your
                      project at a glance
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your project in detail. Include:
• What you need done
• Key features or requirements
• Any specific skills needed
• Timeline expectations
• Deliverables you expect"
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The more details you provide, the better proposals you'll
                      receive. Minimum 50 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Budget Range (Optional)</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="budgetMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Budget ($)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              placeholder="100"
                              className="pl-7"
                              min={0}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budgetMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Budget ($)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              placeholder="500"
                              className="pl-7"
                              min={0}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Setting a budget range helps freelancers understand your
                  expectations. Leave blank for "open to offers".
                </p>
              </div>

              {/* Tips Section */}
              <Card className="bg-muted/50 border-dashed">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Tips for a great project post:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Be specific about your requirements and expectations</li>
                        <li>Include examples or references if available</li>
                        <li>Mention any technical requirements or constraints</li>
                        <li>State your preferred communication style</li>
                        <li>Set realistic deadlines and budget expectations</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="submit"
                  className="sm:flex-1"
                  disabled={createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting Project...
                    </>
                  ) : (
                    <>
                      <Briefcase className="mr-2 h-4 w-4" />
                      Post Project
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={createProjectMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}