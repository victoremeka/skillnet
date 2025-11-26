import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Send,
  Loader2,
  MessageSquare,
  User,
} from "lucide-react";
import {
  formatRelativeTime,
  getInitials,
  getStatusColor,
  getStatusLabel,
  cn,
} from "@/lib/utils";
import type {
  SafeUser,
  ProjectWithDetails,
  MessageWithSender,
} from "@shared/schema";

const messageSchema = z.object({
  body: z.string().min(1, "Message cannot be empty"),
});

type MessageForm = z.infer<typeof messageSchema>;

interface MessagesProps {
  projectId: string;
  user: SafeUser | null;
}

export default function Messages({ projectId, user }: MessagesProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      body: "",
    },
  });

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery<ProjectWithDetails>({
    queryKey: [`/api/projects/${projectId}`],
  });

  // Fetch messages with polling
  const {
    data: messages,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery<MessageWithSender[]>({
    queryKey: [`/api/projects/${projectId}/messages`],
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageForm) => {
      return api.post(`/api/projects/${projectId}/messages`, data);
    },
    onSuccess: () => {
      form.reset();
      refetchMessages();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MessageForm) => {
    sendMessageMutation.mutate(data);
  };

  // Not logged in
  if (!user) {
    return (
      <div className="container py-12">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to view messages
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

  if (projectLoading || messagesLoading) {
    return (
      <div className="container py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Project Not Found</CardTitle>
            <CardDescription>
              The project you're looking for doesn't exist.
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

  // Check if user is participant
  const isClient = user.id === project.clientId;
  const hasProposal = project.proposals?.some((p) => p.providerId === user.id);
  const isParticipant = isClient || hasProposal;

  if (!isParticipant) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have access to this project's messages.
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

  // Determine the other party for display
  const otherParty = isClient
    ? project.acceptedProposal?.provider || project.proposals?.[0]?.provider
    : project.client;

  return (
    <div className="container py-8 max-w-4xl">
      {/* Back Button */}
      <Button variant="ghost" className="mb-6" asChild>
        <Link href={`/projects/${projectId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Link>
      </Button>

      <div className="grid gap-6">
        {/* Project Info Header */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h2 className="font-semibold">{project.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {otherParty
                      ? `Conversation with ${otherParty.name}`
                      : "Project Messages"}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Messages Container */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader className="border-b py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Messages</CardTitle>
              <span className="text-sm text-muted-foreground">
                {messages?.length || 0} message{(messages?.length || 0) !== 1 ? "s" : ""}
              </span>
            </div>
          </CardHeader>

          {/* Messages List */}
          <CardContent
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages && messages.length > 0 ? (
              <>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === user.id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No messages yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Start the conversation by sending a message below.
                </p>
              </div>
            )}
          </CardContent>

          {/* Message Input */}
          <div className="border-t p-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex gap-2"
              >
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Type your message..."
                          autoComplete="off"
                          disabled={sendMessageMutation.isPending}
                          {...field}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={sendMessageMutation.isPending || !form.watch("body").trim()}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: MessageWithSender;
  isOwn: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%]",
        isOwn ? "ml-auto flex-row-reverse" : ""
      )}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs",
            isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {getInitials(message.sender.name)}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex flex-col",
          isOwn ? "items-end" : "items-start"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{message.sender.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(message.createdAt)}
          </span>
        </div>
        <div
          className={cn(
            "rounded-lg px-4 py-2 text-sm",
            isOwn
              ? "bg-primary text-primary-foreground rounded-tr-none"
              : "bg-muted rounded-tl-none"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                📎 {attachment.filename}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}