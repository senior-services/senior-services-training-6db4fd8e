/**
 * Enhanced TrainingCard Component for the Senior Services Training Portal
 * Implements accessibility, security, and performance best practices
 * Provides comprehensive training video information with proper ARIA support
 */

import React, { memo, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isPast } from 'date-fns';

// Enhanced utility imports
import { sanitizeText, createSafeDisplayName } from '@/utils/security';
import { getTrainingCardAriaLabel, getProgressAriaLabel, getStatusAnnouncement, handleKeyPress, formatDuration, announceToScreenReader } from '@/utils/accessibility';
import { useOptimizedCallback, useOptimizedMemo } from '@/utils/performance';

// Import optimized image loading
import videoPlaceholder from '@/assets/video-placeholder.jpg';

/**
 * Enhanced TrainingVideo interface with comprehensive type safety
 */
export interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  progress: number;
  isRequired?: boolean;
  deadline?: string;
  dueDate?: string | null;
  status?: 'overdue' | 'warning' | 'upcoming' | 'completed';
}

/**
 * Props interface for TrainingCard component
 */
interface TrainingCardProps {
  video: TrainingVideo;
  onPlay: (videoId: string) => void;
  className?: string;
  priority?: boolean; // For performance optimization
}

/**
 * Status badge configuration with enhanced accessibility
 */
interface BadgeConfig {
  variant: 'default';
  className: string;
  text: string;
  ariaLabel: string;
}

/**
 * Enhanced TrainingCard component with accessibility, security, and performance optimizations
 */
export const TrainingCard = memo<TrainingCardProps>(({
  video,
  onPlay,
  className,
  priority = false
}) => {
  // Sanitize video data for security
  const sanitizedVideo = useMemo(() => ({
    ...video,
    title: sanitizeText(video.title || 'Untitled Video'),
    description: sanitizeText(video.description || ''),
    thumbnail: video.thumbnail || videoPlaceholder
  }), [video]);

  // Calculate training status and progress
  const trainingStatus = useOptimizedMemo(() => {
    const isCompleted = sanitizedVideo.progress === 100;
    const hasStarted = sanitizedVideo.progress > 0;
    return {
      isCompleted,
      hasStarted,
      statusText: isCompleted ? 'Completed' : hasStarted ? 'In Progress' : 'Not Started'
    };
  }, [sanitizedVideo.progress]);

  // Calculate due date status with comprehensive logic
  const dueDateInfo = useOptimizedMemo(() => {
    if (!sanitizedVideo.dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(sanitizedVideo.dueDate);
    due.setHours(0, 0, 0, 0);
    const daysUntilDue = differenceInDays(due, today);
    if (trainingStatus.isCompleted) {
      return {
        variant: 'default' as const,
        className: 'bg-success text-success-foreground hover:bg-success border-success',
        text: 'Completed',
        ariaLabel: 'Training completed successfully',
        priority: 'low' as const
      };
    }
    if (isPast(due) && daysUntilDue < 0) {
      return {
        variant: 'default' as const,
        className: 'bg-destructive text-destructive-foreground hover:bg-destructive border-destructive',
        text: 'Overdue',
        ariaLabel: `Training is overdue by ${Math.abs(daysUntilDue)} days`,
        priority: 'high' as const
      };
    }
    if (daysUntilDue === 0) {
      return {
        variant: 'default' as const,
        className: 'bg-warning text-warning-foreground hover:bg-warning border-warning',
        text: 'Due Today',
        ariaLabel: 'Training is due today',
        priority: 'high' as const
      };
    }
    if (daysUntilDue <= 7) {
      return {
        variant: 'default' as const,
        className: 'bg-muted text-muted-foreground hover:bg-muted border-muted-foreground',
        text: `Due in ${daysUntilDue} days`,
        ariaLabel: `Training is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
        priority: 'medium' as const
      };
    }
    if (daysUntilDue <= 30) {
      return {
        variant: 'default' as const,
        className: 'bg-muted text-muted-foreground hover:bg-muted border-muted-foreground',
        text: `Due in ${daysUntilDue} days`,
        ariaLabel: `Training is due in ${daysUntilDue} days`,
        priority: 'low' as const
      };
    }
    return null;
  }, [sanitizedVideo.dueDate, trainingStatus.isCompleted]);

  // Generate comprehensive ARIA labels
  const ariaLabels = useOptimizedMemo(() => ({
    card: getTrainingCardAriaLabel(sanitizedVideo.title, sanitizedVideo.progress, sanitizedVideo.isRequired || false, sanitizedVideo.dueDate),
    progress: getProgressAriaLabel(sanitizedVideo.progress, sanitizedVideo.title),
    playButton: `Play ${sanitizedVideo.title} video. ${trainingStatus.statusText}.`,
    actionButton: trainingStatus.isCompleted ? `Review ${sanitizedVideo.title}` : trainingStatus.hasStarted ? `Continue ${sanitizedVideo.title}` : `Start ${sanitizedVideo.title} training`
  }), [sanitizedVideo, trainingStatus]);

  // Optimized callback for play action
  const handlePlay = useOptimizedCallback(() => {
    onPlay(sanitizedVideo.id);

    // Announce action to screen readers
    const announcement = getStatusAnnouncement(sanitizedVideo.progress, sanitizedVideo.isRequired || false, sanitizedVideo.dueDate);
    announceToScreenReader(`Opening video: ${sanitizedVideo.title}. ${announcement}`);
  }, [sanitizedVideo.id, sanitizedVideo.title, sanitizedVideo.progress, sanitizedVideo.isRequired, sanitizedVideo.dueDate, onPlay]);

  // Keyboard navigation handler
  const handleCardKeyPress = useOptimizedCallback((event: React.KeyboardEvent) => {
    handleKeyPress(event, handlePlay);
  }, [handlePlay]);

  // Image error handler for accessibility
  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.src = videoPlaceholder;
    event.currentTarget.alt = `${sanitizedVideo.title} - Video thumbnail unavailable`;
  }, [sanitizedVideo.title]);
  return <article className={cn('training-card group relative overflow-hidden focus-within:ring-2 focus-within:ring-ring', className)} aria-label={ariaLabels.card} role="article">
      <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-lg">
        {/* Video Thumbnail with Enhanced Accessibility */}
        <header className="relative">
          <button type="button" onClick={handlePlay} aria-label={ariaLabels.playButton} className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-t-lg w-full text-left">
            <img src={sanitizedVideo.thumbnail} alt={`${sanitizedVideo.title} - Training video thumbnail`} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" loading={priority ? "eager" : "lazy"} onError={handleImageError} />
          </button>

          {/* Due Date Badge with Enhanced Accessibility */}
          {dueDateInfo && <Badge variant={dueDateInfo.variant} className={cn('absolute top-3 right-3 text-xs font-medium shadow-lg z-10 border-2', dueDateInfo.className)} aria-label={dueDateInfo.ariaLabel} role="status">
              {dueDateInfo.priority === 'high' && <AlertCircle className="w-3 h-3 mr-1" aria-hidden="true" />}
              {dueDateInfo.text}
            </Badge>}
          
          {/* Play Button Overlay with Enhanced Accessibility */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button size="lg" className="rounded-full w-16 h-16 bg-white/90 hover:bg-white text-primary hover:text-primary shadow-lg" onClick={handlePlay} onKeyDown={handleCardKeyPress} aria-label={ariaLabels.playButton}>
              <Play className="w-6 h-6 ml-1" aria-hidden="true" />
              <span className="sr-only">{ariaLabels.playButton}</span>
            </Button>
          </div>

          {/* Progress Overlay with Accessibility */}
          {trainingStatus.hasStarted && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20" role="progressbar" aria-label={ariaLabels.progress} aria-valuenow={sanitizedVideo.progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-primary transition-all duration-500 ease-out" style={{
            width: `${sanitizedVideo.progress}%`
          }} />
            </div>}
        </header>

        {/* Card Content with Semantic HTML */}
        <CardHeader className="pb-3 flex-none">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight line-clamp-2">
              {sanitizedVideo.title}
            </CardTitle>
            {sanitizedVideo.isRequired}
          </div>
          {sanitizedVideo.description && <CardDescription className="line-clamp-2">
              {sanitizedVideo.description}
            </CardDescription>}
        </CardHeader>

        <CardContent className="space-y-2 flex-1 pb-2">
          {/* Video Information with Enhanced Accessibility */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1" aria-label={`Duration: ${formatDuration(15)}`}>
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span>{sanitizedVideo.duration}</span>
              </div>
            </div>
            
            {/* Enhanced Circular Progress Indicator */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Progress</span>
              <div className="relative w-12 h-12" role="progressbar" aria-label={ariaLabels.progress} aria-valuenow={sanitizedVideo.progress} aria-valuemin={0} aria-valuemax={100}>
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                  <path className="text-muted/20" stroke="currentColor" strokeWidth="3" fill="transparent" d="M18 2.0845 A 15.9155 15.9155 0 0 1 18 33.9155 A 15.9155 15.9155 0 0 1 18 2.0845" />
                   <path className={`transition-all duration-300 ${sanitizedVideo.progress >= 100 ? 'text-green-500' : 'text-primary'}`} stroke="currentColor" strokeWidth="3" strokeDasharray={`${sanitizedVideo.progress}, 100`} strokeLinecap="round" fill="transparent" d="M18 2.0845 A 15.9155 15.9155 0 0 1 18 33.9155 A 15.9155 15.9155 0 0 1 18 2.0845" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {sanitizedVideo.progress >= 100 ? (
                    <CheckCircle className={`w-4 h-4 text-green-500`} aria-hidden="true" />
                  ) : (
                    <span className="text-xs font-medium text-primary" aria-hidden="true">
                      {sanitizedVideo.progress}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Enhanced Action Button */}
        <CardFooter className="flex-none">
          <Button className="w-full min-h-touch" variant={trainingStatus.isCompleted ? "secondary" : "default"} onClick={handlePlay} onKeyDown={handleCardKeyPress} aria-label={ariaLabels.actionButton}>
            {trainingStatus.isCompleted ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Review Training
              </>
            ) : trainingStatus.hasStarted ? (
              "Continue Training"
            ) : (
              "Start Training"
            )}
          </Button>
        </CardFooter>
      </Card>
    </article>;
});

// Set display name for debugging
TrainingCard.displayName = 'TrainingCard';