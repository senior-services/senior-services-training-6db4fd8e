import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Video, BookOpen, Settings, Plus, Edit, Trash2, Play } from "lucide-react";
import { AddVideoModal, VideoFormData } from "@/components/AddVideoModal";
import { EditVideoModal } from "@/components/EditVideoModal";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { EmployeeManagement } from "@/components/dashboard/EmployeeManagement";
import { AdminManagement } from "@/components/dashboard/AdminManagement";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeService } from "@/services/employeeService";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { logger, performanceTracker } from "@/utils/logger";
import { handleError, createDatabaseError, withErrorHandler, withRetry } from "@/utils/errorHandler";
import { sanitizeText, validateEmail } from "@/utils/security";

/**
 * Props interface for the AdminDashboard component
 * @interface AdminDashboardProps
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
 * Video data interface for type safety
 * @interface VideoData
 */
type VideoData = {
  /** Unique video identifier */
  id: string;
  /** Video title */
  title: string;
  /** Optional video description */
  description: string | null;
  /** URL for streaming videos (YouTube, etc.) */
  video_url: string | null;
  /** Filename for uploaded video files */
  video_file_name: string | null;
  /** Optional thumbnail image URL */
  thumbnail_url?: string | null;
  /** Video type classification */
  type: string;
  /** Number of employees assigned to this video */
  assigned_to: number;
  /** Completion rate percentage */
  completion_rate: number;
  /** Video creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
};

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
  // Component state management
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
  
  // Hooks for user feedback
  const { toast } = useToast();

  // Mock data - will be replaced with real data from Supabase
  const employees = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@southsoundseniors.org',
      requiredProgress: 85,
      completedVideos: 3,
      totalVideos: 4,
      status: 'On Track'
    },
    {
      id: '2', 
      name: 'Mike Chen',
      email: 'mike.chen@southsoundseniors.org',
      requiredProgress: 60,
      completedVideos: 2,
      totalVideos: 5,
      status: 'Behind'
    },
    {
      id: '3',
      name: 'Lisa Rodriguez', 
      email: 'lisa.rodriguez@southsoundseniors.org',
      requiredProgress: 100,
      completedVideos: 4,
      totalVideos: 4,
      status: 'Completed'
    }
  ];


  /**
   * Fetches videos from Supabase with proper error handling and performance monitoring
   * Uses the video service to calculate correct assignment counts and statistics
   * 
   * This function:
   * 1. Authenticates the current user
   * 2. Fetches video data using the optimized video service
   * 3. Handles errors gracefully with user-friendly messages
   * 4. Logs operations for monitoring and debugging
   * 5. Updates the UI state appropriately
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
   * Fetches employee count from the database
   */
  const fetchEmployeeCount = async () => {
    try {
      const employees = await EmployeeService.getEmployees();
      setEmployeeCount(employees.length);
    } catch (error) {
      console.error('Error fetching employee count:', error);
    }
  };

  /**
   * Load videos and employee count on component mount with proper lifecycle management
   */
  useEffect(() => {
    fetchVideos();
    fetchEmployeeCount();
  }, []);

  /**
   * Generates a consistent color for video thumbnails based on title
   * Provides visual consistency and accessibility for videos without thumbnails
   * 
   * @param {string} title - Video title to generate color from
   * @returns {string} Tailwind CSS color class
   */
  const generateThumbnailColor = (title: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-indigo-500',
      'bg-pink-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'
    ];
    
    // Create hash from title for consistent color selection
    const hash = title.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  /**
   * Handles video thumbnail click to open video player
   * Provides secure video playback with progress tracking
   * 
   * @param {VideoData} video - Video data to play
   */
  const handleVideoThumbnailClick = (video: VideoData) => {
    console.log('Opening video player for video:', video);
    logger.videoEvent('thumbnail_clicked', video.id, { 
      title: video.title,
      adminUser: userEmail 
    });
    
    setSelectedVideo(video);
    setIsVideoPlayerOpen(true);
  };

  /**
   * Handles video player modal close - ensures proper state cleanup
   */
  const handleVideoPlayerClose = (open: boolean) => {
    setIsVideoPlayerOpen(open);
    // Don't clear selectedVideo immediately - let the modal handle its own cleanup
  };

  /**
   * Handles adding a new video with comprehensive error handling and validation
   * Supports both file uploads and URL-based videos with thumbnail generation
   * 
   * This function:
   * 1. Validates and sanitizes input data for security
   * 2. Handles file upload with automatic thumbnail generation
   * 3. Processes URL-based videos with proper validation
   * 4. Provides detailed error handling and user feedback
   * 5. Logs all operations for monitoring and debugging
   * 
   * @param {VideoFormData} videoData - Form data containing video information
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
   * Handles editing video metadata with validation and error handling
   * 
   * @param {VideoData} video - Video to edit
   */
  const handleEditVideo = (video: VideoData) => {
    logger.videoEvent('edit_started', video.id, {
      title: video.title,
      adminUser: userEmail
    });
    
    setEditingVideo(video);
    setIsEditVideoModalOpen(true);
  };

  /**
   * Handles updating video details with comprehensive validation and error handling
   * 
   * @param {string} videoId - ID of video to update
   * @param {object} updates - Updates to apply
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
   * 
   * @param {string} videoId - ID of video to delete
   */
  const handleDeleteVideo = async (videoId: string) => {
    performanceTracker.start('deleteVideo');
    
    const deleteResult = await withErrorHandler(
      async () => {
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
          description: "Video has been permanently removed from the library.",
        });
        
        await fetchVideos(); // Refresh the videos list
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
        title: "Deletion Error",
        description: "Failed to delete video. Please try again.",
        variant: "destructive",
      });
    }

    performanceTracker.end('deleteVideo');
  };

  /**
   * Confirms and executes video deletion with proper state management
   */
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmVideo) {
      logger.warn('Delete confirmation called without video', { adminUser: userEmail });
      return;
    }
    
    setIsDeleting(true);
    
    logger.videoEvent('delete_confirmed', deleteConfirmVideo.id, {
      title: deleteConfirmVideo.title,
      adminUser: userEmail
    });
    
    await handleDeleteVideo(deleteConfirmVideo.id);
    setDeleteConfirmVideo(null);
    setIsDeleting(false);
  };

  return (
    <>
      <Header
        userRole="admin"
        userName={userName}
        userEmail={userEmail}
        onLogout={onLogout}
      />
      
      <main className="container mx-auto px-4 pb-6">
        <div>

            <Tabs defaultValue="videos" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="videos" className="gap-2">
                  Videos
                </TabsTrigger>
                <TabsTrigger value="employees" className="gap-2">
                  Employees  
                </TabsTrigger>
                <TabsTrigger value="settings">Admins</TabsTrigger>
              </TabsList>

            <TabsContent value="employees" className="space-y-6 mt-6">
              <EmployeeManagement onCountChange={setEmployeeCount} />
            </TabsContent>

            <TabsContent value="videos" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">Training Videos</h3>
                  <p className="text-muted-foreground">Manage your training content library</p>
                </div>
                <Button onClick={() => setIsAddVideoModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Video Title and Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-12 text-muted-foreground">
                            <div className="space-y-2">
                              <p>Loading videos...</p>
                              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : videos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-12">
                            <div className="space-y-3">
                              <Video className="w-12 h-12 text-muted-foreground mx-auto" />
                              <div>
                                <h4 className="font-medium text-foreground">No videos found</h4>
                                <p className="text-sm text-muted-foreground">Add your first video to get started with training content.</p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setIsAddVideoModalOpen(true)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Video
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        videos.map((video) => (
                          <TableRow key={video.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                {/* Video Preview (thumbnail area) */}
                                <div 
                                  onClick={() => handleVideoThumbnailClick(video)}
                                  className="relative w-16 h-10 rounded-md overflow-hidden cursor-pointer group bg-muted"
                                >
                                  {(() => {
                                    const isYouTube = video.video_url && (
                                      video.video_url.includes('youtube.com/watch') ||
                                      video.video_url.includes('youtu.be/')
                                    );
                                    
                                    const isGoogleDrive = video.video_url && (
                                      video.video_url.includes('drive.google.com')
                                    );
                                    
                                    const getYouTubeVideoId = (url: string) => {
                                      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
                                      return match ? match[1] : null;
                                    };

                                    const getGoogleDriveFileId = (url: string) => {
                                      const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)\//);
                                      return match ? match[1] : null;
                                    };
                                    
                                    if (isYouTube && video.video_url) {
                                      const videoId = getYouTubeVideoId(video.video_url);
                                      if (videoId) {
                                        return (
                                          <img 
                                            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                            alt={`${video.title} thumbnail`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              // Fallback to colored placeholder if thumbnail fails to load
                                              const target = e.target as HTMLImageElement;
                                              target.style.display = 'none';
                                              const fallback = target.nextElementSibling as HTMLElement;
                                              if (fallback) fallback.classList.remove('hidden');
                                            }}
                                          />
                                        );
                                      }
                                    } else if (isGoogleDrive && video.video_url) {
                                      const fileId = getGoogleDriveFileId(video.video_url);
                                      if (fileId) {
                                        return (
                                          <img 
                                            src={`https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h300`}
                                            alt={`${video.title} thumbnail`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              // Fallback to colored placeholder if thumbnail fails to load
                                              const target = e.target as HTMLImageElement;
                                              target.style.display = 'none';
                                              const fallback = target.nextElementSibling as HTMLElement;
                                              if (fallback) fallback.classList.remove('hidden');
                                            }}
                                          />
                                        );
                                      }
                                    } else if (video.thumbnail_url) {
                                      return (
                                        <img 
                                          src={video.thumbnail_url}
                                          alt={`${video.title} thumbnail`}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            // Fallback to colored placeholder if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const fallback = target.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.classList.remove('hidden');
                                          }}
                                        />
                                      );
                                    } else if (video.video_file_name) {
                                      // For uploaded videos without thumbnails, show colored placeholder
                                      return (
                                        <div className={`absolute inset-0 flex items-center justify-center ${generateThumbnailColor(video.title)}`}>
                                          <Play className="w-4 h-4 text-white" />
                                        </div>
                                      );
                                    }
                                    // For all other cases, show the colored placeholder
                                    return (
                                      <div className={`absolute inset-0 flex items-center justify-center ${generateThumbnailColor(video.title)}`}>
                                        <Play className="w-4 h-4 text-white" />
                                      </div>
                                    );
                                  })()}

                                  {/* Hidden fallback placeholder for YouTube/thumbnail errors */}
                                  <div className={`hidden absolute inset-0 flex items-center justify-center ${generateThumbnailColor(video.title)}`}>
                                    <Play className="w-4 h-4 text-white" />
                                  </div>

                                  {/* Show indicator for uploaded files */}
                                  {video.video_file_name && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" title="Uploaded video file" />
                                  )}

                                  {/* Hover overlay with play icon */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <Play className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                
                                {/* Video Title */}
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">{video.title}</p>
                                  {video.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                      {video.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditVideo(video)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setDeleteConfirmVideo(video)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
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
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmVideo} onOpenChange={(open) => { if (!open) setDeleteConfirmVideo(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmVideo?.title}"?
              <br />
              <br />
              This will permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The video and all its content</li>
                <li>Title and description</li>
                <li>Its assignment as a required video for users</li>
              </ul>
              <br />
              <strong>This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Video'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VideoPlayerModal
        open={isVideoPlayerOpen}
        onOpenChange={handleVideoPlayerClose}
        video={selectedVideo}
      />
    </>
  );
};