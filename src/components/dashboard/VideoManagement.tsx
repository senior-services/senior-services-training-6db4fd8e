/**
 * Video Management Component - Handles all video-related operations
 * Extracted from AdminDashboard for better separation of concerns
 */

import React, { useState, useEffect } from 'react';
import { VideoTable } from './VideoTable';
import { AddVideoModal, VideoFormData } from '../AddVideoModal';
import { EditVideoModal } from '../EditVideoModal';
import { VideoPlayerModal } from '../VideoPlayerModal';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { videoOperations } from '@/services/api';
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
  const [loading, setLoading] = useState(true);
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [isEditVideoModalOpen, setIsEditVideoModalOpen] = useState(false);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const { toast } = useToast();
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // Load videos on mount
  useEffect(() => {
    loadVideos();
  }, []);

  /**
   * Loads videos using the unified API service
   */
  const loadVideos = async () => {
    setLoading(true);
    const result = await videoOperations.getAll();
    
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
      toast({
        title: 'Error loading videos',
        description: result.error || 'Failed to load videos',
        variant: 'destructive'
      });
    }
    
    setLoading(false);
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
      type: 'Optional' as const,
      file: videoData.file
    };

    const result = await videoOperations.create(sanitizedData);
    
    if (result.success) {
      toast({
        title: 'Video Added Successfully',
        description: `"${sanitizedData.title}" has been added to the training library.`
      });
      await loadVideos();
      setIsAddVideoModalOpen(false);
    } else {
      toast({
        title: 'Error Adding Video',
        description: result.error || 'Failed to add video',
        variant: 'destructive'
      });
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
      toast({
        title: 'Video Updated Successfully',
        description: 'Video details have been updated.'
      });
      await loadVideos();
      setIsEditVideoModalOpen(false);
      setEditingVideo(null);
    } else {
      toast({
        title: 'Error Updating Video',
        description: result.error || 'Failed to update video',
        variant: 'destructive'
      });
    }

    performanceTracker.end(operation);
  };

  /**
   * Handles video deletion - separate handler for the EditVideoModal
   */
  const handleDeleteVideo = async (videoId: string) => {
    const result = await videoOperations.delete(videoId);
    
    if (result.success) {
      toast({
        title: 'Video Deleted Successfully',
        description: 'Video has been removed from the library.'
      });
      await loadVideos();
      setIsEditVideoModalOpen(false);
      setEditingVideo(null);
    } else {
      toast({
        title: 'Error Deleting Video',
        description: result.error || 'Failed to delete video',
        variant: 'destructive'
      });
    }
  };

  /**
   * Handles video deletion from table - calls the existing delete handler
   */
  const handleDeleteVideoFromTable = async (video: Video) => {
    await handleDeleteVideo(video.id);
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

  return (
    <div className="space-y-6">
      <VideoTable
        videos={videos}
        loading={loading}
        onEdit={handleEditVideo}
        onPlay={handlePlayVideo}
        onDelete={handleDeleteVideoFromTable}
        onAddVideo={() => setIsAddVideoModalOpen(true)}
      />

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