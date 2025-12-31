import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const skillLevels = ["Beginner", "Intermediate", "Advanced"];
const roles = ["College Student", "Working Professional"];
const languages = ["Java", "C++", "Python", "JavaScript"];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSignup, setIsSignup] = useState(searchParams.get("mode") === "signup");
  const [loading, setLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [skillLevel, setSkillLevel] = useState<string | null>("");
  const [role, setRole] = useState<string | null>("");
  const [language, setLanguage] = useState<string | null>("");

  // Fixed auth state listener with proper cleanup
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/dashboard", { replace: true });
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard", { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        // Validate form fields
        if (!fullName.trim() || !skillLevel || !role || !language) {
          throw new Error("Please fill all fields");
        }

        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName.trim(),
              skill_level: skillLevel!,
              role: role!,
              preferred_language: language!,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Create profile record in profiles table
          const { error: profileError } = await supabase.from('profiles').insert([{
            user_id: data.user.id,
            full_name: fullName.trim(),
            skill_level: skillLevel!,
            role: role!,
            preferred_language: language!,
          } as any]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
            toast({
              title: "Account created!",
              description: "Profile creation failed. You can update it later.",
              variant: "destructive",
            });
          }

          toast({
            title: "Account created successfully!",
            description: "Welcome to DSA Socio! Redirecting to dashboard...",
          });

          // If email confirmation is NOT required in Supabase settings, user is already signed in
          // Check if session exists after signup
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            navigate("/dashboard", { replace: true });
          } else {
            // If email confirmation is required, show success message but don't auto-redirect
            toast({
              title: "Account created!",
              description: "Please check your email to verify your account, then log in.",
            });
          }
        }
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.user) {
          toast({
            title: "Welcome back!",
            description: "Redirecting to dashboard...",
          });
          navigate("/dashboard", { replace: true });
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Authentication failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    // Reset form when switching modes
    if (isSignup) {
      setFullName("");
      setSkillLevel(null);
      setRole(null);
      setLanguage(null);
    }
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />

        <div className="relative z-10">
          {/* ✅ DESKTOP LOGO - Updated with image */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <img
                src="/logo.png"
                alt="DSA Socio"
                className="w-full h-full object-cover rounded-lg drop-shadow-lg"
              />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">DSA Socio</span>
          </Link>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">
            Find your perfect DSA practice partner
          </h1>
          <p className="text-xl text-primary-foreground/80">
            Connect, collaborate, and conquer algorithms together.
          </p>
        </div>

        <div className="relative z-10 text-primary-foreground/60 text-sm">
          © {new Date().getFullYear()} DSA Socio
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* ✅ MOBILE LOGO - Already correct */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center p-1">
              <img
                src="/logo.png"
                alt="DSA Socio"
                className="w-full h-full object-cover rounded-xl drop-shadow-lg"
              />
            </div>
            <span className="text-xl font-bold">DSA Socio</span>
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {isSignup ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isSignup
              ? "Start your collaborative DSA journey today"
              : "Log in to continue your practice"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {isSignup && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="skillLevel">Skill Level</Label>
                  <Select value={skillLevel || undefined} onValueChange={setSkillLevel} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your skill level" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role || undefined} onValueChange={setRole} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Preferred Language</Label>
                  <Select value={language || undefined} onValueChange={setLanguage} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSignup ? "Create Account" : "Log In"}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              disabled={loading}
              className="text-primary hover:underline font-medium disabled:opacity-50"
            >
              {isSignup ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
