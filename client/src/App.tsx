import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";

// Layout components
import Navbar from "@/components/navbar";

// Page components
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import VerifyUniversity from "@/pages/verify-university";
import Dashboard from "@/pages/dashboard";
import Marketplace from "@/pages/marketplace";
import ServiceDetail from "@/pages/service-detail";
import CreateService from "@/pages/create-service";
import PostProject from "@/pages/post-project";
import ProjectDetail from "@/pages/project-detail";
import Messages from "@/pages/messages";
import SubmitReview from "@/pages/submit-review";
import ProfileEdit from "@/pages/profile-edit";
import BrowseProjects from "@/pages/browse-projects";
import NotFound from "@/pages/not-found";

import type { SafeUser } from "@shared/schema";

function App() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: SafeUser, token: string) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (userData: SafeUser) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />
      <main>
        <Switch>
          {/* Public routes */}
          <Route path="/">
            {user ? <Dashboard user={user} /> : <Landing />}
          </Route>
          <Route path="/login">
            <Login onLogin={handleLogin} user={user} />
          </Route>
          <Route path="/register">
            <Register onLogin={handleLogin} user={user} />
          </Route>

          {/* Service marketplace (public) */}
          <Route path="/marketplace">
            <Marketplace user={user} />
          </Route>
          <Route path="/services/:id">
            {(params) => <ServiceDetail serviceId={params.id} user={user} />}
          </Route>

          {/* Protected routes */}
          <Route path="/verify-university">
            <VerifyUniversity user={user} updateUser={updateUser} />
          </Route>
          <Route path="/dashboard">
            <Dashboard user={user} />
          </Route>
          <Route path="/create-service">
            <CreateService user={user} />
          </Route>
          <Route path="/post-project">
            <PostProject user={user} />
          </Route>
          <Route path="/browse-projects">
            <BrowseProjects user={user} />
          </Route>
          <Route path="/projects/:id">
            {(params) => <ProjectDetail projectId={params.id} user={user} />}
          </Route>
          <Route path="/projects/:id/messages">
            {(params) => <Messages projectId={params.id} user={user} />}
          </Route>
          <Route path="/projects/:id/review">
            {(params) => <SubmitReview projectId={params.id} user={user} />}
          </Route>
          <Route path="/profile/edit">
            <ProfileEdit user={user} updateUser={updateUser} />
          </Route>

          {/* 404 */}
          <Route>
            <NotFound />
          </Route>
        </Switch>
      </main>
      <Toaster />
    </div>
  );
}

export default App;