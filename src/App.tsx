import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import DSASheet from "./pages/DSASheet";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

const App = () => {
  // Smooth scroll behavior for anchor links (kept)
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/dsa-sheet" element={<DSASheet />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
