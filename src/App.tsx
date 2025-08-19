import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { Landing } from "./pages/Landing";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Mock user data - will be replaced with real authentication
const mockUsers = {
  'admin@southsoundseniors.org': { role: 'admin' as const, name: 'John Administrator' },
  'employee@southsoundseniors.org': { role: 'employee' as const, name: 'Sarah Employee' },
};

const App = () => {
  const [user, setUser] = useState<{ email: string; name: string; role: 'admin' | 'employee' } | null>(null);

  const handleGoogleLogin = () => {
    // Mock login - will be replaced with real Google Auth via Supabase
    const email = 'employee@southsoundseniors.org'; // Default to employee for demo
    const userData = mockUsers[email as keyof typeof mockUsers];
    if (userData) {
      setUser({ email, name: userData.name, role: userData.role });
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handlePlayVideo = (videoId: string) => {
    console.log('Playing video:', videoId);
    // TODO: Implement video player
  };

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Landing onGoogleLogin={handleGoogleLogin} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                user.role === 'admin' ? (
                  <AdminDashboard 
                    userName={user.name}
                    userEmail={user.email}
                    onLogout={handleLogout}
                  />
                ) : (
                  <EmployeeDashboard 
                    userName={user.name}
                    userEmail={user.email}
                    onLogout={handleLogout}
                    onPlayVideo={handlePlayVideo}
                  />
                )
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
