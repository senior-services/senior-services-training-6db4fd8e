import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { AddVideoModal, VideoFormData } from "@/components/AddVideoModal";
import { EditVideoModal, VideoData } from "@/components/EditVideoModal";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { AdminDashboardLayout } from "@/components/layout/DashboardLayout";
import { VideoTable } from "@/components/dashboard/VideoTable";
import { EmployeeList } from "@/components/dashboard/EmployeeList";
import { useVideos } from "@/hooks/useVideos";
import { useEmployees } from "@/hooks/useEmployees";

interface AdminDashboardProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

export const AdminDashboard = ({ userName, userEmail, onLogout }: AdminDashboardProps) => {
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [isEditVideoModalOpen, setIsEditVideoModalOpen] = useState(false);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
  
  // Use custom hooks for data management
  const {
    videos,
    loading: videosLoading,
    addVideo,
    updateVideo,
    deleteVideo,
    selectVideo,
    selectedVideo,
  } = useVideos();

  const {
    employees,
    loading: employeesLoading,
    selectEmployee,
  } = useEmployees();

  // Video management handlers
  const handleAddVideo = async (videoData: VideoFormData) => {
    const success = await addVideo(videoData);
    if (success) {
      setIsAddVideoModalOpen(false);
    }
  };

  const handleEditVideo = (video: VideoData) => {
    setEditingVideo(video);
    setIsEditVideoModalOpen(true);
  };

  const handleUpdateVideo = async (videoId: string, updates: { title: string; description: string }) => {
    const success = await updateVideo(videoId, updates);
    if (success) {
      setIsEditVideoModalOpen(false);
      setEditingVideo(null);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    const success = await deleteVideo(videoId);
    if (success) {
      setIsEditVideoModalOpen(false);
      setEditingVideo(null);
    }
  };

  const handlePlayVideo = (video: VideoData) => {
    selectVideo(video);
    setIsVideoPlayerOpen(true);
  };

  return (
    <AdminDashboardLayout
      userName={userName}
      userEmail={userEmail}
      onLogout={onLogout}
      loading={videosLoading || employeesLoading}
    >
      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          <EmployeeList
            employees={employees}
            loading={employeesLoading}
            onEmployeeSelect={selectEmployee}
          />
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          <VideoTable
            videos={videos}
            loading={videosLoading}
            onEdit={handleEditVideo}
            onDelete={(video) => handleDeleteVideo(video.id)}
            onPlay={handlePlayVideo}
            onAddVideo={() => setIsAddVideoModalOpen(true)}
          />
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

      {/* Modals */}
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
        onOpenChange={setIsVideoPlayerOpen}
        video={selectedVideo}
      />
    </AdminDashboardLayout>
  );
};