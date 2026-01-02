import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, BookOpen, MessageCircle } from "lucide-react";
import { MouseEvent } from "react";

export function Hero() {
  function scrollToSection(e: MouseEvent<HTMLAnchorElement>, sectionId: string): void {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: "smooth" });
  }
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Title - Fixed structure */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in">
            Find Your Perfect
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in text-gradient">DSA Partner</h1>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
            Connect with developers at your skill level, track progress together, and master Data Structures & Algorithms through collaborative practice.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in">
            <Button variant="gradient" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Start Practicing Free <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a 
              href="#how-it-works" 
              onClick={(e) => scrollToSection(e, 'how-it-works')}
            >
              See How it Works
            </a>
            </Button>
          </div>

          {/* Colored Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in">
            {/* Smart Matching - GREEN */}
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-card shadow-card border border-border hover:border-green-500/50 hover:shadow-glow-green transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20 group-hover:scale-105 transition-all">
                <Users className="w-6 h-6 stroke-green-400 drop-shadow-sm" strokeWidth={2.5} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-foreground group-hover:text-green-400 transition-colors">Smart Matching</p>
                <p className="text-sm text-muted-foreground">Find partners at your level</p>
              </div>
            </div>

            {/* Shared DSA Sheets - YELLOW */}
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-card shadow-card border border-border hover:border-yellow-500/50 hover:shadow-glow-yellow transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20 group-hover:scale-105 transition-all">
                <BookOpen className="w-6 h-6 stroke-yellow-400 drop-shadow-sm" strokeWidth={2.5} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-foreground group-hover:text-yellow-400 transition-colors">Shared DSA Sheets</p>
                <p className="text-sm text-muted-foreground">Track progress together</p>
              </div>
            </div>

            {/* Real-time Chat - RED */}
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-card shadow-card border border-border hover:border-red-500/50 hover:shadow-glow-red transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20 group-hover:scale-105 transition-all">
                <MessageCircle className="w-6 h-6 stroke-red-400 drop-shadow-sm" strokeWidth={2.5} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-foreground group-hover:text-red-400 transition-colors">Real-time Chat</p>
                <p className="text-sm text-muted-foreground">Discuss problems live</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
