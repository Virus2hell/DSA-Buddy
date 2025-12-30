import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Code2, Users, BookOpen, MessageCircle, LogOut, Search,
  CheckCircle2, Clock, TrendingUp, UserPlus, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  full_name: string;
  skill_level: string;
  role: string;
  preferred_language: string;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  profiles: {
    full_name: string;
    skill_level: string;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [friendsCount, setFriendsCount] = useState(0);

  // Fetch profile from profiles table
  const fetchProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  }, []);


  const fetchIncomingRequests = useCallback(async () => {
  console.log('🔍 Fetching requests...');
  
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  
  console.log('🔍 My user ID:', userId);
  
  if (!userId) return;

  // ✅ STEP 1: Get pending requests for ME
  const { data: requests, error: reqError } = await supabase
    .from('friend_requests')
    .select('id, sender_id, status, created_at')
    .eq('receiver_id', userId)
    .eq('status', 'pending');

  if (reqError || !requests || requests.length === 0) {
    console.log('✅ No pending requests');
    setIncomingRequests([]);
    return;
  }

  console.log('🔍 Found requests:', requests);

  // ✅ STEP 2: Get sender profiles
  const senderIds = requests.map(r => r.sender_id);
  const { data: senderProfiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id, full_name, skill_level')
    .in('user_id', senderIds);

  console.log('🔍 Sender profiles:', senderProfiles);

  // ✅ STEP 3: Combine data
  const requestsWithProfiles = requests.map(req => {
    const profile = senderProfiles?.find(p => p.user_id === req.sender_id);
    return {
      id: req.id,
      sender_id: req.sender_id,
      profiles: profile || { full_name: 'Unknown', skill_level: 'Unknown' }
    };
  });

  setIncomingRequests(requestsWithProfiles);
  console.log('✅ FINAL requests:', requestsWithProfiles);
}, []);




  // Fetch friends count
  const fetchFriendsCount = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const { count, error } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .or(`user_id_1.eq.${session.user.id},user_id_2.eq.${session.user.id}`);

    if (!error && count !== null) {
      setFriendsCount(count);
    }
  }, []);

  // Handle accept/reject request
  const handleRequestAction = async (requestId: string, senderId: string, action: 'accept' | 'reject') => {
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: action })
        .eq('id', requestId)
        .eq('receiver_id', user?.id);

      if (updateError) throw updateError;

      if (action === 'accept') {
        // Create friendship (ensure consistent ordering: smaller ID first)
        const user1 = user?.id!.localeCompare(senderId) < 0 ? user?.id! : senderId;
        const user2 = user?.id!.localeCompare(senderId) > 0 ? user?.id! : senderId;

        const { error: friendError } = await supabase.from('friends').insert({
          user_id_1: user1,
          user_id_2: user2
        });

        if (friendError) throw friendError;
      }

      toast({
        title: action === 'accept' ? '✅ Request accepted!' : '❌ Request rejected',
        description: action === 'accept'
          ? 'You can now chat with your new partner in Messages!'
          : 'Request declined successfully.',
      });

      fetchIncomingRequests();
      fetchFriendsCount();
    } catch (error: any) {
      toast({
        title: 'Error processing request',
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // ✅ FIXED: Real-time subscription (no filter needed in subscription)
  useEffect(() => {
    let requestsChannel: any;

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await Promise.all([
        fetchProfile(),
        fetchIncomingRequests(),
        fetchFriendsCount()
      ]);
      setLoading(false);
    };

    checkUser();

    // ✅ FIXED: Real-time subscription for incoming requests
    requestsChannel = supabase
      .channel('incoming_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${user?.id}`
        },
        () => {
          fetchIncomingRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
    };
  }, [navigate, fetchProfile, fetchIncomingRequests, fetchFriendsCount, user?.id]);


  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary/20 rounded-full animate-spin border-t-primary"></div>
          Loading dashboard...
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Problems Solved", value: "0", icon: CheckCircle2, color: "text-success" },
    { label: "In Progress", value: "0", icon: Clock, color: "text-warning" },
    { label: "Partners", value: friendsCount.toString(), icon: Users, color: "text-primary" },
  ];

  const quickActions = [
    {
      title: "Find Partners",
      description: "Browse and connect with developers at your level",
      icon: Search,
      href: "/discover",
      color: "bg-primary/10 text-primary"
    },
    {
      title: "My DSA Sheet",
      description: "Track your personal problem-solving progress",
      icon: BookOpen,
      href: "/dsa-sheet",
      color: "bg-success/10 text-success"
    },
    {
      title: "Messages",
      description: "Chat with your practice partners",
      icon: MessageCircle,
      href: "/messages",
      color: "bg-chart-2/20 text-chart-5"
    },
  ];

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
              <Link to="/dashboard" className="text-foreground font-medium">Dashboard</Link>
              <Link to="/discover" className="text-muted-foreground hover:text-foreground transition-colors">Discover</Link>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Ready to continue your DSA journey? Here's your overview.
          </p>
        </div>

        {/* Profile Card */}
        <Card className="mb-8 shadow-card">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {profile?.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{profile?.full_name}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{profile?.skill_level}</Badge>
                <Badge variant="outline">{profile?.role}</Badge>
                <Badge className="gradient-primary text-primary-foreground border-0">{profile?.preferred_language}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🔥 INCOMING FRIEND REQUESTS SECTION */}
        {incomingRequests.length > 0 && (
          <Card className="mb-8 shadow-card border-primary/20 animate-pulse">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Incoming Requests ({incomingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg mb-3 hover:bg-secondary">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center font-bold text-primary-foreground">
                      {req.profiles.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{req.profiles.full_name}</p>
                      <p className="text-sm text-muted-foreground">{req.profiles.skill_level}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleRequestAction(req.id, req.sender_id, 'accept')}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRequestAction(req.id, req.sender_id, 'reject')}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}



        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="shadow-card hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1 text-foreground">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            🚀 Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link key={action.title} to={action.href} className="group">
                <Card className="shadow-card hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 border-0 h-full group-hover:border-primary/50">
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 rounded-2xl ${action.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{action.title}</h3>
                    <p className="text-muted-foreground text-lg">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <Card className="shadow-card border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest actions and updates across DSA Partner</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {incomingRequests.length > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">New partner requests</p>
                    <p className="text-sm text-muted-foreground">{incomingRequests.length} developer{incomingRequests.length > 1 ? 's' : ''} want to connect!</p>
                  </div>
                </div>
              )}
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p className="text-lg font-medium">No recent activity yet</p>
                <p className="text-sm mt-2">Send partner requests in Discover or track your DSA progress!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


