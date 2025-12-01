import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/queryClient";
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
import { Loader2, Plus, X, Package, ArrowLeft } from "lucide-react";
import type { SafeUser, Service } from "@shared/schema";

const createServiceSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(50, "Description must be at least 50 characters").max(2000, "Description must be less than 2000 characters"),
  category: z.string().min(1, "Please select a category"),
  priceBasic: z.string().optional(),
  priceStandard: z.string().optional(),
  pricePremium: z.string().optional(),
  descriptionBasic: z.string().optional(),
  descriptionStandard: z.string().optional(),
  descriptionPremium: z.string().optional(),
  deliveryDays: z.string().optional(),
  sampleUrls: z.array(z.object({
    url: z.string().url("Please enter a valid URL").or(z.literal("")),
  })).optional(),
}).refine((data) => {
  // At least one price tier must be set
  return data.priceBasic || data.priceStandard || data.pricePremium;
}, {
  message: "Please set at least one pricing tier",
  path: ["priceBasic"],
});

type CreateServiceForm = z.infer<typeof createServiceSchema>;

interface CreateServiceProps {
  user: SafeUser | null;
}

const CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Graphic Design",
  "Writing & Translation",
  "Video & Animation",
  "Music & Audio",
  "Digital Marketing",
  "Data Science",
  "Tutoring",
  "Other",
];

export default function CreateService({ user }: CreateServiceProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<CreateServiceForm>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      priceBasic: "",
      priceStandard: "",
      pricePremium: "",
      descriptionBasic: "",
      descriptionStandard: "",
      descriptionPremium: "",
      deliveryDays: "",
      sampleUrls: [{ url: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sampleUrls",
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: CreateServiceForm) => {
      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        priceBasic: data.priceBasic ? parseFloat(data.priceBasic) : null,
        priceStandard: data.priceStandard ? parseFloat(data.priceStandard) : null,
        pricePremium: data.pricePremium ? parseFloat(data.pricePremium) : null,
        descriptionBasic: data.descriptionBasic || null,
        descriptionStandard: data.descriptionStandard || null,
        descriptionPremium: data.descriptionPremium || null,
        deliveryDays: data.deliveryDays ? parseInt(data.deliveryDays) : null,
        sampleUrls: data.sampleUrls?.filter((s) => s.url).map((s) => s.url) || [],
      };
      return api.post<Service>("/api/services", payload);
    },
    onSuccess: (data) => {
      toast({
        title: "Service created!",
        description: "Your service is now live on the marketplace.",
        variant: "success",
      });
      navigate(`/services/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateServiceForm) => {
    createServiceMutation.mutate(data);
  };

  // Not logged in
  if (!user) {
    return (
      <div className="container max-w-2xl py-12">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to create a service
            </CardDescription>
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
              Only student accounts can create services. If you want to hire,
              try posting a project instead.
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Create a New Service</CardTitle>
              <CardDescription>
                List your skills and start receiving orders
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., I will create a professional React website"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Start with "I will" for best results
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your service in detail. What will you deliver? What's included?"
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum 50 characters. Be specific about what's included.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Pricing Tiers */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing Tiers</h3>
                <p className="text-sm text-muted-foreground">
                  Set up to 3 pricing tiers. At least one is required.
                </p>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="priceBasic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Basic (₦)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="40000"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Entry level</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="descriptionBasic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Basic Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What's included in the basic tier?"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="priceStandard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Standard (₦)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="80000"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Most popular</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="descriptionStandard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Standard Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What's included in the standard tier?"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="pricePremium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Premium (₦)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="150000"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Full package</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="descriptionPremium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Premium Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What's included in the premium tier?"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Delivery Time */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Delivery</h3>

                <FormField
                  control={form.control}
                  name="deliveryDays"
                  render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormLabel>Delivery Time (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          placeholder="7"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Estimated days to complete the basic tier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Sample Work */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Sample Work</h3>
                    <p className="text-sm text-muted-foreground">
                      Add links to your portfolio or past work (optional)
                    </p>
                  </div>
                  {fields.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ url: "" })}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Link
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`sampleUrls.${index}.url`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="https://example.com/my-work"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createServiceMutation.isPending}
                >
                  {createServiceMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Service"
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