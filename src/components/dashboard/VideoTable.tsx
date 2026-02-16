/**
 * Accessible video table component for admin dashboard
 * Provides comprehensive video management with keyboard navigation and screen reader support
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { Edit, Video as VideoIcon, Plus, Play, Settings, MessageSquare } from 'lucide-react';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { formatShort } from '@/utils/date-formatter';
import { isYouTubeUrl, getYouTubeVideoId, isGoogleDriveUrl, getGoogleDriveFileId } from '@/utils/videoUtils';
import { Video } from '@/types';
import { VIDEO_CONFIG } from '@/constants';
import { createButtonAriaProps, announceToScreenReader } from '@/utils/accessibility';
import { cn } from '@/lib/utils';
import { quizOperations } from '@/services/quizService';
import { logger } from '@/utils/logger';
import { IconButtonWithTooltip } from '../ui/icon-button-with-tooltip';
interface VideoTableProps {
  videos: Video[];
  loading?: boolean;
  onEdit: (video: Video) => void;
  onPlay: (video: Video) => void;
  onAddVideo: () => void;
  onSettings?: (video: Video) => void;
  className?: string;
}

/**
 * Generates consistent thumbnail color based on video title
 * @param title - Video title
 * @returns CSS class for background color
 */
const generateThumbnailColor = (title: string): string => {
  const colors = VIDEO_CONFIG.THUMBNAIL_COLORS;
  const hash = title.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return colors[hash % colors.length];
};

/**
 * Video table component with accessibility features
 */
export const VideoTable: React.FC<VideoTableProps> = ({
  videos,
  loading = false,
  onEdit,
  onPlay,
  onAddVideo,
  onSettings,
  className
}) => {
  const [sortColumn, setSortColumn] = useState<'title' | 'created_at'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [videoQuizzes, setVideoQuizzes] = useState<Map<string, { version: number; versionCount: number; questionCount: number }>>(new Map());

  // Load quiz version info for each video
  useEffect(() => {
    const loadVideoQuizzes = async () => {
      if (!videos.length) return;
      const quizMap = new Map<string, { version: number; versionCount: number; questionCount: number }>();
      try {
        await Promise.all(videos.map(async video => {
          try {
            const info = await quizOperations.getQuizVersionInfo(video.id);
            if (info.hasQuiz) {
              quizMap.set(video.id, { version: info.version, versionCount: info.versionCount, questionCount: info.questionCount ?? 0 });
            }
          } catch (error) {
            logger.debug(`Error checking quiz for video ${video.id}`, error);
          }
        }));
        setVideoQuizzes(quizMap);
      } catch (error) {
        logger.error('Error loading video quiz info', error);
      }
    };
    loadVideoQuizzes();
  }, [videos]);

  /**
   * Sorts videos based on current sort criteria
   */
  const sortedVideos = React.useMemo(() => {
    if (!videos.length) return videos;
    return [...videos].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [videos, sortColumn, sortDirection]);

  /**
   * Handles sorting of video table
   */
  const handleSort = useCallback((column: 'title' | 'created_at') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    announceToScreenReader(`Videos sorted by ${column} in ${sortDirection === 'asc' ? 'descending' : 'ascending'} order`);
  }, [sortColumn, sortDirection]);

  /**
   * Handles video actions with accessibility announcements
   */
  const handleVideoAction = useCallback((action: string, video: any, callback: () => void) => {
    announceToScreenReader(`${action}: ${video.title}`);
    callback();
  }, []);
  return <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Training Videos &amp; Presentations</h3>
          <p className="text-muted-foreground">
            Manage your training content and track engagement
          </p>
        </div>
        
        <Button onClick={onAddVideo} {...createButtonAriaProps('Add new training')}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Add Training
        </Button>
      </div>

      {/* Video table */}
      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table aria-label="Training videos management table">
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    column="title"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    className="whitespace-nowrap w-full"
                  >
                    Training
                  </SortableTableHead>
                  <TableHead className="whitespace-nowrap">Quiz</TableHead>
                  <SortableTableHead
                    column="created_at"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    className="text-left whitespace-nowrap"
                  >
                    Date Added
                  </SortableTableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow>
                    <TableCell colSpan={4} className="py-12">
                      <div className="space-y-4">
                        <LoadingSkeleton lines={1} className="h-16" />
                        <LoadingSkeleton lines={1} className="h-16" />
                        <LoadingSkeleton lines={1} className="h-16" />
                      </div>
                    </TableCell>
                  </TableRow> : videos.length === 0 ? <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="space-y-3">
                    <VideoIcon className="w-12 h-12 text-muted-foreground mx-auto" aria-hidden="true" />
                        <div>
                          <h4 className="font-medium text-foreground">
                            No videos found
                          </h4>
                          <p className="text-body-sm text-muted-foreground">
                            Add your first video to get started with training content.
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={onAddVideo} aria-label="Add your first training">
                          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                          Add First Training
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow> : sortedVideos.map((video, index) => <TableRow key={video.id} className="group">
                       {/* Video title and preview */}
                      <TableCell className="py-2 w-full">
                        <div className="flex items-center gap-3">
                          {/* Video preview */}
                          <div className="relative w-20 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                            {(() => {
                        // Determine best thumbnail source
                        let thumbSrc: string | null = null;
                        if (video.thumbnail_url) {
                          thumbSrc = video.thumbnail_url;
                        } else if (video.video_url) {
                          if (isYouTubeUrl(video.video_url)) {
                            const id = getYouTubeVideoId(video.video_url);
                            if (id) thumbSrc = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
                          } else if (isGoogleDriveUrl(video.video_url)) {
                            const id = getGoogleDriveFileId(video.video_url);
                            if (id) thumbSrc = `https://drive.google.com/thumbnail?id=${id}&sz=w400-h300`;
                          }
                        }
                        if (thumbSrc) {
                          return <img src={thumbSrc} alt={`${video.title} thumbnail`} className="w-full h-full object-cover" loading="lazy" onError={e => {
                            // Fallback to colored placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.classList.remove('hidden');
                          }} />;
                        }
                        return null;
                      })()}
                            <div className={cn('absolute inset-0 flex items-center justify-center', generateThumbnailColor(video.title), video.video_url || video.thumbnail_url ? 'hidden' : '')}>
                              <Play className="w-4 h-4 text-white" aria-hidden="true" />
                            </div>
                            <a href="#" onClick={e => {
                        e.preventDefault();
                        handleVideoAction('Play video', video, () => onPlay(video));
                      }} aria-label={`Play video: ${video.title}`} className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group">
                              <Play className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          </div>
                          
                          {/* Video info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground" title={video.title}>
                                {video.title}
                              </p>
                            </div>
                            {video.description && <p className="text-body text-muted-foreground line-clamp-2 mt-1" title={video.description}>
                                {video.description.length > 150 ? `${video.description.substring(0, 150)}...` : video.description}
                              </p>}
                          </div>
                        </div>
                      </TableCell>

                      {/* Quiz status */}
                      <TableCell className="text-left py-2">
                        {videoQuizzes.has(video.id) && (() => {
                          const quizInfo = videoQuizzes.get(video.id)!;
                          return (
                            <div className="flex items-center justify-start gap-1.5">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                              <span className="text-body text-foreground" aria-label={`Quiz: ${quizInfo.questionCount} questions`}>
                                {quizInfo.questionCount}
                              </span>
                              {quizInfo.versionCount > 1 && (
                                <Badge variant="soft-tertiary" aria-label={`Quiz version ${quizInfo.version}`}>
                                  v{quizInfo.version}
                                </Badge>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>

                      {/* Date Added */}
                      <TableCell className="text-left py-2">
                        <span className="text-body text-foreground">
                          {formatShort(video.created_at)}
                        </span>
                      </TableCell>

                      {/* Action buttons */}
                      <TableCell className="text-right py-2 w-auto shrink-0">
                        <div className="flex gap-2 justify-end" role="group" aria-label={`Actions for video: ${video.title}`}>
                          <Button variant="outline" size="sm" onClick={() => handleVideoAction('Edit video', video, () => onEdit(video))} aria-label={`Edit ${video.title}`}>
                            <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
                            Edit
                          </Button>
                          {onSettings && <IconButtonWithTooltip icon={Settings} tooltip="Training settings" onClick={() => handleVideoAction('Open settings', video, () => onSettings(video))} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" ariaLabel={`Settings for ${video.title}`} />}
                        </div>
                      </TableCell>
                    </TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Video count summary for screen readers */}
      <div className="sr-only" aria-live="polite">
        {videos.length === 0 ? 'No training videos available' : `${videos.length} training video${videos.length === 1 ? '' : 's'} available`}
      </div>
    </div>;
};