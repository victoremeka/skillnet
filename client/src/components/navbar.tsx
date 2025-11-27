import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Briefcase,
  LayoutDashboard,
  ShoppingBag,
  GraduationCap,
  FolderSearch,
  Bell,
} from "lucide-react";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import type { SafeUser, Notification } from "@shared/schema";

// Notification Bell Component
function NotificationBell() {
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30000, // poll every 30s
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">No notifications</div>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start gap-1 cursor-pointer ${!n.read ? "bg-muted/50" : ""}`}
              onClick={() => {
                if (!n.read) markRead.mutate(n.id);
                if (n.linkUrl) window.location.href = n.linkUrl;
              }}
            >
              <span className="font-medium text-sm">{n.title}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{n.message}</span>
              <span className="text-xs text-muted-foreground">{formatRelativeTime(n.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NavbarProps {
  user: SafeUser | null;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const [location, navigate] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">SkillNet</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-6">
          <Link
            href="/marketplace"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/marketplace")
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            Services
          </Link>
          {user?.role === "student" && (
            <Link
              href="/browse-projects"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/browse-projects")
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              Find Projects
            </Link>
          )}
          {user && (
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/dashboard")
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              Dashboard
            </Link>
          )}
          {user?.role === "client" && (
            <Link
              href="/post-project"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/post-project")
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              Post Project
            </Link>
          )}
          {user?.role === "student" && (
            <Link
              href="/create-service"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/create-service")
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              Create Service
            </Link>
          )}
        </div>

        {/* Desktop Auth / User Menu */}
        <div className="hidden md:flex md:items-center md:space-x-4">
          {user ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />
              
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {user.role}
                      {user.role === "student" && !user.universityVerified && (
                        <span className="ml-1 text-yellow-600">(Unverified)</span>
                      )}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {user.role === "student" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/edit" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Link>
                    </DropdownMenuItem>
                    {!user.universityVerified && (
                      <DropdownMenuItem asChild>
                        <Link href="/verify-university" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Verify University
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 space-y-4">
            <Link
              href="/marketplace"
              className="flex items-center space-x-2 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Services</span>
            </Link>
            {user?.role === "student" && (
              <Link
                href="/browse-projects"
                className="flex items-center space-x-2 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <FolderSearch className="h-5 w-5" />
                <span>Find Projects</span>
              </Link>
            )}
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                {user.role === "client" && (
                  <Link
                    href="/post-project"
                    className="flex items-center space-x-2 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Briefcase className="h-5 w-5" />
                    <span>Post Project</span>
                  </Link>
                )}
                {user.role === "student" && (
                  <>
                    <Link
                      href="/create-service"
                      className="flex items-center space-x-2 py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                      <span>Create Service</span>
                    </Link>
                    <Link
                      href="/profile/edit"
                      className="flex items-center space-x-2 py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      <span>Edit Profile</span>
                    </Link>
                  </>
                )}
              </>
            )}
            <div className="pt-4 border-t">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {user.role}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Button variant="outline" asChild>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      Log in
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                      Sign up
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;