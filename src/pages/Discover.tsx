import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code2, Search, Filter, UserPlus, LogOut, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const skillLevels = ["All", "Beginner", "Intermediate", "Advanced"];
const roles = ["All", "College Student", "Working Professional"];
const languages = ["All", "Java", "C++", "Python", "JavaScript"];

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  skill_level: string;
  role: string;
  preferred_language: string;
  created_at: string;
}

export default function Discover() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");

  // Fetch profiles excluding current user
  const fetchProfiles = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      if (!currentUserId) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq('user_id', currentUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProfiles(data || []);
    } catch (error: any) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Error loading profiles",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Apply filters
  const applyFilters = useCallback(() => {
    const filtered = profiles.filter((profile) => {
      const matchesSearch = profile.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesSkill = skillFilter === "All" || profile.skill_level === skillFilter;
      const matchesRole = roleFilter === "All" || profile.role === roleFilter;
      const matchesLanguage =
        languageFilter === "All" || profile.preferred_language === languageFilter;
      return matchesSearch && matchesSkill && matchesRole && matchesLanguage;
    });
    setFilteredProfiles(filtered);
  }, [profiles, searchTerm, skillFilter, roleFilter, languageFilter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Check auth and load profiles + real-time
  useEffect(() => {
    let channel: any;

    const checkUserAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      await fetchProfiles();
      setLoading(false);
    };

    checkUserAndLoad();

    // Subscribe to profile changes (fetchProfiles filters current user)
    channel = supabase
      .channel("profiles")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "profiles"
        },
        () => {
          fetchProfiles();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [navigate, fetchProfiles]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate("/");
    }
  };

  // ✅ REAL FRIEND REQUEST SYSTEM
  // ✅ FIXED REAL FRIEND REQUEST SYSTEM
// Update function signature:
const handleSendRequest = async (targetUserId: string, userName: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    if (!currentUserId || !targetUserId) return;

    // Check if already friends
    const { count: friendCount, error: friendError } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .or(`and(user_id_1.eq.${currentUserId},user_id_2.eq.${targetUserId}),and(user_id_1.eq.${targetUserId},user_id_2.eq.${currentUserId})`);

    if (friendError) throw friendError;
    if (friendCount && friendCount > 0) {
      toast({
        title: "Already friends! 👥",
        description: `You're already connected with ${userName}!`,
      });
      return;
    }

    // Check existing request
    const { data: existing } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`)
      .maybeSingle();

    if (existing) {
      toast({
        title: "Request already sent",
        description: existing.sender_id === currentUserId 
          ? `You already sent a request to ${userName}`
          : `${userName} already sent you a request`,
      });
      return;
    }

    // ✅ FIXED: Both IDs are now auth.users.id
    const { error } = await supabase.from('friend_requests').insert([{
      sender_id: currentUserId,
      receiver_id: targetUserId,  // ← This is profiles.user_id (auth.users.id)
      status: 'pending'
    }] as any);

    if (error) throw error;

    toast({
      title: "✅ Request sent!",
      description: `${userName} will see it in their Dashboard!`,
    });
  } catch (error: any) {
    console.error("Request error:", error);
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  }
};



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading profiles...
        </div>
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
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link to="/discover" className="text-foreground font-medium">
                Discover
              </Link>
              <Link to="/dsa-sheet" className="text-muted-foreground hover:text-foreground transition-colors">
                DSA Sheet
              </Link>
              <Link to="/messages" className="text-muted-foreground hover:text-foreground transition-colors">
                Messages
              </Link>
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
          Showing {filteredProfiles.length} developer{filteredProfiles.length !== 1 ? "s" : ""}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="shadow-card hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{profile.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{profile.role}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{profile.skill_level}</Badge>
                  <Badge className="gradient-primary text-primary-foreground border-0">{profile.preferred_language}</Badge>
                </div>

                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleSendRequest(profile.user_id, profile.full_name)}
                >
                  <UserPlus className="w-4 h-4" />
                  Send Request
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
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
