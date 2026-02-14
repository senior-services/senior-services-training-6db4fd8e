import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Auth } from "./pages/Auth";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { VideoPage } from "./pages/VideoPage";
import { NotFound } from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";
import { useUserRole } from "./hooks/useUserRole";
import { VideoPlayerFullscreen } from "@/components/VideoPlayerFullscreen";
import { logger } from "@/utils/logger";
import { AuthCallback } from "./pages/AuthCallback";
import { ComponentsGallery } from "./pages/ComponentsGallery";
import type { Video } from "./types";

// YouTube API type declarations
declare global {
  interface Window {
    YT?: any;
  }
}

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user);
  const navigate = useNavigate();
  
  const isAuthenticated = !!user;
  const isAdmin = role === 'admin';
  const loading = authLoading || (isAuthenticated && roleLoading);

  // Enhanced debug logging for application state monitoring
  logger.debug('Application state update', {
    user: user?.email || 'not_authenticated',
    isAuthenticated,
    role: role || 'unknown',
    authLoading,
    roleLoading,
    loading,
    currentPath: window.location.pathname,
    timestamp: new Date().toISOString()
  });

  const handleLogout = () => {
    signOut();
  };

  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedVideoData, setSelectedVideoData] = useState<Video | null>(null);
  const [refreshDashboard, setRefreshDashboard] = useState(0);

  const handlePlayVideo = (videoId: string, initialVideo?: Video) => {
    setSelectedVideoId(videoId);
    setSelectedVideoData(initialVideo || null);
    setIsVideoOpen(true);
  };

  const handleVideoClose = (open: boolean) => {
    setIsVideoOpen(open);
    if (!open) {
      setTimeout(() => {
        logger.info('Triggering dashboard refresh after video modal close');
        setRefreshDashboard(prev => prev + 1);
      }, 500);
    }
  };

  if (loading) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
            <div className="text-white text-h4">Loading...</div>
          </div>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';

  return (
    <>
      <Routes>
        {/* Auth routes - redirect to appropriate dashboard if already authenticated */}
        <Route 
          path="/" 
          element={
            !isAuthenticated ? 
              <Auth /> : 
              <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
          } 
        />
        <Route 
          path="/auth" 
          element={
            !isAuthenticated ? 
              <Auth /> : 
              <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
          } 
        />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Personal training dashboard - accessible to ALL authenticated users */}
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? (
              <EmployeeDashboard 
                userName={userName}
                userEmail={userEmail}
                userRole={isAdmin ? "admin" : "employee"}
                onLogout={handleLogout}
                onPlayVideo={handlePlayVideo}
                refreshTrigger={refreshDashboard}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />

        {/* Admin management dashboard - admin only */}
        <Route 
          path="/admin" 
          element={
            isAuthenticated ? (
              isAdmin ? (
                <AdminDashboard 
                  userName={userName}
                  userEmail={userEmail}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />

        <Route 
          path="/video/:videoId" 
          element={<VideoPage />} 
        />
        <Route 
          path="/components-gallery" 
          element={
            <ComponentsGallery 
              userName={userName}
              userEmail={userEmail}
              onLogout={handleLogout}
            />
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <VideoPlayerFullscreen
        open={isVideoOpen}
        onOpenChange={handleVideoClose}
        videoId={selectedVideoId}
        initialVideo={selectedVideoData || undefined}
        onProgressUpdate={(progress) => {
        logger.videoEvent('progress_update_callback', selectedVideoId || 'unknown', {
          progress,
          timestamp: new Date().toISOString(),
          source: 'AppContent_callback'
        });
        }}
      />
    </>
  );
};

const App = () => {
  useEffect(() => {
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
