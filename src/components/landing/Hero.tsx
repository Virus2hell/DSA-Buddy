import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, BookOpen, MessageCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Join 1,000+ developers practicing together
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in">
            Find Your Perfect{" "}
            <span className="text-gradient">DSA Partner</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
            Connect with developers at your skill level, track progress together, and master Data Structures & Algorithms through collaborative practice.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in">
            <Button variant="gradient" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Start Practicing Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="#how-it-works">See How it Works</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card shadow-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Smart Matching</p>
                <p className="text-sm text-muted-foreground">Find partners at your level</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-card shadow-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Shared DSA Sheets</p>
                <p className="text-sm text-muted-foreground">Track progress together</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-card shadow-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Real-time Chat</p>
                <p className="text-sm text-muted-foreground">Discuss problems live</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
