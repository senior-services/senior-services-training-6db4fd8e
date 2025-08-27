import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Video, BookOpen } from "lucide-react";
import { AddVideoModal, VideoFormData } from "@/components/AddVideoModal";
import { EditVideoModal } from "@/components/EditVideoModal";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { EmployeeManagement } from "@/components/dashboard/EmployeeManagement";
import { AdminManagement } from "@/components/dashboard/AdminManagement";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { VideoManagement, VideoData } from "@/components/dashboard/VideoManagement";
import { StatsSkeleton } from "@/components/ui/LoadingSkeleton";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedCallback } from "@/hooks/useOptimizedCallback";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeService } from "@/services/employeeService";
import { logger, performanceTracker } from "@/utils/logger";
import { handleError, createDatabaseError, withErrorHandler, withRetry } from "@/utils/errorHandler";
import { sanitizeText } from "@/utils/security";

/**
 * Props interface for the AdminDashboard component
 */
interface AdminDashboardProps {
  /** The admin user's display name */
  userName: string;
  /** The admin user's email address */
  userEmail: string;
  /** Callback function to handle user logout */
  onLogout: () => void;
}

/**
 * Dashboard statistics interface for type safety
 */
interface DashboardStatistics {
  totalVideos: number;
  totalEmployees: number;
  overallCompletionRate: number;
  assignedVideos: number;
}

/**
 * AdminDashboard Component - Main administrative interface for the Senior Services Training Portal
 * 
 * This component provides comprehensive administrative functionality including:
 * - Video library management (create, edit, delete)
 * - Employee progress monitoring and management  
 * - Training assignment and tracking
 * - System settings and configuration
 * 
 * Features:
 * - Tabbed interface for organized access to different admin functions
 * - Real-time video management with thumbnail generation
 * - Secure file upload handling with validation
 * - Comprehensive error handling and user feedback
 * - Performance monitoring and logging
 * - Accessibility-compliant design
 * 
 * Security measures:
 * - Input sanitization for all user-provided content
 * - File type and size validation for uploads
 * - Proper error handling without exposing sensitive information
 * - Admin-only access controls
 * 
 * @component
 * @param {AdminDashboardProps} props - Component props
 * @returns {JSX.Element} Admin dashboard interface
 */
export const AdminDashboard = ({ userName, userEmail, onLogout }: AdminDashboardProps) => {
  // Component state management with performance optimization
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [isEditVideoModalOpen, setIsEditVideoModalOpen] = useState(false);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmVideo, setDeleteConfirmVideo] = useState<VideoData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [employeeCount, setEmployeeCount] = useState(0);
  
  // Hooks for user feedback and optimization
  const { toast } = useToast();
  
  // Memoized dashboard statistics for performance
  const dashboardStats = useMemo<DashboardStatistics>(() => {
    const totalVideos = videos.length;
    const assignedVideos = videos.filter(video => video.assigned_to > 0).length;
    const overallCompletionRate = totalVideos > 0 
      ? Math.round(videos.reduce((sum, video) => sum + video.completion_rate, 0) / totalVideos)
      : 0;
    
    return {
      totalVideos,
      totalEmployees: employeeCount,
      overallCompletionRate,
      assignedVideos
    };
  }, [videos, employeeCount]);

  /**
   * Fetches videos from Supabase with proper error handling and performance monitoring
   * Uses the video service to calculate correct assignment counts and statistics
   */
  const fetchVideos = async () => {
    performanceTracker.start('fetchVideos');
    
    const fetchResult = await withErrorHandler(
      async () => {
        // Try to get videos directly first, auth check is handled by RLS
        const { videoService } = await import('@/services/supabase');
        const result = await videoService.getAll();

        if (!result.success) {
          // If it fails, try with explicit auth check
          const { data: user, error: authError } = await supabase.auth.getUser();
          
          if (authError) {
            // Log the auth error but don't fail completely - might be network issue
            logger.warn('Auth check failed during video fetch, retrying...', {
              error: authError.message,
              adminUser: userEmail
            });
            
            // Retry video fetch once more
            const retryResult = await videoService.getAll();
            if (!retryResult.success) {
              throw createDatabaseError('video fetch after auth retry', 'videos', new Error(retryResult.error || 'Unable to connect to database'));
            }
            setVideos(retryResult.data || []);
            return retryResult.data;
          }

          logger.authEvent('admin_videos_fetch_started', user?.user?.id, user?.user?.email);
          throw createDatabaseError('video fetch', 'videos', new Error(result.error || 'Unknown error'));
        }

        logger.dbOperation('select', 'videos', true, {
          count: result.data?.length || 0,
          adminUser: userEmail
        });

        setVideos(result.data || []);
        return result.data;
      },
      { 
        operation: 'fetchVideos',
        adminUser: userEmail 
      },
      'Unable to load videos. Please refresh the page or contact support.'
    );

    if (!fetchResult.success) {
      toast({
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your internet connection and try again.",
        variant: "destructive",
      });
    }

    performanceTracker.end('fetchVideos');
    setLoading(false);
  };

  /**
   * Fetches employee count from the database with error handling
   */
  const fetchEmployeeCount = useOptimizedCallback(async () => {
    const countResult = await withErrorHandler(
      async () => {
        const employees = await EmployeeService.getEmployees();
        setEmployeeCount(employees.length);
        return employees.length;
      },
      { operation: 'fetchEmployeeCount', adminUser: userEmail },
      'Unable to load employee count'
    );

    if (!countResult.success) {
      logger.warn('Failed to fetch employee count', { adminUser: userEmail });
    }
  }, [userEmail]);

  /**
   * Load videos and employee count on component mount with proper lifecycle management
   */
  useEffect(() => {
    fetchVideos();
    fetchEmployeeCount();
  }, []);

  // Optimized callback functions for performance
  const handleAddVideoClick = useOptimizedCallback(() => {
    setIsAddVideoModalOpen(true);
  }, []);

  const handleEditVideoClick = useOptimizedCallback((video: VideoData) => {
    logger.videoEvent('edit_started', video.id, {
      title: video.title,
      adminUser: userEmail
    });
    
    setEditingVideo(video);
    setIsEditVideoModalOpen(true);
  }, [userEmail]);

  /**
   * Handles video thumbnail click to open video player
   * Provides secure video playback with progress tracking
   */
  const handleVideoThumbnailClick = useOptimizedCallback((video: VideoData) => {
    logger.videoEvent('thumbnail_clicked', video.id, { 
      title: video.title,
      adminUser: userEmail 
    });
    
    setSelectedVideo(video);
    setIsVideoPlayerOpen(true);
  }, [userEmail]);

  /**
   * Handles video player modal close - ensures proper state cleanup
   */
  const handleVideoPlayerClose = useOptimizedCallback((open: boolean) => {
    setIsVideoPlayerOpen(open);
    if (!open) {
      // Clear selected video after modal animation completes
      setTimeout(() => setSelectedVideo(null), 200);
    }
  }, []);

  /**
   * Handles adding a new video with comprehensive error handling and validation
   * Supports both file uploads and URL-based videos with thumbnail generation
   */
  const handleAddVideo = async (videoData: VideoFormData): Promise<void> => {
    performanceTracker.start('addVideo');
    
    const addVideoResult = await withErrorHandler(
      async () => {
        // Sanitize input data for security
        const sanitizedTitle = sanitizeText(videoData.title || 'Untitled Video');
        const sanitizedDescription = videoData.description ? sanitizeText(videoData.description) : null;
        
        let thumbnailUrl: string | null = null;
        let insertData: any = {
          title: sanitizedTitle,
          description: sanitizedDescription,
          type: 'Optional'
        };

        // Handle file upload
        if (videoData.file) {
          const fileName = `${Date.now()}-${videoData.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          logger.info('Starting video file upload', {
            fileName,
            fileSize: videoData.file.size,
            fileType: videoData.file.type,
            adminUser: userEmail
          });

          // Generate thumbnail from video with error handling
          const thumbnailResult = await withErrorHandler(
            async () => {
              const { generateVideoThumbnail, uploadThumbnail } = await import('@/utils/videoThumbnail');
              const thumbnailBase64 = await generateVideoThumbnail(videoData.file!, 1);
              return await uploadThumbnail(thumbnailBase64, `${Date.now()}-thumbnail.jpg`);
            },
            { fileName, operation: 'thumbnailGeneration' },
            'Failed to generate video thumbnail'
          );

          if (thumbnailResult.success) {
            thumbnailUrl = thumbnailResult.data;
            logger.info('Video thumbnail generated successfully', { fileName, thumbnailUrl });
          } else {
            logger.warn('Thumbnail generation failed, continuing without thumbnail', { 
              fileName,
              error: !thumbnailResult.success ? 'Thumbnail generation failed' : undefined
            });
          }

          // Upload video file to storage
          const uploadResult = await withRetry(async () => {
            const { error } = await supabase.storage
              .from('videos')
              .upload(fileName, videoData.file!);
            
            if (error) throw error;
          }, 3);

          insertData = {
            ...insertData,
            video_url: null,
            video_file_name: fileName,
            thumbnail_url: thumbnailUrl
          };

          logger.dbOperation('upload', 'storage.videos', true, {
            fileName,
            fileSize: videoData.file.size,
            adminUser: userEmail
          });
        } else {
          // Handle URL-based video
          const sanitizedUrl = videoData.url ? videoData.url.trim() : null;
          
          if (!sanitizedUrl) {
            throw new Error('Video URL is required when no file is provided');
          }

          insertData = {
            ...insertData,
            video_url: sanitizedUrl,
            video_file_name: null,
            thumbnail_url: null
          };

          logger.info('Adding URL-based video', {
            videoUrl: sanitizedUrl,
            adminUser: userEmail
          });
        }

        // Insert video record into database
        const { error: insertError } = await supabase
          .from('videos')
          .insert(insertData);

        if (insertError) {
          throw createDatabaseError('video insertion', 'videos', insertError);
        }

        logger.dbOperation('insert', 'videos', true, {
          title: sanitizedTitle,
          type: insertData.video_file_name ? 'file' : 'url',
          adminUser: userEmail
        });

        toast({
          title: 'Video Added Successfully',
          description: `"${sanitizedTitle}" has been added to the training library.`,
        });
        
        await fetchVideos(); // Refresh video list
      },
      {
        operation: 'addVideo',
        title: videoData.title,
        hasFile: !!videoData.file,
        hasUrl: !!videoData.url,
        adminUser: userEmail
      },
      'Failed to add video. Please check your input and try again.'
    );

    if (!addVideoResult.success) {
      toast({
        title: 'Video Upload Error',
        description: 'Failed to add video. Please try again.',
        variant: 'destructive',
      });
    }

    performanceTracker.end('addVideo');
  };

  /**
   * Handles updating video details with comprehensive validation and error handling
   */
  const handleUpdateVideo = async (
    videoId: string, 
    updates: { title: string; description: string }
  ) => {
    performanceTracker.start('updateVideo');
    
    const updateResult = await withErrorHandler(
      async () => {
        // Sanitize input for security
        const sanitizedTitle = sanitizeText(updates.title);
        const sanitizedDescription = updates.description ? sanitizeText(updates.description) : null;
        
        if (!sanitizedTitle.trim()) {
          throw new Error('Video title cannot be empty');
        }

        const { error } = await supabase
          .from('videos')
          .update({
            title: sanitizedTitle,
            description: sanitizedDescription,
            updated_at: new Date().toISOString()
          })
          .eq('id', videoId);

        if (error) {
          throw createDatabaseError('video update', 'videos', error);
        }

        logger.dbOperation('update', 'videos', true, {
          videoId,
          title: sanitizedTitle,
          adminUser: userEmail
        });

        toast({
          title: "Video Updated Successfully",
          description: "Video details have been successfully updated.",
        });
        
        await fetchVideos(); // Refresh the videos list
      },
      {
        operation: 'updateVideo',
        videoId,
        adminUser: userEmail
      },
      'Failed to update video. Please try again.'
    );

    if (!updateResult.success) {
      toast({
        title: "Update Error",
        description: "Failed to update video. Please try again.",
        variant: "destructive",
      });
    }

    performanceTracker.end('updateVideo');
  };

  /**
   * Handles video deletion with comprehensive error handling and logging
   */
  const handleDeleteVideo = useOptimizedCallback(async (videoId: string) => {
    performanceTracker.start('deleteVideo');
    setIsDeleting(true);
    
    const deleteResult = await withErrorHandler(
      async () => {
        // Delete video from storage if it's a file upload
        const videoToDelete = videos.find(v => v.id === videoId);
        if (videoToDelete?.video_file_name) {
          await supabase.storage
            .from('videos')
            .remove([videoToDelete.video_file_name]);
        }

        // Delete video record from database
        const { error } = await supabase
          .from('videos')
          .delete()
          .eq('id', videoId);

        if (error) {
          throw createDatabaseError('video deletion', 'videos', error);
        }

        logger.dbOperation('delete', 'videos', true, {
          videoId,
          adminUser: userEmail
        });

        toast({
          title: "Video Deleted Successfully",
          description: "The video has been permanently removed from the training library.",
        });
        
        await fetchVideos(); // Refresh video list
      },
      {
        operation: 'deleteVideo',
        videoId,
        adminUser: userEmail
      },
      'Failed to delete video. Please try again.'
    );

    if (!deleteResult.success) {
      toast({
        title: 'Video Deletion Error',
        description: 'Failed to delete video. Please try again.',
        variant: 'destructive',
      });
    }

    setDeleteConfirmVideo(null);
    setIsDeleting(false);
    performanceTracker.end('deleteVideo');
  }, [videos, userEmail, toast]);

  return (
    <>
      <Header
        userRole="admin"
        userName={userName}
        userEmail={userEmail}
        onLogout={onLogout}
      />
      
      <main className="flex-1 space-y-6 p-4 md:p-8 pt-6" role="main">
        {/* Dashboard Header */}
        <header className="flex items-center justify-between space-y-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage training videos, monitor employee progress, and system settings
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="px-3 py-1 font-medium">
              {userEmail}
            </Badge>
          </div>
        </header>

        {/* Dashboard Statistics */}
        {loading ? (
          <StatsSkeleton />
        ) : (
          <DashboardStats {...dashboardStats} />
        )}

        {/* Main Content Tabs */}
        <div className="space-y-6">
          <Tabs defaultValue="videos" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
              <TabsTrigger 
                value="videos" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Video className="w-4 h-4" aria-hidden="true" />
                Videos
              </TabsTrigger>
              <TabsTrigger 
                value="employees" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Users className="w-4 h-4" aria-hidden="true" />
                Employees
              </TabsTrigger>
              <TabsTrigger 
                value="reports" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                Reports
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="space-y-6 mt-6">
              <VideoManagement
                videos={videos}
                loading={loading}
                onAddVideo={handleAddVideoClick}
                onEditVideo={handleEditVideoClick}
                onDeleteVideo={handleDeleteVideo}
                onVideoThumbnailClick={handleVideoThumbnailClick}
                deleteConfirmVideo={deleteConfirmVideo}
                setDeleteConfirmVideo={setDeleteConfirmVideo}
                isDeleting={isDeleting}
              />
            </TabsContent>

            <TabsContent value="employees" className="space-y-6 mt-6">
              <EmployeeManagement />
            </TabsContent>

            <TabsContent value="reports" className="space-y-6 mt-6">
              <div className="grid gap-6">
                <div className="rounded-lg border border-dashed border-border/50 p-12 text-center">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Advanced Reports Coming Soon
                  </h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Detailed analytics, progress tracking, and comprehensive reporting features 
                    will be available in this section
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <span>• Employee Progress Analytics</span>
                    <span>• Training Completion Reports</span>
                    <span>• Performance Insights</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-6">
              <AdminManagement />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AddVideoModal
        open={isAddVideoModalOpen}
        onOpenChange={setIsAddVideoModalOpen}
        onSave={handleAddVideo}
      />
      
      <EditVideoModal
        open={isEditVideoModalOpen}
        onOpenChange={setIsEditVideoModalOpen}
        video={editingVideo}
        onSave={handleUpdateVideo}
        onDelete={handleDeleteVideo}
      />

      <VideoPlayerModal
        open={isVideoPlayerOpen}
        onOpenChange={handleVideoPlayerClose}
        video={selectedVideo}
      />
    </>
  );
};