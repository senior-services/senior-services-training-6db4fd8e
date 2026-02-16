/**
 * Enhanced TrainingCard Component for the Senior Services Training Portal
 * Implements accessibility, security, and performance best practices
 * Provides comprehensive training video information with proper ARIA support
 */

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Calendar, Clock, Play, AlertCircle, ClipboardList, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDueDateStatus, dueDateStatusToVariant, formatShort, formatLong } from '@/utils/date-formatter';

// Enhanced utility imports
import { sanitizeText, createSafeDisplayName } from '@/utils/security';
import { getTrainingCardAriaLabel, getStatusAnnouncement, handleKeyPress, announceToScreenReader } from '@/utils/accessibility';
import { useOptimizedCallback, useOptimizedMemo } from '@/utils/performance';
import { isYouTubeUrl, isGoogleDriveUrl, getYouTubeVideoId, getGoogleDriveFileId } from '@/utils/videoUtils';
import { logger } from '@/utils/logger';

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
  completedAt?: string;
  status?: 'overdue' | 'warning' | 'upcoming' | 'completed';
  video_url?: string | null;
  thumbnail_url?: string | null;
  video_file_name?: string | null;
  quizPending?: boolean;
  quizSummary?: {
    correct: number;
    total: number;
    percent: number;
    completedAt?: string;
  };
  quizQuestionCount?: number;
  acknowledgmentViewingSeconds?: number;
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
  variant: 'success' | 'destructive' | 'warning' | 'secondary' | 'default' | 'tertiary'
    | 'soft-success' | 'soft-destructive' | 'soft-warning' | 'soft-secondary';
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
  // Sanitize basic fields
  const sanitizedVideo = useMemo(() => ({
    ...video,
    title: sanitizeText(video.title || 'Untitled Video'),
    description: sanitizeText(video.description || ''),
  }), [video]);

  // Build robust thumbnail candidate list with comprehensive fallbacks
  const thumbnailCandidates = useOptimizedMemo(() => {
    const sources: string[] = [];
    
    // Always try the database thumbnail_url first if it exists
    if (video.thumbnail_url) sources.push(video.thumbnail_url);
    if (video.thumbnail) sources.push(video.thumbnail);

    if (video.video_url) {
      const url = video.video_url;
      if (isYouTubeUrl(url)) {
        const id = getYouTubeVideoId(url);
        if (id) {
          // Comprehensive YouTube thumbnail fallback cascade
          sources.push(
            `https://img.youtube.com/vi/${id}/maxresdefault.jpg`, // 1280x720 - highest quality
            `https://img.youtube.com/vi/${id}/sddefault.jpg`,     // 640x480 - good quality  
            `https://img.youtube.com/vi/${id}/hqdefault.jpg`,     // 480x360 - standard quality
            `https://img.youtube.com/vi/${id}/mqdefault.jpg`,     // 320x180 - medium quality
            `https://img.youtube.com/vi/${id}/default.jpg`        // 120x90 - lowest quality (always available)
          );
        }
      } else if (isGoogleDriveUrl(url)) {
        const id = getGoogleDriveFileId(url);
        if (id) {
          sources.push(
            `https://drive.google.com/thumbnail?id=${id}&sz=w800-h600`,
            `https://drive.google.com/thumbnail?id=${id}&sz=w400-h300`,
            `https://lh3.googleusercontent.com/d/${id}=w800-h600`,
            `https://lh3.googleusercontent.com/d/${id}=w400-h300`
          );
        }
      }
    }

    // Always end with our local placeholder
    sources.push(videoPlaceholder);

    // Remove duplicates and falsy values  
    return Array.from(new Set(sources.filter(Boolean)));
  }, [video.thumbnail_url, video.thumbnail, video.video_url]);

  const [thumbIndex, setThumbIndex] = useState(0);

  // Calculate training status and progress
  const trainingStatus = useOptimizedMemo(() => {
    const isCompleted = sanitizedVideo.progress === 100;
    const hasStarted = sanitizedVideo.progress > 0
      || (sanitizedVideo.acknowledgmentViewingSeconds != null
          && sanitizedVideo.acknowledgmentViewingSeconds > 0);

    console.log('[Card Debug]', sanitizedVideo.title,
      'progress:', sanitizedVideo.progress,
      'viewingSec:', sanitizedVideo.acknowledgmentViewingSeconds,
      'hasStarted:', hasStarted,
      'buttonText:', isCompleted ? 'Review' : hasStarted ? 'Continue' : 'Start');

    return {
      isCompleted,
      hasStarted,
      statusText: isCompleted ? 'Completed' : hasStarted ? 'In Progress' : 'Not Started'
    };
  }, [sanitizedVideo.progress, sanitizedVideo.acknowledgmentViewingSeconds]);

  // Calculate due date status with centralized utility
  const dueDateInfo = useOptimizedMemo(() => {
    if (!sanitizedVideo.dueDate) return null;

    if (trainingStatus.isCompleted) {
      return {
        variant: 'soft-success' as const,
        className: '',
        text: 'Completed',
        ariaLabel: 'Training completed successfully',
        priority: 'high' as const
      };
    }

    const { text, status } = getDueDateStatus(sanitizedVideo.dueDate);
    const variant = dueDateStatusToVariant(status);
    const priority = (status === 'overdue' || status === 'today') ? 'high' as const
      : status === 'near' ? 'medium' as const : 'low' as const;
    const ariaLabel = status === 'overdue' ? 'Training is overdue'
      : status === 'today' ? 'Training is due today'
      : `Training is due on ${formatLong(sanitizedVideo.dueDate)}`;

    return { variant, className: '', text, ariaLabel, priority };
  }, [sanitizedVideo.dueDate, trainingStatus.isCompleted]);

  // Generate comprehensive ARIA labels
  const ariaLabels = useOptimizedMemo(() => ({
    card: getTrainingCardAriaLabel(sanitizedVideo.title, sanitizedVideo.progress, sanitizedVideo.isRequired || false, sanitizedVideo.dueDate),
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

  // Image error handler with progressive fallback across candidates
  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const currentSrc = (event.target as HTMLImageElement).src;
    logger.debug('Thumbnail failed to load, trying next fallback', {
      failedSrc: currentSrc,
      currentIndex: thumbIndex,
      totalCandidates: thumbnailCandidates.length
    });
    
    setThumbIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex < thumbnailCandidates.length) {
        logger.debug('Switching to fallback thumbnail', { 
          nextIndex, 
          nextSrc: thumbnailCandidates[nextIndex] 
        });
        return nextIndex;
      }
      // If we've exhausted all candidates, stay on the last one (placeholder)
      logger.warn('All thumbnail sources failed, using final placeholder', {
        videoId: sanitizedVideo.id,
        videoTitle: sanitizedVideo.title
      });
      return prev;
    });
  }, [thumbnailCandidates, thumbIndex, sanitizedVideo.id, sanitizedVideo.title]);
  return <article className={cn('training-card group relative overflow-hidden focus-within:ring-2 focus-within:ring-ring', className)} aria-label={ariaLabels.card} role="article">
      <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-card border-0">
        {/* Video Thumbnail with Enhanced Accessibility */}
        <header className="relative border-b border-border-primary">
          <button type="button" onClick={handlePlay} aria-label={ariaLabels.playButton} className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-t-lg w-full text-left overflow-hidden">
            <img 
              src={thumbnailCandidates[thumbIndex]} 
              alt={`${sanitizedVideo.title} - Training video thumbnail`} 
              className="w-full aspect-video object-cover bg-muted transition-transform duration-300 group-hover:scale-105 rounded-t-lg" 
              loading={priority ? "eager" : "lazy"}
              onError={handleImageError}
              onLoad={() => {
                logger.debug('Thumbnail loaded successfully', {
                  videoId: sanitizedVideo.id,
                  videoTitle: sanitizedVideo.title,
                  thumbnailSrc: thumbnailCandidates[thumbIndex],
                  fallbackIndex: thumbIndex
                });
              }}
              // Add crossOrigin to handle CORS issues with external thumbnails
              crossOrigin="anonymous"
            />
          </button>

          {/* Play Button Overlay with Enhanced Accessibility */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button size="icon" className="button-play-overlay button-size-play" onClick={handlePlay} onKeyDown={handleCardKeyPress} aria-label={ariaLabels.playButton}>
              <Play className="w-6 h-6 ml-1" aria-hidden="true" />
              <span className="sr-only">{ariaLabels.playButton}</span>
            </Button>
          </div>
        </header>

        {/* Card Content with Semantic HTML */}
        <CardHeader className="pb-3 pt-3 flex-none">
          {/* Status Badge Row - above title */}
          <TooltipProvider delayDuration={300}>
            {/* Completed trainings: [Completed <date>] [quiz score] */}
            {trainingStatus.isCompleted && (
              <div className="mb-1 flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Badge variant={dueDateInfo?.variant || "soft-success"} aria-label={dueDateInfo?.ariaLabel || "Training completed successfully"} role="status" showIcon>
                        {sanitizedVideo.completedAt
                          ? formatShort(sanitizedVideo.completedAt)
                          : 'Completed'}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  {sanitizedVideo.completedAt && (
                    <TooltipContent>
                      Completed: {formatLong(sanitizedVideo.completedAt)}
                    </TooltipContent>
                  )}
                </Tooltip>
                {sanitizedVideo.quizSummary && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Badge variant="soft-tertiary" showIcon>
                          {sanitizedVideo.quizSummary.percent}%
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Quiz Score: {sanitizedVideo.quizSummary.percent}% ({sanitizedVideo.quizSummary.correct}/{sanitizedVideo.quizSummary.total} Correct)
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Required trainings (not completed): [due date] [quiz question count] */}
            {!trainingStatus.isCompleted && dueDateInfo && (
              <div className="mb-1 flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Badge variant={dueDateInfo.variant} className={dueDateInfo.className || undefined} aria-label={dueDateInfo.ariaLabel} role="status" showIcon={dueDateInfo.priority === 'high'}>
                        {dueDateInfo.text}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  {sanitizedVideo.dueDate && (
                    <TooltipContent>
                      Due: {formatLong(sanitizedVideo.dueDate)}
                    </TooltipContent>
                  )}
                </Tooltip>
                {sanitizedVideo.quizQuestionCount != null && sanitizedVideo.quizQuestionCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Badge variant="soft-tertiary" showIcon>
                          {sanitizedVideo.quizQuestionCount}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Quiz: {sanitizedVideo.quizQuestionCount} Question{sanitizedVideo.quizQuestionCount !== 1 ? 's' : ''}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </TooltipProvider>

          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-h4 line-clamp-2">
              {sanitizedVideo.title}
            </CardTitle>
            {sanitizedVideo.isRequired}
          </div>
          {sanitizedVideo.description && <CardDescription className="line-clamp-2">
              {sanitizedVideo.description}
            </CardDescription>}
        </CardHeader>

        {/* Footer */}
        {trainingStatus.isCompleted ? (
          <CardFooter className="flex-none mt-auto">
            <Button variant="outline" className="w-full min-h-touch" onClick={handlePlay} onKeyDown={handleCardKeyPress} aria-label={ariaLabels.actionButton}>
              Review Training
            </Button>
          </CardFooter>
        ) : (
          <CardFooter className="flex-none mt-auto">
            <Button variant="outline" className="w-full min-h-touch" onClick={handlePlay} onKeyDown={handleCardKeyPress} aria-label={ariaLabels.actionButton}>
              {trainingStatus.hasStarted ? "Continue Training" : "Start Training"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </article>;
});

// Set display name for debugging
TrainingCard.displayName = 'TrainingCard';