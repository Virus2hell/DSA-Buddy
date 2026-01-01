// SharedDSASheets.tsx - Grid of cards with navigation header
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, BookOpen, Users, RefreshCw, Folder, MessageCircle, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


interface SharedSheet {
  id: string;
  friend_id: string;
  created_at: string;
  friends: {
    id: string;
    user_id_1: string;
    user_id_2: string;
  };
  friend_name1: string;
  friend_name2: string;
}


export default function SharedDSASheets() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [sheets, setSheets] = useState<SharedSheet[]>([]);
  const [loading, setLoading] = useState(true);


  const loadSheets = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate("/auth");


    setUser(session.user);


    // ✅ Step 1: Get sheets + friends (no nested profiles)
    const { data, error } = await supabase
      .from('shared_dsa_sheets')
      .select(`
        id,
        friend_id,
        created_at,
        friends!friend_id(
          id,
          user_id_1,
          user_id_2
        )
      `)
      .order('created_at', { ascending: false });


    if (error) {
      console.error('❌ Sheets error:', error);
      toast({
        title: "Error loading sheets",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
      return;
    }


    if (!data || data.length === 0) {
      console.log('✅ No sheets found');
      setSheets([]);
      setLoading(false);
      return;
    }


    // ✅ Step 2: Collect all user IDs from friends
    const userIds = new Set<string>();
    (data || []).forEach(sheet => {
      const friend = Array.isArray(sheet.friends) ? sheet.friends[0] : sheet.friends;
      if (friend?.user_id_1) userIds.add(friend.user_id_1);
      if (friend?.user_id_2) userIds.add(friend.user_id_2);
    });


    // ✅ Step 3: Fetch all profiles at once
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', Array.from(userIds));


    if (profileError) {
      console.error('❌ Profiles error:', profileError);
      toast({
        title: "Error loading profiles",
        description: profileError.message,
        variant: "destructive"
      });
      setLoading(false);
      return;
    }


    // ✅ Step 4: Create profile map for quick lookup
    const profileMap = new Map<string, string>(
      (profiles || []).map(p => [p.user_id, p.full_name])
    );


    // ✅ Step 5: Enrich sheets with profile names and filter
    const enrichedSheets = (data || [])
      .map(sheet => {
        const friend = Array.isArray(sheet.friends) ? sheet.friends[0] : sheet.friends;
        return {
          ...sheet,
          friends: friend || {},
          friend_name1: profileMap.get(friend?.user_id_1) || 'Unknown',
          friend_name2: profileMap.get(friend?.user_id_2) || 'Unknown'
        };
      })
      .filter(sheet => {
        // Only show sheets where current user is one of the friends
        return sheet.friends.user_id_1 === session.user.id || 
               sheet.friends.user_id_2 === session.user.id;
      });


    console.log('✅ Loaded sheets:', enrichedSheets.length);
    setSheets(enrichedSheets);
    setLoading(false);
  }, [navigate, toast]);


  const handleRefresh = () => {
    loadSheets();
    toast({ title: '🔄 Sheets refreshed!' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };


  useEffect(() => {
    loadSheets();
  }, [loadSheets]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary/20 rounded-full animate-spin border-t-primary" />
          Loading shared sheets...
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      {/* ✅ FIXED: Added navigation header with all links */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                <img
                src="/logo.png"
                alt="DSA Socio"
                className="w-full h-full object-cover rounded-xl drop-shadow-lg"
              />
              </div>
              <span className="text-xl font-bold">DSA Socio</span>
            </Link>

            {/* ✅ ADDED NAVIGATION MENU */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link to="/discover" className="text-muted-foreground hover:text-foreground transition-colors">
                Discover
              </Link>
              <Link to="/dsa-sheet" className="text-muted-foreground hover:text-foreground transition-colors">
                DSA Sheet
              </Link>
              <Link to="/shared-dsa-sheet" className="text-foreground font-medium">
                Shared Sheets
              </Link>
              <Link to="/messages" className="text-muted-foreground hover:text-foreground transition-colors">
                Messages
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>


      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Shared DSA Sheets</h1>
          <p className="text-muted-foreground text-lg">
            Collaborate with partners ({sheets.length})
          </p>
        </div>


        {sheets.length === 0 ? (
          <Card className="max-w-2xl mx-auto text-center py-20 shadow-card">
            <BookOpen className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h3 className="text-2xl font-bold mb-2 text-muted-foreground">No shared sheets yet</h3>
            <p className="text-muted-foreground mb-8">
              Accept friend requests from Dashboard to automatically create shared DSA sheets
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="gradient-primary">
                  <Users className="w-5 h-5 mr-2" />
                  View Requests
                </Button>
              </Link>
              <Button variant="outline" size="lg" onClick={handleRefresh}>
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sheets.map((sheet) => (
              <Card key={sheet.id} className="shadow-card hover:shadow-xl hover:shadow-primary/10 transition-all group h-full">
                <CardHeader>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate mb-1">
                        {sheet.friend_name1} × {sheet.friend_name2}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">Partnership</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className="text-xs">
                      Sheet ID: {sheet.id.slice(0, 8)}
                    </Badge>
                    <Badge className="text-xs bg-secondary">
                      Created {new Date(sheet.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Folder className="w-4 h-4" />
                      <span>Organized problems</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageCircle className="w-4 h-4" />
                      <span>Collaborate in real-time</span>
                    </div>
                  </div>
                  <Button
                    asChild
                    size="lg"
                    className="w-full gradient-primary hover:shadow-lg group-hover:translate-y-[-2px] transition-all"
                  >
                    <Link to={`/shared-dsa-sheet/${sheet.id}`}>
                      Open DSA Sheet →
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
