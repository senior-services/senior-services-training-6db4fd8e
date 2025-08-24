/**
 * Enhanced EmployeeDashboard Component for the Senior Services Training Portal
 * Implements accessibility, security, performance, and modern UX best practices
 */

import React, { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { TrainingCard, TrainingVideo } from "@/components/TrainingCard";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { BookOpen, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { EmployeeService } from "@/services/employeeService";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSkeleton } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import type { Video } from "@/types";

// Enhanced utility imports
import { sanitizeText, createSafeDisplayName, validateUserRole } from "@/utils/security";
import { announceToScreenReader, getStatusAnnouncement } from "@/utils/accessibility";
import { calculateTrainingProgress, useOptimizedMemo, useOptimizedCallback, usePerformanceMonitor } from "@/utils/performance";

/**
 * Enhanced props interface with comprehensive type safety
 */
interface EmployeeDashboardProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
  onPlayVideo: (videoId: string) => void;
}

/**
 * Enhanced training progress statistics interface
 */
interface TrainingStats {
  totalVideos: number;
  completedVideos: number;
  overallProgress: number;
  requiredComplete: number;
  totalRequired: number;
  overallStatus: 'on-track' | 'behind' | 'completed' | 'needs-attention';
}

/**
 * Enhanced EmployeeDashboard component with comprehensive accessibility and performance optimizations
 */
export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  userName,
  userEmail,
  onLogout,
  onPlayVideo
}) => {
  // Performance monitoring
  usePerformanceMonitor('EmployeeDashboard');

  // Enhanced state management with better typing
  const [assignedVideoData, setAssignedVideoData] = useState<{
    video: Video;
    assignment: any;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    toast
  } = useToast();

  // Sanitize and validate user data for security
  const sanitizedUserData = useMemo(() => ({
    displayName: createSafeDisplayName(userName, userEmail),
    firstName: createSafeDisplayName(userName, userEmail).split(' ')[0],
    email: userEmail // Already validated by auth system
  }), [userName, userEmail]);

  // Load assigned videos with enhanced error handling
  const loadAssignedVideos = useOptimizedCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const videoData = await EmployeeService.getAssignedVideosByEmail(userEmail);
      setAssignedVideoData(videoData);

      // Announce successful load to screen readers
      announceToScreenReader(`Loaded ${videoData.length} assigned training videos`);
    } catch (error) {
      console.error('Error loading assigned videos:', error);
      const errorMessage = 'Failed to load your assigned videos. Please try refreshing the page.';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });

      // Announce error to screen readers
      announceToScreenReader(errorMessage, 'assertive');
    } finally {
      setLoading(false);
    }
  }, [userEmail, toast]);

  // Enhanced video data transformation with security and accessibility
  const transformToTrainingVideo = useOptimizedCallback((video: Video, assignment?: any): TrainingVideo => {
    return {
      id: video.id,
      title: sanitizeText(video.title || 'Untitled Video'),
      description: sanitizeText(video.description || ''),
      thumbnail: video.thumbnail_url || 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=300&fit=crop',
      duration: '15 min',
      // TODO: Add actual duration field to database
      progress: Math.max(0, Math.min(100, assignment?.progress_percent || 0)),
      // Use real progress from assignment
      isRequired: video.type === 'Required',
      deadline: assignment?.due_date ? new Date(assignment.due_date).toLocaleDateString() : undefined,
      dueDate: assignment?.due_date || null,
      status: !video.video_url && !video.video_file_name ? 'warning' as const : undefined
    };
  }, []);

  // Enhanced training data processing with comprehensive statistics
  const trainingData = useOptimizedMemo(() => {
    console.log('Processing training data, assignedVideoData:', assignedVideoData);
    const requiredVideos = assignedVideoData.filter(item => item.video.type === 'Required').map(item => transformToTrainingVideo(item.video, item.assignment));
    console.log('Required videos:', requiredVideos.length);
    console.log('Required videos:', requiredVideos);

    // Calculate comprehensive training statistics
    const stats = calculateTrainingProgress(requiredVideos);

    // Determine overall status for accessibility announcements
    let overallStatus: TrainingStats['overallStatus'] = 'on-track';
    if (stats.totalRequired === 0) {
      overallStatus = 'completed';
    } else if (stats.requiredComplete === stats.totalRequired) {
      overallStatus = 'completed';
    } else if (stats.overallProgress < 50) {
      overallStatus = 'behind';
    } else {
      // Check for overdue items
      const hasOverdue = requiredVideos.some(video => {
        if (!video.dueDate) return false;
        const due = new Date(video.dueDate);
        return due < new Date() && video.progress < 100;
      });
      overallStatus = hasOverdue ? 'needs-attention' : 'on-track';
    }
    return {
      required: requiredVideos,
      stats: {
        ...stats,
        overallStatus
      } as TrainingStats
    };
  }, [assignedVideoData, transformToTrainingVideo]);

  // Enhanced video play handler with accessibility
  const handleVideoPlay = useOptimizedCallback((videoId: string) => {
    const video = trainingData.required.find(v => v.id === videoId);
    if (video) {
      const announcement = `Opening ${video.title}. ${getStatusAnnouncement(video.progress, video.isRequired || false, video.dueDate)}`;
      announceToScreenReader(announcement);
    }
    onPlayVideo(videoId);
  }, [trainingData.required, onPlayVideo]);

  // Callback to refresh training data when progress is updated
  const handleProgressUpdate = (progress: number) => {
    // This will trigger a re-render of components that depend on video progress
    console.log('Video progress updated:', progress);
    // Optionally refresh the training data to show updated progress
    loadAssignedVideos();
  };

  // Load videos on component mount and set up realtime subscriptions
  useEffect(() => {
    loadAssignedVideos();

    // Set up realtime subscription for video progress updates
    const channel = supabase.channel('video-progress-changes').on('postgres_changes', {
      event: '*',
      // Listen to all changes (INSERT, UPDATE, DELETE)
      schema: 'public',
      table: 'video_progress'
    }, payload => {
      console.log('Real-time video progress update:', payload);
      // Refresh assigned videos when any progress changes
      loadAssignedVideos();
    }).subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAssignedVideos]);

  // Error boundary fallback
  if (error) {
    return <div className="min-h-screen bg-muted/30">
        <Header userRole="employee" userName={sanitizedUserData.displayName} userEmail={userEmail} overallProgress={trainingData.stats.overallProgress} onLogout={onLogout} />
        
        <main className="container mx-auto px-4 py-8" role="main" aria-labelledby="error-heading">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" aria-hidden="true" />
            <h2 id="error-heading" className="text-2xl font-semibold mb-2">Unable to Load Training Data</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button onClick={loadAssignedVideos} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring" aria-describedby="retry-description">
              Try Again
            </button>
            <p id="retry-description" className="sr-only">
              Click to retry loading your training assignments
            </p>
          </div>
        </main>
      </div>;
  }
  return <ErrorBoundary>
      <div className="min-h-screen bg-muted/30">
        <Header userRole="employee" userName={sanitizedUserData.displayName} userEmail={userEmail} overallProgress={trainingData.stats.overallProgress} onLogout={onLogout} />
        
        <main className="container mx-auto px-4 py-8" role="main" aria-labelledby="dashboard-heading">
          {/* Skip Navigation Link for Accessibility */}
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                       bg-primary text-primary-foreground px-4 py-2 rounded-md z-50
                       focus:outline-none focus:ring-2 focus:ring-ring">
            Skip to main content
          </a>

          {/* Enhanced Welcome Section with Status Information */}
          <header className="mb-8" role="banner">
            <div className="flex items-center justify-between mb-4">
              <h1 id="dashboard-heading" className="text-3xl font-bold text-foreground">
                Welcome back, {sanitizedUserData.firstName}!
              </h1>
              {trainingData.stats.overallStatus === 'completed' && <Badge className="bg-success text-success-foreground border-success" aria-label="All required training completed">
                  <CheckCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                  All Complete
                </Badge>}
              {trainingData.stats.overallStatus === 'needs-attention' && <Badge variant="destructive" aria-label="Some training requires immediate attention">
                  <AlertCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                  Attention Needed
                </Badge>}
              {trainingData.stats.overallStatus === 'behind' && <Badge className="bg-warning text-warning-foreground border-warning" aria-label="Training progress is behind schedule">
                  <Clock className="w-4 h-4 mr-1" aria-hidden="true" />
                  Behind Schedule
                </Badge>}
            </div>
            
            <p className="text-muted-foreground text-lg">
              Continue your training journey and stay up to date with the latest best practices.
            </p>
            
            {/* Training Statistics for Screen Readers */}
            <div className="sr-only" aria-live="polite">
              <p>
                Training Progress: {trainingData.stats.requiredComplete} of {trainingData.stats.totalRequired} required 
                training modules completed. Overall progress: {trainingData.stats.overallProgress} percent.
              </p>
            </div>
          </header>

          {/* Required Training Section with Enhanced Accessibility */}
          <section id="main-content" className="mb-12" aria-labelledby="required-training-heading" role="region">
            
            
            
            
            {loading ? <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" aria-label="Loading training assignments">
                {Array.from({
              length: 6
            }).map((_, index) => <LoadingSkeleton key={index} lines={1} className="h-64" />)}
              </div> : trainingData.required.length === 0 ? <div className="text-center py-12" role="status" aria-live="polite">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
                <h3 className="text-xl font-medium mb-2">No Required Training Assigned</h3>
                <p className="text-muted-foreground">
                  You don't have any required training videos assigned at this time.
                </p>
              </div> : <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" role="grid" aria-label="Required training videos">
                {trainingData.required.map((video, index) => <TrainingCard key={video.id} video={video} onPlay={handleVideoPlay} priority={index < 3} // Prioritize first 3 cards for performance
            />)}
              </div>}
          </section>

        </main>
      </div>
    </ErrorBoundary>;
};