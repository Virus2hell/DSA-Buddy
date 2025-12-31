import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Smooth scroll handler
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    // Close mobile menu after click
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <img
                src="/logo.png"
                alt="DSA Socio"
                className="w-full h-full object-cover rounded-xl drop-shadow-lg"
              />
            </div>
            <span className="text-xl font-bold">DSA Socio</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#features" 
              onClick={(e) => scrollToSection(e, 'features')}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              How it Works
            </a>
            <a 
              href="#benefits" 
              onClick={(e) => scrollToSection(e, 'benefits')}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Benefits
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Log in</Link>
            </Button>
            <Button variant="gradient" asChild>
              <Link to="/auth?mode=signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border bg-background/95 backdrop-blur-sm animate-fade-in">
            <nav className="flex flex-col gap-4 p-4">
              <a 
                href="#features" 
                onClick={(e) => scrollToSection(e, 'features')}
                className="text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-accent cursor-pointer"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                onClick={(e) => scrollToSection(e, 'how-it-works')}
                className="text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-accent cursor-pointer"
              >
                How it Works
              </a>
              <a 
                href="#benefits" 
                onClick={(e) => scrollToSection(e, 'benefits')}
                className="text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-accent cursor-pointer"
              >
                Benefits
              </a>
              <div className="flex flex-col gap-3 pt-6 border-t border-border/50">
                <Button variant="outline" asChild>
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button variant="gradient" asChild>
                  <Link to="/auth?mode=signup">Get Started</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
