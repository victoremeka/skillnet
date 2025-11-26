import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Loader2,
  Plus,
  X,
  ArrowLeft,
  Briefcase,
  Globe,
  DollarSign,
} from "lucide-react";
import type { SafeUser, Profile } from "@shared/schema";

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Korean",
  "Portuguese",
  "Italian",
  "Russian",
  "Arabic",
  "Hindi",
  "Other",
];

const profileSchema = z.object({
  bio: z
    .string()
    .max(1000, "Bio must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  rate: z.string().optional().or(z.literal("")),
  availability: z.enum(["available", "busy"]).optional(),
  skills: z
    .array(
      z.object({
        name: z.string().min(1, "Skill name is required"),
        level: z.string().min(1, "Skill level is required"),
      })
    )
    .max(10, "Maximum 10 skills allowed"),
  portfolio: z
    .array(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional().or(z.literal("")),
        url: z.string().url("Please enter a valid URL"),
      })
    )
    .max(5, "Maximum 5 portfolio items allowed"),
  languages: z.array(z.string()).max(5, "Maximum 5 languages allowed"),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface ProfileEditProps {
  user: SafeUser | null;
  updateUser: (user: SafeUser) => void;
}

export default function ProfileEdit({ user, updateUser }: ProfileEditProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newLanguage, setNewLanguage] = useState("");

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["/api/profile"],
    enabled: !!user && user.role === "student",
    select: (data: any) => data.profile || data,
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: "",
      rate: "",
      availability: "available",
      skills: [],
      portfolio: [],
      languages: [],
    },
    values: profile
      ? {
          bio: profile.bio || "",
          rate: profile.rate || "",
          availability: (profile.availability as "available" | "busy") || "available",
          skills: (profile.skills as { name: string; level: string }[]) || [],
          portfolio:
            (profile.portfolio as { title: string; description: string; url: string }[]) ||
            [],
          languages: (profile.languages as string[]) || [],
        }
      : undefined,
  });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  const {
    fields: portfolioFields,
    append: appendPortfolio,
    remove: removePortfolio,
  } = useFieldArray({
    control: form.control,
    name: "portfolio",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return api.patch("/api/profile", {
        bio: data.bio || null,
        rate: data.rate ? parseFloat(data.rate) : null,
        availability: data.availability,
        skills: data.skills,
        portfolio: data.portfolio,
        languages: data.languages,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const addLanguage = (language: string) => {
    if (!language) return;
    const currentLanguages = form.getValues("languages");
    if (!currentLanguages.includes(language) && currentLanguages.length < 5) {
      form.setValue("languages", [...currentLanguages, language]);
    }
    setNewLanguage("");
  };

  const removeLanguage = (language: string) => {
    const currentLanguages = form.getValues("languages");
    form.setValue(
      "languages",
      currentLanguages.filter((l) => l !== language)
    );
  };

  // Not logged in
  if (!user) {
    return (
      <div className="container max-w-2xl py-12">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to edit your profile</CardDescription>
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

  // Not a student
  if (user.role !== "student") {
    return (
      <div className="container max-w-2xl py-12">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Students Only</CardTitle>
            <CardDescription>
              Profile editing is only available for student accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
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
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your profile to attract more clients
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">About You</h3>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 1000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate ($)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="25.00"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Your default hourly rate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Availability</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select availability" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="available">
                              Available for work
                            </SelectItem>
                            <SelectItem value="busy">
                              Busy / Not available
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Let clients know if you're taking new projects
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Skills */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Skills
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add up to 10 skills that showcase your expertise
                    </p>
                  </div>
                  {skillFields.length < 10 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendSkill({ name: "", level: "Intermediate" })}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Skill
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {skillFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <FormField
                        control={form.control}
                        name={`skills.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="e.g., React, Python, UI Design" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`skills.${index}.level`}
                        render={({ field }) => (
                          <FormItem className="w-40">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SKILL_LEVELS.map((level) => (
                                  <SelectItem key={level} value={level}>
                                    {level}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSkill(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {skillFields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                      No skills added yet. Click "Add Skill" to get started.
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Languages */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Languages
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Languages you can communicate in (max 5)
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="languages"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {field.value.map((lang) => (
                          <Badge key={lang} variant="secondary" className="gap-1">
                            {lang}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeLanguage(lang)}
                            />
                          </Badge>
                        ))}
                      </div>
                      {field.value.length < 5 && (
                        <div className="flex gap-2">
                          <Select value={newLanguage} onValueChange={setNewLanguage}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              {LANGUAGES.filter((l) => !field.value.includes(l)).map(
                                (lang) => (
                                  <SelectItem key={lang} value={lang}>
                                    {lang}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addLanguage(newLanguage)}
                            disabled={!newLanguage}
                          >
                            Add
                          </Button>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Portfolio */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Portfolio</h3>
                    <p className="text-sm text-muted-foreground">
                      Showcase your best work (max 5 items)
                    </p>
                  </div>
                  {portfolioFields.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendPortfolio({ title: "", description: "", url: "" })
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Project
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {portfolioFields.map((field, index) => (
                    <Card key={field.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-sm font-medium text-muted-foreground">
                            Project {index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePortfolio(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name={`portfolio.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Project name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`portfolio.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Brief description of the project"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`portfolio.${index}.url`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>URL</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="https://example.com/my-project"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {portfolioFields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                      No portfolio items yet. Click "Add Project" to showcase your work.
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}