import { useState, useEffect, useRef } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmployeeService } from "@/services/employeeService";
import { LoadingSkeleton } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import type { Video } from "@/types";
import { isYouTubeUrl, getYouTubeVideoId, isGoogleDriveUrl, getGoogleDriveEmbedUrl } from "@/utils/videoUtils";

export const VideoPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { role } = useUserRole(user);

  useEffect(() => {
    if (videoId) {
      loadVideo(videoId);
    }
  }, [videoId]);

  const loadVideo = async (id: string) => {
    try {
      setLoading(true);
      const videoData = await EmployeeService.getVideoById(id);
      setVideo(videoData);
    } catch (error) {
      console.error('Error loading video:', error);
      toast({
        title: "Error",
        description: "Failed to load video",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoProgress = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const progressPercent = (video.currentTime / video.duration) * 100;
    setProgress(Math.round(progressPercent));
  };

  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);

  const renderVideoPlayer = (video: Video) => {
    const videoUrl = video.video_url;
    const fileName = video.video_file_name;

    if (!videoUrl && !fileName) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Video not available</p>
        </div>
      );
    }

    // Handle YouTube URLs
    if (videoUrl && isYouTubeUrl(videoUrl)) {
      const videoId = getYouTubeVideoId(videoUrl);
      if (videoId) {
        return (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={video.title}
              className="w-full h-full rounded-lg"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        );
      }
    }

    // Handle Google Drive URLs
    if (videoUrl && isGoogleDriveUrl(videoUrl)) {
      const embedUrl = getGoogleDriveEmbedUrl(videoUrl);
      if (embedUrl) {
        return (
          <div className="aspect-video">
            <iframe
              src={embedUrl}
              title={video.title}
              className="w-full h-full rounded-lg"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        );
      }
    }

    // Handle direct video files or other URLs
    const videoSrc = videoUrl || fileName;
    return (
      <div className="aspect-video">
        <video
          ref={videoRef}
          src={videoSrc}
          title={video.title}
          className="w-full h-full rounded-lg"
          controls
          preload="metadata"
          onTimeUpdate={handleVideoProgress}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <LoadingSkeleton lines={1} className="h-8 w-48 mb-4" />
          </div>
          <LoadingSkeleton lines={1} className="aspect-video mb-6" />
          <LoadingSkeleton lines={1} className="h-8 w-64 mb-4" />
          <LoadingSkeleton lines={3} className="h-20" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link to="/dashboard">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Video not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Return to Dashboard Link */}
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
          </Link>
        </div>

        {/* Video Player */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {renderVideoPlayer(video)}
          </CardContent>
        </Card>

        {/* Video Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{video.title || 'Untitled Video'}</CardTitle>
              
              {/* Circular Progress Indicator */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">Progress</span>
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-muted/20"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      d="M18 2.0845
                        A 15.9155 15.9155 0 0 1 18 33.9155
                        A 15.9155 15.9155 0 0 1 18 2.0845"
                    />
                    <path
                      className="text-primary transition-all duration-300"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${progress}, 100`}
                      strokeLinecap="round"
                      fill="transparent"
                      d="M18 2.0845
                        A 15.9155 15.9155 0 0 1 18 33.9155
                        A 15.9155 15.9155 0 0 1 18 2.0845"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{progress}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Linear Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Video Progress</span>
                <span>{progress}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {video.description && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {video.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};