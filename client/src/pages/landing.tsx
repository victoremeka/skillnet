import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  Briefcase,
  Shield,
  MessageSquare,
  Star,
  DollarSign,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container py-24 sm:py-32">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium bg-background">
              <GraduationCap className="mr-2 h-4 w-4 text-primary" />
              Connecting Students with Opportunities
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl text-balance">
              The Marketplace for{" "}
              <span className="text-primary">Student Freelancers</span>
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
              SkillNet connects university students offering professional services
              with clients looking to hire talented young professionals. Verified
              students, secure payments, and quality work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/register">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/marketplace">Browse Services</Link>
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                University Verified
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Secure Payments
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Quality Guarantee
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Why Choose SkillNet?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A platform built specifically for university students and clients who
            value fresh perspectives and quality work.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>University Verified</CardTitle>
              <CardDescription>
                All student freelancers are verified through their university
                email, ensuring authenticity and trust.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <DollarSign className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Secure Escrow Payments</CardTitle>
              <CardDescription>
                Funds are held securely until work is completed and approved,
                protecting both parties.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Direct Communication</CardTitle>
              <CardDescription>
                Built-in messaging system allows seamless communication between
                clients and freelancers.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Star className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Reviews & Ratings</CardTitle>
              <CardDescription>
                Transparent feedback system helps you make informed decisions
                about who to work with.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Briefcase className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Diverse Services</CardTitle>
              <CardDescription>
                From web development to graphic design, find talented students
                across various skill categories.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <GraduationCap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Build Your Portfolio</CardTitle>
              <CardDescription>
                Students gain real-world experience while building a professional
                portfolio of work.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/50 py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our simple process
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {/* For Students */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <CardHeader>
                <div className="inline-flex items-center gap-2 text-primary font-semibold mb-2">
                  <GraduationCap className="h-5 w-5" />
                  For Students
                </div>
                <CardTitle>Start Earning Today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Sign Up & Verify</p>
                    <p className="text-sm text-muted-foreground">
                      Create your account and verify your university email
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Create Services</p>
                    <p className="text-sm text-muted-foreground">
                      List your skills and services with pricing tiers
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Submit Proposals</p>
                    <p className="text-sm text-muted-foreground">
                      Browse projects and submit compelling proposals
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Get Paid</p>
                    <p className="text-sm text-muted-foreground">
                      Complete work and receive secure payments
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* For Clients */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
              <CardHeader>
                <div className="inline-flex items-center gap-2 text-blue-500 font-semibold mb-2">
                  <Briefcase className="h-5 w-5" />
                  For Clients
                </div>
                <CardTitle>Hire Talented Students</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Create Account</p>
                    <p className="text-sm text-muted-foreground">
                      Sign up and set up your client profile
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Post a Project</p>
                    <p className="text-sm text-muted-foreground">
                      Describe your project and set your budget
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Review Proposals</p>
                    <p className="text-sm text-muted-foreground">
                      Compare proposals and select the best fit
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Approve & Pay</p>
                    <p className="text-sm text-muted-foreground">
                      Review deliverables and release payment
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Popular Categories
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find talented students across a wide range of professional skills
          </p>
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {[
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
          ].map((category) => (
            <Link key={category} href={`/marketplace?category=${encodeURIComponent(category)}`}>
              <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="flex items-center justify-center p-6">
                  <span className="text-sm font-medium text-center">{category}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-24">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Join SkillNet today and connect with talented university students or
            find exciting freelance opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link href="/marketplace">Explore Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-bold">SkillNet</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SkillNet. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">
                Terms
              </a>
              <a href="#" className="hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}