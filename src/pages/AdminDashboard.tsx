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
  type: string;
  assigned_to: number;
  completion_rate: number;
  has_quiz: boolean;
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

  // Fetch videos from Supabase
  const fetchVideos = async () => {
    console.log('Fetching videos...');
    try {
      const { data: user } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Videos query result:', { data, error });

      if (error) {
        console.error('Error fetching videos:', error);
        toast({
          title: "Error",
          description: `Failed to load videos: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('Setting videos:', data);
        setVideos(data || []);
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
      const { error } = await supabase
        .from('videos')
        .insert({
          title: videoData.title || 'Untitled Video',
          description: videoData.description,
          video_url: videoData.url,
          video_file_name: videoData.file?.name,
          type: 'Optional', // Default type, can be updated later
          has_quiz: false // Default value, can be updated later
        });

      if (error) {
        console.error('Error adding video:', error);
        toast({
          title: "Error",
          description: "Failed to add video. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Video Added",
          description: `"${videoData.title || 'Video'}" has been added to the training library.`,
        });
        
        // Refresh the videos list
        fetchVideos();
      }
    } catch (error) {
      console.error('Error adding video:', error);
      toast({
        title: "Error",
        description: "Failed to add video. Please try again.",
        variant: "destructive",
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
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Administrator Dashboard</h1>
            <p className="text-muted-foreground">
              Manage training content, monitor employee progress, and configure system settings.
            </p>
          </div>

            <Tabs defaultValue="videos" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="employees">Employees</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

            <TabsContent value="employees" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">Employee Progress Overview</h3>
                  <p className="text-muted-foreground">Track training completion and identify employees who need support</p>
                </div>
              </div>

              <div className="space-y-6">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-foreground">{employee.name}</h4>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                        <Badge 
                          variant={
                            employee.status === 'completed' ? 'default' :
                            employee.status === 'on-track' ? 'secondary' : 'destructive'
                          }
                        >
                          {employee.status === 'completed' ? 'Completed' :
                           employee.status === 'on-track' ? 'On Track' : 'Behind Schedule'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{employee.requiredProgress}%</span>
                          </div>
                          <Progress value={employee.requiredProgress} className="h-2" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {employee.completedVideos}/{employee.totalVideos} videos
                        </div>
                      </div>
                    </div>
                    <div className="ml-6 flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
                        <TableHead className="text-center">Assigned To</TableHead>
                        <TableHead className="text-center">Quiz</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                            <div className="space-y-2">
                              <p>Loading videos...</p>
                              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : videos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12">
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
                                {/* Video Thumbnail */}
                                <div 
                                  onClick={() => handleVideoThumbnailClick(video)}
                                  className={`w-16 h-10 rounded-md flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity ${
                                    video.video_url 
                                      ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                                      : generateThumbnailColor(video.title)
                                  }`}
                                >
                                  <Play className="w-4 h-4 text-white" />
                                  {!video.video_url && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-white" title="No video file" />
                                  )}
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
                            <TableCell className="text-center">{video.assigned_to}</TableCell>
                            <TableCell className="text-center">
                              {video.has_quiz ? (
                                <Badge variant="secondary">Yes</Badge>
                              ) : (
                                <span className="text-muted-foreground">No</span>
                              )}
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