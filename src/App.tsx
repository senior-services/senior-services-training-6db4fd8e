import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Auth } from "./pages/Auth";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { NotFound } from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";
import { useUserRole } from "./hooks/useUserRole";

const queryClient = new QueryClient();

const App = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user);
  
  const isAuthenticated = !!user;
  const loading = authLoading || (isAuthenticated && (roleLoading || role === null));

  // Debug logging
  console.log('App Debug:', {
    user: user?.email,
    isAuthenticated,
    role,
    authLoading,
    roleLoading,
    loading
  });

  const handleLogout = () => {
    signOut();
  };

  const handlePlayVideo = (videoId: string) => {
    console.log('Playing video:', videoId);
    // TODO: Implement video player
  };

  if (loading) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
            <div className="text-white text-lg">Loading...</div>
          </div>
          <Toaster />
          <Sonner />
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
                !isAuthenticated ? 
                  <Auth /> : 
                  <Navigate to="/dashboard" replace />
              } 
            />
            <Route 
              path="/auth" 
              element={
                !isAuthenticated ? 
                  <Auth /> : 
                  <Navigate to="/dashboard" replace />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated ? (
                  role === 'admin' ? (
                    <AdminDashboard 
                      userName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                      userEmail={user?.email || ''}
                      onLogout={handleLogout}
                    />
                  ) : (
                    <EmployeeDashboard 
                      userName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                      userEmail={user?.email || ''}
                      onLogout={handleLogout}
                      onPlayVideo={handlePlayVideo}
                    />
                  )
                ) : (
                  <Navigate to="/auth" replace />
                )
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;