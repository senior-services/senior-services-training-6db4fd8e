/**
 * Video utility functions for handling different video platforms
 */

import { PRESENTATION_CONFIG } from '@/constants/presentation-config';
import { logger } from './logger';

/**
 * Validates if a URL is from a trusted domain for embedding
 */
export const isUrlFromTrustedDomain = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    const isTrusted = PRESENTATION_CONFIG.TRUSTED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
    
    if (!isTrusted) {
      logger.warn('Untrusted domain detected', { 
        hostname, 
        url: url.substring(0, 100),
        trustedDomains: PRESENTATION_CONFIG.TRUSTED_DOMAINS 
      });
    }
    
    return isTrusted;
  } catch (error) {
    logger.error('Invalid URL format', error instanceof Error ? error : undefined, { 
      url: url.substring(0, 100) 
    });
    return false;
  }
};

/**
 * Extracts Google Drive file ID from various Google Drive URL formats
 */
export const getGoogleDriveFileId = (url: string): string | null => {
  // Handle different Google Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)\//, // https://drive.google.com/file/d/FILE_ID/view
    /id=([a-zA-Z0-9-_]+)/, // https://drive.google.com/open?id=FILE_ID
    /\/d\/([a-zA-Z0-9-_]+)/, // Shortened format
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Converts Google Drive URL to embed format
 */
export const getGoogleDriveEmbedUrl = (url: string): string | null => {
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return null;
  
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

/**
 * Converts Google Drive URL to standard view URL
 */
export const getGoogleDriveViewUrl = (url: string): string | null => {
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return null;
  return `https://drive.google.com/file/d/${fileId}/view`;
};

/**
 * Gets Google Drive thumbnail URL
 */
export const getGoogleDriveThumbnail = (url: string): string | null => {
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return null;
  
  // Google Drive thumbnail API - this might not always work due to permissions
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h300`;
};

/**
 * Checks if URL is a Google Drive file URL
 * Note: Cannot determine file type (video/presentation/PDF/etc.) without API access
 */
export const isGoogleDriveUrl = (url: string): boolean => {
  return url.includes('drive.google.com') && getGoogleDriveFileId(url) !== null;
};

/**
 * Checks if URL is a YouTube video
 */
export const isYouTubeUrl = (url: string): boolean => {
  try {
    const u = new URL(url);
    return u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be') || u.hostname.includes('m.youtube.com');
  } catch {
    return /youtube\.com|youtu\.be/.test(url);
  }
};

/**
 * Extracts YouTube video ID
 */
export const getYouTubeVideoId = (url: string): string | null => {
  try {
    const u = new URL(url);

    // youtu.be short links
    if (u.hostname.includes('youtu.be')) {
      const seg = u.pathname.split('/').filter(Boolean)[0];
      return seg || null;
    }

    // Standard watch URL with v param
    const v = u.searchParams.get('v');
    if (v) return v;

    // Handle embed, shorts, live paths
    const p = u.pathname || '';
    const pathMatchers = [/^\/embed\/([^/?#]+)/i, /^\/shorts\/([^/?#]+)/i, /^\/live\/([^/?#]+)/i];
    for (const rx of pathMatchers) {
      const m = p.match(rx);
      if (m && m[1]) return m[1];
    }
  } catch {}

  // Fallback regexes
  const fallback = url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([^&\n?#/]+)/i);
  return fallback ? fallback[1] : null;
};

/**
 * Gets YouTube thumbnail URL
 */
export const getYouTubeThumbnail = (url: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

/**
 * Normalizes any YouTube URL to a standard watch URL
 */
export const getYouTubeWatchUrl = (url: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
};

/**
 * Checks if URL is a Google Presentation
 */
export const isGooglePresentationUrl = (url: string): boolean => {
  return /docs\.google\.com\/presentation/.test(url);
};

/**
 * Extracts Google Presentation ID from URL
 */
export const getGooglePresentationId = (url: string): string | null => {
  const match = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

/**
 * Converts Google Presentation URL to embed format
 * Also handles Google Drive file URLs as fallback
 */
export const getGooglePresentationEmbedUrl = (url: string): string | null => {
  // First, try Google Slides URL
  const presentationId = getGooglePresentationId(url);
  if (presentationId) {
    return `https://docs.google.com/presentation/d/${presentationId}/embed`;
  }
  
  // Fallback: Check if it's a Google Drive file URL
  if (isGoogleDriveUrl(url)) {
    return getGoogleDriveEmbedUrl(url);
  }
  
  return null;
};

/**
 * Gets Google Presentation thumbnail URL
 */
export const getGooglePresentationThumbnail = (url: string): string | null => {
  const presentationId = getGooglePresentationId(url);
  if (!presentationId) return null;
  
  return `https://docs.google.com/presentation/d/${presentationId}/preview`;
};

/**
 * Detects content type from URL
 * @returns 'video' | 'presentation' if detectable, null if ambiguous (requires manual selection)
 * 
 * Detection priority:
 * 1. Google Slides URLs (docs.google.com/presentation) → 'presentation'
 * 2. YouTube URLs (youtube.com, youtu.be) → 'video'
 * 3. Generic Google Drive URLs (drive.google.com) → null (ambiguous, file type unknown)
 */
export const detectContentTypeFromUrl = (url: string): 'video' | 'presentation' | null => {
  // Check Google Slides FIRST (before generic Drive URLs)
  if (isGooglePresentationUrl(url)) {
    return 'presentation';
  }
  
  // Check YouTube
  if (isYouTubeUrl(url)) {
    return 'video';
  }
  
  // Generic Google Drive URLs are ambiguous - we cannot determine file type
  // without API access. Return null to force manual selection.
  if (isGoogleDriveUrl(url)) {
    return null;
  }

  // Check if URL path ends in .ppsx (PowerPoint slideshow)
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.endsWith('.ppsx')) {
      return 'presentation';
    }
  } catch {
    // Invalid URL, fall through
  }
  
  return null;
};

/**
 * Detects content type from file
 */
export const detectContentTypeFromFile = (file: File): 'video' | 'presentation' | null => {
  const videoMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  const presentationMimes = [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow'
  ];
  
  if (videoMimes.includes(file.type)) {
    return 'video';
  }
  if (presentationMimes.includes(file.type)) {
    return 'presentation';
  }
  return null;
};