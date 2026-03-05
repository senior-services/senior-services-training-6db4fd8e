import React from 'react';
import { TrainingContent } from '@/types';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { PresentationViewer } from '@/components/presentation/PresentationViewer';

interface ContentPlayerProps {
  content: TrainingContent;
  onProgressUpdate?: (progress: number) => void;
  onComplete?: () => void;
  loading?: boolean;
  progress?: number;
  furthestWatchedSeconds?: number;
  onFurthestUpdate?: (seconds: number) => void;
  initialSeekSeconds?: number;
  onLastPositionUpdate?: (seconds: number) => void;
}

export const ContentPlayer: React.FC<ContentPlayerProps> = ({
  content,
  onProgressUpdate,
  onComplete,
  loading = false,
  progress = 0,
  furthestWatchedSeconds = 0,
  onFurthestUpdate,
  initialSeekSeconds = 0,
  onLastPositionUpdate,
}) => {
  // Default to video if content_type is not specified (backward compatibility)
  const contentType = content.content_type || 'video';

  if (contentType === 'presentation') {
    return (
      <PresentationViewer
        content={content}
        onProgressUpdate={onProgressUpdate}
        onComplete={onComplete}
      />
    );
  }

  // Create video-compatible object for VideoPlayer
  const videoForPlayer = {
    ...content,
    completion_rate: content.completion_rate || 0,
    created_at: content.created_at || new Date().toISOString(),
    updated_at: content.updated_at || new Date().toISOString(),
    archived_at: content.archived_at || null,
    duration_seconds: content.duration_seconds || 0
  };

  return (
    <VideoPlayer
      video={videoForPlayer}
      loading={loading}
      progress={progress}
      onProgressUpdate={onProgressUpdate || (() => {})}
      onVideoEnded={onComplete || (() => {})}
      furthestWatchedSeconds={furthestWatchedSeconds}
      onFurthestUpdate={onFurthestUpdate}
      initialSeekSeconds={initialSeekSeconds}
      onLastPositionUpdate={onLastPositionUpdate}
    />
  );
};
