import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Code2, 
  MessageCircle, 
  Send, 
  LogOut,
  Search,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Partner {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface Message {
  id: string;
  text: string;
  sender: "me" | "partner";
  time: string;
}

const mockPartners: Partner[] = [
  { id: "1", name: "Alex Chen", lastMessage: "Hey! Ready to solve some problems?", time: "2m ago", unread: 2 },
  { id: "2", name: "Sarah Johnson", lastMessage: "I solved that DP problem!", time: "1h ago", unread: 0 },
];

const mockMessages: Message[] = [
  { id: "1", text: "Hey! How's it going?", sender: "partner", time: "10:30 AM" },
  { id: "2", text: "Good! Just solved Two Sum 🎉", sender: "me", time: "10:32 AM" },
  { id: "3", text: "Nice! Want to try the next one together?", sender: "partner", time: "10:33 AM" },
  { id: "4", text: "Hey! Ready to solve some problems?", sender: "partner", time: "10:35 AM" },
];

export default function Messages() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [searchTerm, setSearchTerm] = useState("");

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

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedPartner) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageInput,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMessage]);
    setMessageInput("");
  };

  const filteredPartners = mockPartners.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
              <Link to="/dsa-sheet" className="text-muted-foreground hover:text-foreground transition-colors">DSA Sheet</Link>
              <Link to="/messages" className="text-foreground font-medium">Messages</Link>
            </nav>

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-4 flex gap-4 min-h-0">
        {/* Partners List */}
        <Card className="w-80 shrink-0 shadow-card flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Messages
            </h2>
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
            <div className="p-2">
              {filteredPartners.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No partners found</p>
                </div>
              ) : (
                filteredPartners.map((partner) => (
                  <button
                    key={partner.id}
                    onClick={() => setSelectedPartner(partner)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedPartner?.id === partner.id
                        ? "bg-primary/10"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                        {partner.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{partner.name}</p>
                          <span className="text-xs text-muted-foreground">{partner.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{partner.lastMessage}</p>
                      </div>
                      {partner.unread > 0 && (
                        <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
                          {partner.unread}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 shadow-card flex flex-col">
          {selectedPartner ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                  {selectedPartner.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{selectedPartner.name}</p>
                  <p className="text-sm text-muted-foreground">Online</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          message.sender === "me"
                            ? "gradient-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        <p>{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1"
                  />
                  <Button variant="gradient" onClick={sendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm">Choose a partner to start messaging</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
