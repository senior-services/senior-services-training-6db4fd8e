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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

interface AdminDashboardProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

type VideoData = {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_file_name: string | null;
  thumbnail_url?: string | null;
  type: string;
  assigned_to: number;
  completion_rate: number;
  created_at: string;
  updated_at: string;
};

export const AdminDashboard = ({ userName, userEmail, onLogout }: AdminDashboardProps) => {
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [isEditVideoModalOpen, setIsEditVideoModalOpen] = useState(false);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [deleteConfirmVideo, setDeleteConfirmVideo] = useState<VideoData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  // Mock data - will be replaced with real data from Supabase
  const employees = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@southsoundseniors.org',
      requiredProgress: 85,
      completedVideos: 3,
      totalVideos: 4,
      status: 'on-track'
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@southsoundseniors.org',
      requiredProgress: 60,
      completedVideos: 2,
      totalVideos: 4,
      status: 'behind'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@southsoundseniors.org',
      requiredProgress: 100,
      completedVideos: 4,
      totalVideos: 4,
      status: 'completed'
    }
  ];

  // Fetch videos from Supabase using the service that calculates correct assignment counts
  const fetchVideos = async () => {
    console.log('Fetching videos...');
    try {
      const { data: user } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      // Use videoService which correctly calculates assignment counts
      const { videoService } = await import('@/services/supabase');
      const result = await videoService.getAll();

      console.log('Videos service result:', result);

      if (!result.success) {
        console.error('Error fetching videos:', result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to load videos",
          variant: "destructive",
        });
      } else {
        console.log('Setting videos:', result.data);
        setVideos(result.data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error", 
        description: "An unexpected error occurred while loading videos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load videos on component mount
  useEffect(() => {
    fetchVideos();
  }, []);

  const generateThumbnailColor = (title: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-indigo-500',
      'bg-pink-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'
    ];
    
    const hash = title.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  const handleVideoThumbnailClick = (video: VideoData) => {
    setSelectedVideo(video);
    setIsVideoPlayerOpen(true);
  };

  const handleAddVideo = async (videoData: VideoFormData): Promise<void> => {
    try {
      let insertedError: any = null;
      let thumbnailUrl: string | null = null;

      // If a file is provided, upload it to Supabase Storage and generate thumbnail
      if (videoData.file) {
        const fileName = `${Date.now()}-${videoData.file.name}`;
        
        // Generate thumbnail from video
        try {
          const { generateVideoThumbnail, uploadThumbnail } = await import('@/utils/videoThumbnail');
          const thumbnailBase64 = await generateVideoThumbnail(videoData.file, 1);
          thumbnailUrl = await uploadThumbnail(thumbnailBase64, `${Date.now()}-thumbnail.jpg`);
        } catch (thumbnailError) {
          console.warn('Failed to generate thumbnail:', thumbnailError);
          // Continue without thumbnail - not a critical error
        }

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, videoData.file);

        if (uploadError) {
          console.error('Error uploading video file:', uploadError);
          toast({
            title: 'Upload Error',
            description: 'Failed to upload the video file.',
            variant: 'destructive',
          });
          return;
        }

        const { error } = await supabase
          .from('videos')
          .insert({
            title: videoData.title || 'Untitled Video',
            description: videoData.description,
            video_url: null,
            video_file_name: fileName,
            thumbnail_url: thumbnailUrl,
            type: 'Optional'
          });
        insertedError = error;
      } else {
        // URL-based video
        const { error } = await supabase
          .from('videos')
          .insert({
            title: videoData.title || 'Untitled Video',
            description: videoData.description,
            video_url: videoData.url,
            video_file_name: null,
            thumbnail_url: null,
            type: 'Optional'
          });
        insertedError = error;
      }

      if (insertedError) {
        console.error('Error adding video:', insertedError);
        toast({
          title: 'Error',
          description: 'Failed to add video. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Video Added',
          description: `"${videoData.title || 'Video'}" has been added to the training library.`,
        });
        fetchVideos();
      }
    } catch (error) {
      console.error('Error adding video:', error);
      toast({
        title: 'Error',
        description: 'Failed to add video. Please try again.',
        variant: 'destructive',
      });
    }
  };
  // Handle editing a video
  const handleEditVideo = (video: VideoData) => {
    setEditingVideo(video);
    setIsEditVideoModalOpen(true);
  };

  // Handle updating video
  const handleUpdateVideo = async (videoId: string, updates: { title: string; description: string }) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({
          title: updates.title,
          description: updates.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId);

      if (error) {
        console.error('Error updating video:', error);
        toast({
          title: "Error",
          description: "Failed to update video. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Video Updated",
          description: "Video details have been successfully updated.",
        });
        
        // Refresh the videos list
        fetchVideos();
      }
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Error",
        description: "Failed to update video. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle deleting video
  const handleDeleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) {
        console.error('Error deleting video:', error);
        toast({
          title: "Error",
          description: "Failed to delete video. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Video Deleted",
          description: "Video has been permanently removed from the library.",
        });
        
        // Refresh the videos list
        fetchVideos();
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Confirm deletion dialog action
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmVideo) return;
    setIsDeleting(true);
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
      
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">

            <Tabs defaultValue="videos" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="employees">Employees</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

            <TabsContent value="employees" className="space-y-6">
              <EmployeeManagement />
            </TabsContent>

            <TabsContent value="videos" className="space-y-6">
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
                          <TableRow>
                            <TableHead>Title</TableHead>
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
<Button variant="outline" size="sm" onClick={() => setDeleteConfirmVideo(video)}>
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

            <TabsContent value="settings" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">System Settings</h3>
                  <p className="text-muted-foreground">Configure portal settings and manage user permissions</p>
                </div>
              </div>

              <Card>
                <CardContent className="space-y-6">
                  <div className="text-center py-12">
                    <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-medium text-foreground mb-2">Settings Panel</h4>
                    <p className="text-muted-foreground mb-4">
                      Advanced settings and user management features will be available here
                    </p>
                    <Button variant="outline">Coming Soon</Button>
                  </div>
                </CardContent>
              </Card>
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
        onOpenChange={setIsVideoPlayerOpen}
        video={selectedVideo}
      />
    </>
  );
};