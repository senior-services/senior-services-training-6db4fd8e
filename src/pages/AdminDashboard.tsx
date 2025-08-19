import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Video, BookOpen, Settings, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { AddVideoModal, VideoFormData } from "@/components/AddVideoModal";
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

interface AdminDashboardProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

type VideoData = {
  id: string;
  title: string;
  description?: string;
  type: string;
  assigned_to: number;
  completion_rate: number;
  has_quiz: boolean;
  created_at: string;
};

export const AdminDashboard = ({ userName, userEmail, onLogout }: AdminDashboardProps) => {
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
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
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleAddVideo = async (videoData: VideoFormData) => {
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
    
    setIsAddVideoModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header 
        userRole="admin"
        userName={userName}
        userEmail={userEmail}
        onLogout={onLogout}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Administrator Dashboard
          </h2>
          <p className="text-muted-foreground">
            Manage training content, track employee progress, and oversee the learning portal.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">15</div>
              <p className="text-xs text-muted-foreground">active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Training Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">12</div>
              <p className="text-xs text-muted-foreground">total videos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">78%</div>
              <p className="text-xs text-muted-foreground">average completion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">3</div>
              <p className="text-xs text-muted-foreground">need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Progress Overview</CardTitle>
                <CardDescription>
                  Track training completion and identify employees who need support
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Assigned To</TableHead>
                      <TableHead className="text-center">Completion Rate</TableHead>
                      <TableHead className="text-center">Quiz</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          <div className="space-y-2">
                            <p>Loading videos...</p>
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : videos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
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
                          <TableCell className="font-medium">{video.title}</TableCell>
                          <TableCell>
                            <Badge variant={video.type === 'Required' ? 'default' : 'outline'}>
                              {video.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{video.assigned_to}</TableCell>
                          <TableCell className="text-center">{video.completion_rate}%</TableCell>
                          <TableCell className="text-center">
                            {video.has_quiz ? (
                              <Badge variant="secondary">Yes</Badge>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
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
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure portal settings and manage user permissions
                </CardDescription>
              </CardHeader>
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
      </main>

      <AddVideoModal
        open={isAddVideoModalOpen}
        onOpenChange={setIsAddVideoModalOpen}
        onSave={handleAddVideo}
      />
    </div>
  );
};