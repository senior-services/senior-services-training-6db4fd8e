import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  progress: number;
  isRequired?: boolean;
  deadline?: string;
  status?: 'overdue' | 'warning' | 'upcoming' | 'completed';
  hasQuiz?: boolean;
}

interface TrainingCardProps {
  video: TrainingVideo;
  onPlay: (videoId: string) => void;
  className?: string;
}

export const TrainingCard = ({ video, onPlay, className }: TrainingCardProps) => {
  const getStatusBadge = () => {
    if (!video.status) return null;
    
    const statusConfig = {
      overdue: { label: 'Overdue', className: 'status-overdue' },
      warning: { label: '< 5 days', className: 'status-warning' },
      upcoming: { label: 'Upcoming', className: 'status-upcoming' },
      completed: { label: 'Completed', className: 'status-completed' }
    };

    const config = statusConfig[video.status];
    return (
      <Badge className={cn('status-badge absolute top-2 right-2', config.className)}>
        {config.label}
      </Badge>
    );
  };

  const isCompleted = video.progress === 100;
  const hasStarted = video.progress > 0;

  return (
    <Card className={cn('training-card group relative overflow-hidden', className)}>
      {/* Video Thumbnail */}
      <div className="relative">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-48 object-cover"
        />
        
        {getStatusBadge()}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="lg"
            onClick={() => onPlay(video.id)}
            className="rounded-full w-16 h-16 bg-white/90 hover:bg-white text-primary hover:text-primary shadow-lg"
          >
            <Play className="w-6 h-6 ml-1" />
          </Button>
        </div>

        {/* Progress Overlay */}
        {hasStarted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${video.progress}%` }}
            />
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight line-clamp-2">
            {video.title}
          </CardTitle>
          {video.isRequired && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Required
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2">
          {video.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-primary">{video.progress}%</span>
          </div>
          <Progress value={video.progress} className="h-2" />
        </div>

        {/* Video Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{video.duration}</span>
          </div>
          
          {video.deadline && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Due {video.deadline}</span>
            </div>
          )}
        </div>

        {video.hasQuiz && (
          <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            📝 Quiz required after completion
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button 
          onClick={() => onPlay(video.id)}
          className="w-full"
          variant={isCompleted ? "secondary" : "default"}
        >
          {isCompleted ? "Review" : hasStarted ? "Continue" : "Start Training"}
        </Button>
      </CardFooter>
    </Card>
  );
};