import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Presentation } from 'lucide-react';
import { TrainingContent } from '@/types';
import { getGooglePresentationEmbedUrl } from '@/utils/videoUtils';

interface PresentationViewerProps {
  content: TrainingContent;
  onProgressUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({
  content,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasError, setHasError] = useState(false);

  const embedUrl = content.video_url ? getGooglePresentationEmbedUrl(content.video_url) : null;

  const handleIframeError = () => {
    setHasError(true);
  };

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <div className="text-center">
          <Presentation className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Unable to load presentation</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <div className="text-center">
          <Presentation className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Failed to load presentation</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.open(content.video_url, '_blank')}
          >
            Open in Google Slides
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full"
        frameBorder="0"
        allowFullScreen
        onError={handleIframeError}
        title={`Presentation: ${content.title}`}
        aria-label={`Presentation viewer for ${content.title}`}
      />
    </div>
  );
};