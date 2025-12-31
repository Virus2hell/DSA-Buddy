import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin } from "lucide-react";
import { useCallback } from "react";

export function Footer() {
  // Smooth scroll handler
  const scrollToSection = useCallback((e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  return (
    <footer className="py-12 px-4 border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="DSA Socio"
                  className="w-full h-full object-cover rounded-xl drop-shadow-lg"
                />
              </div>
              <span className="text-xl font-bold">DSA Socio</span>
            </Link>
            <p className="text-muted-foreground max-w-sm leading-relaxed">
              Making DSA practice more collaborative, organized, and motivating by connecting you with the right partners.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-6 text-foreground">Product</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#features"
                  onClick={(e) => scrollToSection(e, 'features')}
                  className="block text-muted-foreground hover:text-foreground hover:font-medium transition-all duration-300 cursor-pointer py-1"
                >
                  Features
                </a>
              </li>
              <li>
                <a 
                  href="#how-it-works"
                  onClick={(e) => scrollToSection(e, 'how-it-works')}
                  className="block text-muted-foreground hover:text-foreground hover:font-medium transition-all duration-300 cursor-pointer py-1"
                >
                  How it Works
                </a>
              </li>
              <li>
                <a 
                  href="#benefits"
                  onClick={(e) => scrollToSection(e, 'benefits')}
                  className="block text-muted-foreground hover:text-foreground hover:font-medium transition-all duration-300 cursor-pointer py-1"
                >
                  Benefits
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-semibold mb-6 text-foreground">Connect</h4>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-secondary/50 hover:bg-primary hover:text-primary-foreground backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:shadow-glow transition-all duration-300 flex items-center justify-center group"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-secondary/50 hover:bg-primary hover:text-primary-foreground backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:shadow-glow transition-all duration-300 flex items-center justify-center group"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-secondary/50 hover:bg-primary hover:text-primary-foreground backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:shadow-glow transition-all duration-300 flex items-center justify-center group"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-border/50 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} DSA Socio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
