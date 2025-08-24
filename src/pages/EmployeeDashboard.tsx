import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { TrainingCard, TrainingVideo } from "@/components/TrainingCard";
import { Badge } from "@/components/ui/badge";

import { BookOpen } from "lucide-react";
import { EmployeeService } from "@/services/employeeService";
import { LoadingSkeleton } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import type { Video } from "@/types";

interface EmployeeDashboardProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
  onPlayVideo: (videoId: string) => void;
}

export const EmployeeDashboard = ({ userName, userEmail, onLogout, onPlayVideo }: EmployeeDashboardProps) => {
  const [assignedVideoData, setAssignedVideoData] = useState<{ video: Video; assignment: any }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load assigned videos on component mount
  useEffect(() => {
    loadAssignedVideos();
  }, [userEmail]);

  const loadAssignedVideos = async () => {
    try {
      setLoading(true);
      const videoData = await EmployeeService.getAssignedVideosByEmail(userEmail);
      setAssignedVideoData(videoData);
    } catch (error) {
      console.error('Error loading assigned videos:', error);
      toast({
        title: "Error",
        description: "Failed to load your assigned videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Transform database videos to TrainingVideo format
  const transformToTrainingVideo = (video: Video, assignment?: any): TrainingVideo => ({
    id: video.id,
    title: video.title || 'Untitled Video',
    description: video.description || '',
    thumbnail: video.thumbnail_url || 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=300&fit=crop',
    duration: '15 min', // TODO: Add actual duration field to database
    progress: 0, // TODO: Add progress tracking
    isRequired: video.type === 'Required',
    deadline: undefined, // TODO: Add deadline from assignment  
    dueDate: assignment?.due_date || null, // Pass the actual due date from assignment
    status: video.video_url ? undefined : ('warning' as const) // Mark videos without URLs as warning
  });

  // Filter required videos only
  const requiredVideos = assignedVideoData
    .filter(item => item.video.type === 'Required')
    .map(item => transformToTrainingVideo(item.video, item.assignment));

  const overallProgress = requiredVideos.length > 0 
    ? Math.round(requiredVideos.reduce((sum, video) => sum + video.progress, 0) / requiredVideos.length)
    : 0;

  const completedRequired = requiredVideos.filter(v => v.progress === 100).length;
  const totalRequired = requiredVideos.length;

  return (
    <div className="min-h-screen bg-muted/30">
      <Header 
        userRole="employee"
        userName={userName}
        userEmail={userEmail}
        overallProgress={overallProgress}
        onLogout={onLogout}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {userName.split(' ')[0]}!
          </h2>
          <p className="text-muted-foreground">
            Continue your training journey and stay up to date with the latest best practices.
          </p>
        </div>


        {/* Required Training Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-semibold">Required Training</h3>
            <Badge variant="secondary">
              {totalRequired}
            </Badge>
          </div>
          <p className="text-muted-foreground mb-6">
            Complete these essential training modules to meet your onboarding requirements.
          </p>
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <LoadingSkeleton lines={1} className="h-64" />
              <LoadingSkeleton lines={1} className="h-64" />
              <LoadingSkeleton lines={1} className="h-64" />
            </div>
          ) : requiredVideos.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No required training videos assigned yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requiredVideos.map((video) => (
                <TrainingCard
                  key={video.id}
                  video={video}
                  onPlay={onPlayVideo}
                />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};