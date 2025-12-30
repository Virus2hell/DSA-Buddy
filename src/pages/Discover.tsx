import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code2, Search, Filter, UserPlus, LogOut, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const skillLevels = ["All", "Beginner", "Intermediate", "Advanced"];
const roles = ["All", "College Student", "Working Professional"];
const languages = ["All", "Java", "C++", "Python", "JavaScript"];

interface UserCard {
  id: string;
  name: string;
  skillLevel: string;
  role: string;
  language: string;
}

// Mock data for demonstration
const mockUsers: UserCard[] = [
  { id: "1", name: "Alex Chen", skillLevel: "Intermediate", role: "College Student", language: "Python" },
  { id: "2", name: "Sarah Johnson", skillLevel: "Advanced", role: "Working Professional", language: "Java" },
  { id: "3", name: "Mike Brown", skillLevel: "Beginner", role: "College Student", language: "JavaScript" },
  { id: "4", name: "Emily Davis", skillLevel: "Intermediate", role: "Working Professional", language: "C++" },
  { id: "5", name: "Chris Wilson", skillLevel: "Advanced", role: "College Student", language: "Python" },
  { id: "6", name: "Lisa Anderson", skillLevel: "Beginner", role: "Working Professional", language: "Java" },
];

export default function Discover() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");

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

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = skillFilter === "All" || user.skillLevel === skillFilter;
    const matchesRole = roleFilter === "All" || user.role === roleFilter;
    const matchesLanguage = languageFilter === "All" || user.language === languageFilter;
    return matchesSearch && matchesSkill && matchesRole && matchesLanguage;
  });

  const handleSendRequest = (userId: string, userName: string) => {
    toast({
      title: "Partner request sent!",
      description: `Your request has been sent to ${userName}.`,
    });
  };

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
              <Link to="/discover" className="text-foreground font-medium">Discover</Link>
              <Link to="/dsa-sheet" className="text-muted-foreground hover:text-foreground transition-colors">DSA Sheet</Link>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Find Partners
          </h1>
          <p className="text-muted-foreground">
            Browse and connect with developers who match your learning goals.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Skill Level" />
                </SelectTrigger>
                <SelectContent>
                  {skillLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Language" />
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
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 text-muted-foreground">
          Showing {filteredUsers.length} developer{filteredUsers.length !== 1 ? "s" : ""}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="shadow-card hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{user.skillLevel}</Badge>
                  <Badge className="gradient-primary text-primary-foreground border-0">{user.language}</Badge>
                </div>

                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleSendRequest(user.id, user.name)}
                >
                  <UserPlus className="w-4 h-4" />
                  Send Request
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No developers found</h3>
              <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
