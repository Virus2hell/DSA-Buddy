import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Code2, MessageCircle, Send, LogOut, Search, Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


interface Partner {
  id: string;
  user_id: string;
  full_name: string;
  skill_level: string;
}


interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  receiver_id?: string;
  sender_name: string;
  message: string;
  created_at: string;
}


export default function Messages() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserIdRef = useRef<string>("");
  const pusherRef = useRef<any>(null);


  // 1. Init Pusher + partners
  useEffect(() => {
    let mounted = true;
    const initPusher = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          navigate("/auth");
          return;
        }
        currentUserIdRef.current = session.user.id;


        const Pusher = (await import('pusher-js')).default;
        pusherRef.current = new Pusher(import.meta.env.VITE_PUSHER_KEY as string, {
          cluster: 'ap2',
          authEndpoint: 'http://localhost:5000/api/pusher/auth',
          auth: { headers: { Authorization: `Bearer ${session.access_token}` } }
        });


        pusherRef.current.connection.bind('connected', () => {
          console.log('🚀 Pusher connected!');
        });


        await fetchPartners();
        if (mounted) setLoading(false);
      } catch (error) {
        console.error('❌ Pusher init failed:', error);
      }
    };
    initPusher();
    return () => {
      mounted = false;
      pusherRef.current?.disconnect();
    };
  }, []);


  // 2. ✅ FIXED: Load message history when partner selected
  useEffect(() => {
    if (selectedPartner?.user_id && currentUserIdRef.current) {
      console.log('📥 Loading history for:', selectedPartner.full_name);
      fetchMessages(selectedPartner.user_id);
    } else {
      setMessages([]);
    }
  }, [selectedPartner?.user_id]);


  const fetchPartners = useCallback(async () => {
    if (!currentUserIdRef.current) return;


    try {
      const { data: friendsData, error } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id_1.eq.${currentUserIdRef.current},user_id_2.eq.${currentUserIdRef.current}`);


      if (error) throw error;


      if (!friendsData?.length) {
        setPartners([]);
        return;
      }


      const otherUserIds = friendsData.map(f =>
        f.user_id_1 === currentUserIdRef.current ? f.user_id_2 : f.user_id_1
      );


      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, skill_level')
        .in('user_id', otherUserIds);


      if (profileError) throw profileError;


      const partnersList: Partner[] = friendsData.map((friend: any) => {
        const otherId = friend.user_id_1 === currentUserIdRef.current ? friend.user_id_2 : friend.user_id_1;
        const profile = profiles?.find((p: any) => p.user_id === otherId);


        return {
          id: friend.id,
          user_id: otherId,
          full_name: profile?.full_name || 'Unknown User',
          skill_level: profile?.skill_level || 'Beginner'
        };
      });


      setPartners(partnersList);
    } catch (error: any) {
      console.error('❌ Fetch partners failed:', error);
      toast({ title: "Failed to load partners", description: error.message, variant: "destructive" });
      setPartners([]);
    }
  }, []);


  // 3. Pusher subscription
  useEffect(() => {
    if (!selectedPartner || !pusherRef.current || !currentUserIdRef.current) return;


    const channelName = `chat-${[currentUserIdRef.current.slice(0, 8), selectedPartner.user_id.slice(0, 8)].sort().join('-')}`;


    console.log('🔌 Subscribing:', channelName);


    const channel = pusherRef.current.subscribe(channelName);


    channel.bind('new-message', (data: ChatMessage) => {
      console.log('📨 LIVE Pusher:', data);


      setMessages(prev => {
        if (data.sender_id === currentUserIdRef.current) {
          console.log('⏭️ Skipping own message:', data.id);
          return prev;
        }


        if (prev.some(msg => msg.id === data.id)) {
          console.log('🔄 Already exists:', data.id);
          return prev;
        }


        console.log('➕ Adding new:', data.message);
        return [...prev, data];
      });
    });


    return () => {
      pusherRef.current?.unsubscribe(channelName);
    };
  }, [selectedPartner?.user_id]);


  const fetchMessages = useCallback(async (partnerId: string) => {
    if (!currentUserIdRef.current) return;


    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', selectedPartner?.id)
        .order('created_at', { ascending: true });


      if (error) throw error;
      setMessages(data || []);
      console.log('✅ Loaded', data?.length || 0, 'messages from DB');
    } catch (error: any) {
      console.error('❌ Fetch messages failed:', error);
    }
  }, [selectedPartner?.id]);


  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedPartner || !currentUserIdRef.current) return;


    const chatId = selectedPartner.id;
    const trimmedMessage = messageInput.trim();
    const tempId = `temp_${Date.now()}`;


    const optimisticMsg = {
      id: tempId,
      chat_id: chatId,
      sender_id: currentUserIdRef.current,
      sender_name: "You",
      message: trimmedMessage,
      created_at: new Date().toISOString()
    };


    setMessages(prev => [...prev, optimisticMsg]);
    setMessageInput("");


    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          sender_id: currentUserIdRef.current,
          message: trimmedMessage,
          channel: `chat-${[currentUserIdRef.current.slice(0, 8), selectedPartner.user_id.slice(0, 8)].sort().join('-')}`
        })
      });


      if (!response.ok) throw new Error('Failed to send');


      const realMsg = await response.json();
      
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? { ...realMsg, sender_name: "You" } : msg
      ));


      console.log('✅ Perfect send! Real ID:', realMsg.id);
    } catch (error) {
      console.error('❌ Failed:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };


  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);


  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);


  const filteredPartners = partners.filter(p =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary/20 rounded-full animate-spin border-t-primary"></div>
          Loading messages...
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ✅ UPDATED: Header with navigation links */}
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
              <Link to="/shared-dsa-sheet" className="text-muted-foreground hover:text-foreground transition-colors">
                Shared Sheets
              </Link>
              <Link to="/messages" className="text-foreground font-medium">
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


      {/* Main Content - ORIGINAL LAYOUT + CONTAINER PADDING */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <div className="h-[70vh] flex gap-4 min-h-0"> {/* Fixed height + flex */}


          {/* Partners List - UNCHANGED */}
          <Card className="w-80 shrink-0 shadow-card flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Messages ({partners.length})
              </CardTitle>
            </CardHeader>
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search partners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {filteredPartners.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm font-medium">No partners yet</p>
                    <p className="text-xs">Accept friend requests to start chatting!</p>
                  </div>
                ) : (
                  filteredPartners.map((partner) => (
                    <button
                      key={partner.id}
                      onClick={() => setSelectedPartner(partner)}
                      className={`w-full p-3 rounded-xl text-left transition-all group ${selectedPartner?.user_id === partner.user_id
                        ? "bg-primary/10 border-2 border-primary/20"
                        : "hover:bg-secondary"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                          {partner.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm truncate">{partner.full_name}</p>
                            <Badge variant="outline" className="text-xs px-2 py-0.5 h-auto">
                              {partner.skill_level}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">Tap to chat</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>


          {/* ✅ CHAT - Scroll ONLY in messages */}
          <Card className="flex-1 shadow-card flex flex-col min-h-0">
            {selectedPartner ? (
              <>
                {/* ✅ REMOVED: Online status indicator */}
                <CardHeader className="p-4 pb-3 flex items-center gap-3 border-b border-border shrink-0">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center font-bold text-primary-foreground">
                    {selectedPartner.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{selectedPartner.full_name}</h3>
                    <Badge variant="secondary" className="text-xs">{selectedPartner.skill_level}</Badge>
                  </div>
                </CardHeader>


                {/* ✅ SCROLL ONLY HERE - Perfect height */}
                <ScrollArea className="flex-1 p-4 min-h-0">
                  <div className="space-y-3 mb-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === currentUserIdRef.current ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${message.sender_id === currentUserIdRef.current
                            ? "gradient-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                            }`}
                        >
                          <p className="text-sm break-words">{message.message}</p>
                          <p className={`text-xs mt-1 ${message.sender_id === currentUserIdRef.current
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                            }`}>
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>


                <div className="p-4 pt-0 border-t border-border shrink-0">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message... (Press Enter to send)"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="flex-1 min-h-[44px] resize-none"
                    />
                    <Button
                      variant="gradient"
                      size="icon"
                      onClick={sendMessage}
                      className="h-[44px] w-[44px] shrink-0"
                      disabled={!messageInput.trim() || !pusherRef.current}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                <MessageCircle className="w-16 h-16 mx-auto mb-6 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No conversation selected</h3>
                <p className="text-sm mb-6 text-center max-w-md">
                  Accept friend requests from Dashboard to start chatting with DSA partners
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link to="/discover">Find Partners</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/dashboard">View Requests</Link>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
