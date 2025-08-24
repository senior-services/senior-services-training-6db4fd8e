import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format, differenceInDays, isPast } from 'date-fns';
import videoPlaceholder from "@/assets/video-placeholder.jpg";
export interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  progress: number;
  isRequired?: boolean;
  deadline?: string;
  dueDate?: string | null; // Added due date field
  status?: 'overdue' | 'warning' | 'upcoming' | 'completed';
}
interface TrainingCardProps {
  video: TrainingVideo;
  onPlay: (videoId: string) => void;
  className?: string;
}
export const TrainingCard = ({
  video,
  onPlay,
  className
}: TrainingCardProps) => {
  
  const getDeadlineBadge = (dueDate: string | null, isCompleted: boolean = false) => {
    if (isCompleted) {
      return {
        variant: "default" as const,
        className: "bg-green-800 text-white hover:bg-green-800",
        text: "Completed"
      };
    }
    if (!dueDate) {
      return null; // Don't show badge if no due date
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const daysUntilDue = differenceInDays(due, today);
    if (isPast(due) && daysUntilDue < 0) {
      return {
        variant: "default" as const,
        className: "bg-red-800 text-white hover:bg-red-800",
        text: "Overdue"
      };
    }
    if (daysUntilDue === 0) {
      return {
        variant: "default" as const,
        className: "bg-orange-700 text-white hover:bg-orange-700",
        text: "Due in 0 days"
      };
    }
    if (daysUntilDue <= 30) {
      // Show badges for dates within 30 days
      return {
        variant: "default" as const,
        className: "bg-gray-700 text-white hover:bg-gray-700",
        text: `Due in ${daysUntilDue} days`
      };
    }
    return null; // Don't show badge for far future dates
  };
  const isCompleted = video.progress === 100;
  const hasStarted = video.progress > 0;
  const badgeProps = video.isRequired ? getDeadlineBadge(video.dueDate, isCompleted) : null;
  return <Card className={cn('training-card group relative overflow-hidden', className)}>
      {/* Video Thumbnail */}
      <div className="relative">
        <Link to={`/video/${video.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${video.title}`}>
          <img src={video.thumbnail || videoPlaceholder} alt={video.title} className="w-full h-48 object-cover" />
        </Link>
        {/* Due Date Badge Overlay */}
        {badgeProps && <Badge variant={badgeProps.variant} className={cn('absolute top-2 right-2 text-xs font-medium shadow-lg z-10', badgeProps.className)}>
            {badgeProps.text}
          </Badge>}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <Button 
            type="button" 
            size="lg" 
            className="rounded-full w-16 h-16 bg-white/90 hover:bg-white text-primary hover:text-primary shadow-lg pointer-events-auto"
            asChild
          >
            <Link to={`/video/${video.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Play ${video.title}`}>
              <Play className="w-6 h-6 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Progress Overlay */}
        {hasStarted && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div className="h-full bg-primary transition-all duration-300" style={{
          width: `${video.progress}%`
        }} />
          </div>}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight line-clamp-2">
            {video.title}
          </CardTitle>
          {video.isRequired}
        </div>
        <CardDescription className="line-clamp-2">
          {video.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Video Info with Circular Progress */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{video.duration}</span>
            </div>
            
            {video.isRequired && video.deadline && <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Due {video.deadline}</span>
              </div>}
          </div>
          
          {/* Circular Progress */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Progress</span>
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted/20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  d="M18 2.0845
                    A 15.9155 15.9155 0 0 1 18 33.9155
                    A 15.9155 15.9155 0 0 1 18 2.0845"
                />
                <path
                  className="text-primary"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${video.progress}, 100`}
                  strokeLinecap="round"
                  fill="transparent"
                  d="M18 2.0845
                    A 15.9155 15.9155 0 0 1 18 33.9155
                    A 15.9155 15.9155 0 0 1 18 2.0845"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">{video.progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          type="button" 
          className="w-full" 
          variant={isCompleted ? "secondary" : "default"}
          asChild
        >
          <Link to={`/video/${video.id}`} target="_blank" rel="noopener noreferrer" aria-label={`${isCompleted ? "Review" : hasStarted ? "Continue" : "Start"} ${video.title}`}>
            {isCompleted ? "Review" : hasStarted ? "Continue" : "Start Training"}
          </Link>
        </Button>
      </CardFooter>
    </Card>;
};