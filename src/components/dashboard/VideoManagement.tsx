/**
 * Video Management Component - Handles all video-related operations
 * Extracted from AdminDashboard for better separation of concerns
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Archive, ChevronDown, RotateCcw } from 'lucide-react';
import { VideoTable } from './VideoTable';
import { AddVideoModal, VideoFormData } from '../AddVideoModal';
import { EditVideoModal } from '../EditVideoModal';
import { VideoPlayerModal } from '../VideoPlayerModal';
import { IconButtonWithTooltip } from '../ui/icon-button-with-tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { videoOperations } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import { logger, performanceTracker } from '@/utils/logger';
import { sanitizeText } from '@/utils/security';
import type { Video } from '@/types';

interface VideoManagementProps {
  userEmail: string;
  onVideoCountChange?: (count: number) => void;
}

export const VideoManagement: React.FC<VideoManagementProps> = ({
  userEmail,
  onVideoCountChange
}) => {
  // State management
  const [videos, setVideos] = useState<Video[]>([]);
  const [archivedVideos, setArchivedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [isEditVideoModalOpen, setIsEditVideoModalOpen] = useState(false);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // Load videos on mount
  useEffect(() => {
    loadVideos();
    loadArchivedVideos();
  }, []);

  /**
   * Loads videos using the unified API service
   */
  const loadVideos = async () => {
    setLoading(true);
    
    try {
      // Check authentication status first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please log in to view videos');
        setLoading(false);
        return;
      }
      
      const result = await videoOperations.getAll(false); // Only get non-archived videos
      
      if (result.success && result.data) {
        setVideos(result.data);
        onVideoCountChange?.(result.data.length);
        logger.info('Videos loaded successfully', { 
          count: result.data.length,
          adminUser: userEmail 
        });
      } else {
        logger.error('Failed to load videos', undefined, { 
          error: result.error,
          adminUser: userEmail 
        });
        toast.error(result.error || 'Failed to load videos');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred while loading videos');
    }
    
    setLoading(false);
  };

  /**
   * Loads archived videos
   */
  const loadArchivedVideos = async () => {
    try {
      const result = await videoOperations.getArchived();
      
      if (result.success && result.data) {
        setArchivedVideos(result.data);
      } else {
        logger.error('Failed to load archived videos', undefined, { 
          error: result.error,
          adminUser: userEmail 
        });
      }
    } catch (error) {
      logger.error('Error loading archived videos', error as Error);
    }
  };

  /**
   * Handles adding a new video
   */
  const handleAddVideo = async (videoData: VideoFormData) => {
    const operation = 'addVideo';
    performanceTracker.start(operation);

    // Sanitize input data
    const sanitizedData = {
      title: sanitizeText(videoData.title || 'Untitled Video'),
      description: videoData.description ? sanitizeText(videoData.description) : null,
      video_url: videoData.url?.trim() || null,
      video_file_name: null,
      type: 'Required' as const,
      file: videoData.file
    };

    const result = await videoOperations.create(sanitizedData);
    
    if (result.success) {
      toast.success(`"${sanitizedData.title}" has been added to the training library.`);
      await loadVideos();
      setIsAddVideoModalOpen(false);
    } else {
      toast.error(result.error || 'Failed to add video');
    }

    performanceTracker.end(operation);
  };

  /**
   * Handles editing a video
   */
  const handleEditVideo = (video: Video) => {
    logger.videoEvent('edit_started', video.id, {
      title: video.title,
      adminUser: userEmail
    });
    
    setEditingVideo(video);
    setIsEditVideoModalOpen(true);
  };

  /**
   * Handles updating video details
   */
  const handleUpdateVideo = async (
    videoId: string,
    updates: { title: string; description: string }
  ) => {
    const operation = 'updateVideo';
    performanceTracker.start(operation);

    const sanitizedUpdates = {
      title: sanitizeText(updates.title),
      description: updates.description ? sanitizeText(updates.description) : null
    };

    const result = await videoOperations.update(videoId, sanitizedUpdates);
    
    if (result.success) {
      toast.success('Video details have been updated.');
      await loadVideos();
      setIsEditVideoModalOpen(false);
      setEditingVideo(null);
    } else {
      toast.error(result.error || 'Failed to update video');
    }

    performanceTracker.end(operation);
  };

  /**
   * Handles video deletion - separate handler for the EditVideoModal
   */
  const handleDeleteVideo = async (videoId: string) => {
    const result = await videoOperations.delete(videoId);
    
    if (result.success) {
      toast.success('Video has been removed from the library.');
      await loadVideos();
      setIsEditVideoModalOpen(false);
      setEditingVideo(null);
    } else {
      toast.error(result.error || 'Failed to delete video');
    }
  };

  /**
   * Handles quiz being saved
   */
  const handleQuizSaved = async (videoId: string) => {
    await loadVideos();
  };

  /**
   * Handles playing a video
   */
  const handlePlayVideo = (video: Video) => {
    logger.videoEvent('play_started', video.id, {
      title: video.title,
      adminUser: userEmail
    });
    
    setSelectedVideo(video);
    setIsVideoPlayerOpen(true);
  };

  /**
   * Handles archiving a video
   */
  const handleArchiveVideo = async (video: Video) => {
    const result = await videoOperations.archive(video.id);
    
    if (result.success) {
      toast.success(`"${video.title}" has been archived`);
      await loadVideos();
      await loadArchivedVideos();
    } else {
      toast.error(result.error || 'Failed to archive video');
    }
  };

  /**
   * Handles unarchiving a video
   */
  const handleUnarchiveVideo = async (video: Video) => {
    const result = await videoOperations.unarchive(video.id);
    
    if (result.success) {
      toast.success(`"${video.title}" has been unarchived`);
      await loadVideos();
      await loadArchivedVideos();
    } else {
      toast.error(result.error || 'Failed to unarchive video');
    }
  };

  /**
   * Generates thumbnail color for video placeholders
   */
  const generateThumbnailColor = (title: string): string => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-red-500'
    ];
    const index = title.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6">
      <VideoTable
        videos={videos}
        loading={loading}
        onEdit={handleEditVideo}
        onPlay={handlePlayVideo}
        onAddVideo={() => setIsAddVideoModalOpen(true)}
        onArchive={handleArchiveVideo}
      />

      {/* Archive Section */}
      {archivedVideos.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="archived" className="border-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 [&>svg]:hidden">
              <div className="flex items-center gap-3 w-full">
                <ChevronDown className="w-8 h-8 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                <Archive className="w-5 h-5 text-muted-foreground" />
                <span className="text-lg font-semibold">Archived Videos</span>
                <Badge variant="soft-destructive" className="ml-2">
                  {archivedVideos.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <Card className="shadow-md">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Thumbnail</TableHead>
                          <TableHead>Title & Description</TableHead>
                          <TableHead className="w-32 text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archivedVideos.map((video) => (
                          <TableRow key={video.id}>
                            <TableCell>
                              <div className="flex items-center justify-center">
                                {video.thumbnail_url ? (
                                  <img
                                    src={video.thumbnail_url}
                                    alt={`${video.title} thumbnail`}
                                    className="w-12 h-8 object-cover rounded border"
                                  />
                                ) : (
                                  <div className={`w-12 h-8 rounded border flex items-center justify-center text-white text-xs font-bold ${generateThumbnailColor(video.title)}`}>
                                    {video.title.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">{video.title}</div>
                                {video.description && (
                                  <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {video.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center">
                                <IconButtonWithTooltip
                                  icon={RotateCcw}
                                  tooltip="Unarchive video"
                                  onClick={() => handleUnarchiveVideo(video)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-foreground"
                                  ariaLabel={`Unarchive ${video.title}`}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Add Video Modal */}
      <AddVideoModal
        open={isAddVideoModalOpen}
        onOpenChange={setIsAddVideoModalOpen}
        onSave={handleAddVideo}
      />

      {/* Edit Video Modal */}
      <EditVideoModal
        open={isEditVideoModalOpen}
        onOpenChange={setIsEditVideoModalOpen}
        video={editingVideo}
        onSave={handleUpdateVideo}
        onDelete={handleDeleteVideo}
        onQuizSaved={handleQuizSaved}
      />

      {/* Video Player Modal */}
      <VideoPlayerModal
        open={isVideoPlayerOpen}
        onOpenChange={setIsVideoPlayerOpen}
        video={selectedVideo}
      />
    </div>
  );
};