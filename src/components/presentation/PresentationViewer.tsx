import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Presentation } from 'lucide-react';
import { TrainingContent } from '@/types';
import { getGooglePresentationEmbedUrl, isGoogleDriveUrl, isGooglePresentationUrl, isUrlFromTrustedDomain } from '@/utils/videoUtils';
import { PRESENTATION_CONFIG } from '@/constants/presentation-config';
import { logger } from '@/utils/logger';

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
  const [isLoading, setIsLoading] = useState(true);

  const embedUrl = content.video_url ? getGooglePresentationEmbedUrl(content.video_url) : null;
  const urlType = content.video_url 
    ? isGooglePresentationUrl(content.video_url) 
      ? 'slides' 
      : isGoogleDriveUrl(content.video_url) 
        ? 'drive' 
        : 'unknown'
    : 'unknown';

  // Validate URL is from trusted domain
  const isUrlTrusted = embedUrl ? isUrlFromTrustedDomain(embedUrl) : false;
  
  // Log presentation load attempt
  React.useEffect(() => {
    if (embedUrl && isUrlTrusted) {
      logger.info('Loading presentation', { 
        contentId: content.id,
        contentTitle: content.title,
        urlType,
        embedUrl: embedUrl.substring(0, 100)
      });
    }
  }, [embedUrl, isUrlTrusted, content.id, content.title, urlType]);

  const handleIframeError = () => {
    logger.error('Presentation iframe failed to load', undefined, { 
      contentId: content.id,
      contentTitle: content.title,
      urlType,
      embedUrl: embedUrl?.substring(0, 100)
    });
    setHasError(true);
    setIsLoading(false);
  };

  const handleIframeLoad = () => {
    logger.info('Presentation loaded successfully', { 
      contentId: content.id,
      urlType
    });
    setIsLoading(false);
  };

  if (!embedUrl || !isUrlTrusted) {
    const errorMessage = !embedUrl 
      ? PRESENTATION_CONFIG.ERROR_MESSAGES.INVALID_URL
      : PRESENTATION_CONFIG.ERROR_MESSAGES.UNTRUSTED_DOMAIN;
    
    logger.warn('Presentation cannot be embedded', { 
      contentId: content.id,
      reason: !embedUrl ? 'invalid_url' : 'untrusted_domain',
      originalUrl: content.video_url?.substring(0, 100)
    });
    
    return (
      <div 
        className="flex items-center justify-center h-64 bg-muted rounded-lg"
        role="alert"
        aria-live="polite"
      >
        <div className="text-center">
          <Presentation className="h-12 w-12 mx-auto text-muted-foreground mb-2" aria-hidden="true" />
          <p className="text-muted-foreground" id="presentation-error">
            Unable to load presentation
          </p>
          <p className="text-body-sm text-muted-foreground mt-1">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    const buttonText = urlType === 'drive' ? 'Open in Google Drive' : 'Open in Google Slides';
    
    return (
      <div 
        className="flex items-center justify-center h-64 bg-muted rounded-lg"
        role="alert"
        aria-live="polite"
      >
        <div className="text-center">
          <Presentation className="h-12 w-12 mx-auto text-muted-foreground mb-2" aria-hidden="true" />
          <p className="text-muted-foreground" id="presentation-load-error">
            {PRESENTATION_CONFIG.ERROR_MESSAGES.LOAD_FAILED}
          </p>
          <p className="text-body-sm text-muted-foreground mt-1">
            {PRESENTATION_CONFIG.ERROR_MESSAGES.PERMISSION_REQUIRED}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={() => window.open(content.video_url, '_blank')}
            aria-describedby="presentation-load-error"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="flex flex-col items-center gap-2">
            <Presentation className="h-8 w-8 text-muted-foreground animate-pulse" aria-hidden="true" />
            <p className="text-body-sm text-muted-foreground">Loading presentation...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full"
        frameBorder="0"
        allowFullScreen
        sandbox={PRESENTATION_CONFIG.SANDBOX_PERMISSIONS}
        onError={handleIframeError}
        onLoad={handleIframeLoad}
        title={`Presentation: ${content.title}`}
        aria-label={`${urlType === 'slides' ? 'Google Slides' : 'Google Drive'} presentation viewer for ${content.title}`}
      />
    </div>
  );
};