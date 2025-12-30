import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Code2, 
  BookOpen, 
  Plus, 
  ExternalLink, 
  LogOut,
  CheckCircle2,
  Circle,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Problem {
  id: string;
  name: string;
  link: string;
  solved: boolean;
}

export default function DSASheet() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([
    { id: "1", name: "Two Sum", link: "https://leetcode.com/problems/two-sum/", solved: true },
    { id: "2", name: "Valid Parentheses", link: "https://leetcode.com/problems/valid-parentheses/", solved: true },
    { id: "3", name: "Merge Two Sorted Lists", link: "https://leetcode.com/problems/merge-two-sorted-lists/", solved: false },
    { id: "4", name: "Best Time to Buy and Sell Stock", link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", solved: false },
  ]);
  const [newProblemName, setNewProblemName] = useState("");
  const [newProblemLink, setNewProblemLink] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const toggleSolved = (id: string) => {
    setProblems(problems.map(p => 
      p.id === id ? { ...p, solved: !p.solved } : p
    ));
  };

  const addProblem = () => {
    if (!newProblemName.trim() || !newProblemLink.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both fields",
        variant: "destructive",
      });
      return;
    }

    const newProblem: Problem = {
      id: Date.now().toString(),
      name: newProblemName,
      link: newProblemLink,
      solved: false,
    };

    setProblems([...problems, newProblem]);
    setNewProblemName("");
    setNewProblemLink("");
    setDialogOpen(false);

    toast({
      title: "Problem added!",
      description: `${newProblemName} has been added to your sheet.`,
    });
  };

  const deleteProblem = (id: string) => {
    setProblems(problems.filter(p => p.id !== id));
    toast({
      title: "Problem removed",
      description: "The problem has been removed from your sheet.",
    });
  };

  const solvedCount = problems.filter(p => p.solved).length;
  const totalCount = problems.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">DSA Partner</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              <Link to="/discover" className="text-muted-foreground hover:text-foreground transition-colors">Discover</Link>
              <Link to="/dsa-sheet" className="text-foreground font-medium">DSA Sheet</Link>
              <Link to="/messages" className="text-muted-foreground hover:text-foreground transition-colors">Messages</Link>
            </nav>

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              My DSA Sheet
            </h1>
            <p className="text-muted-foreground">
              Track your problem-solving progress
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="w-4 h-4" />
                Add Problem
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Problem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="problemName">Problem Name</Label>
                  <Input
                    id="problemName"
                    placeholder="e.g., Two Sum"
                    value={newProblemName}
                    onChange={(e) => setNewProblemName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="problemLink">Problem Link</Label>
                  <Input
                    id="problemLink"
                    placeholder="https://leetcode.com/problems/..."
                    value={newProblemLink}
                    onChange={(e) => setNewProblemLink(e.target.value)}
                  />
                </div>
                <Button className="w-full" variant="gradient" onClick={addProblem}>
                  Add Problem
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress Card */}
        <Card className="mb-8 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Overall Progress</p>
                <p className="text-2xl font-bold">
                  {solvedCount} / {totalCount} Problems Solved
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-gradient">
                  {totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full gradient-primary transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (solvedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Problems List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Problems</CardTitle>
          </CardHeader>
          <CardContent>
            {problems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No problems yet. Add your first problem to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {problems.map((problem) => (
                  <div
                    key={problem.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                      problem.solved 
                        ? "bg-success/5 border-success/20" 
                        : "bg-background border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleSolved(problem.id)}
                        className="flex-shrink-0"
                      >
                        {problem.solved ? (
                          <CheckCircle2 className="w-6 h-6 text-success" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                        )}
                      </button>
                      <div>
                        <p className={`font-medium ${problem.solved ? "line-through text-muted-foreground" : ""}`}>
                          {problem.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={problem.solved ? "default" : "secondary"}>
                        {problem.solved ? "Solved" : "Unsolved"}
                      </Badge>
                      <a
                        href={problem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </a>
                      <button
                        onClick={() => deleteProblem(problem.id)}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
