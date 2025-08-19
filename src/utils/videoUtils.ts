/**
 * Video utility functions for handling different video platforms
 */

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
 * Gets Google Drive thumbnail URL
 */
export const getGoogleDriveThumbnail = (url: string): string | null => {
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return null;
  
  // Google Drive thumbnail API - this might not always work due to permissions
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h300`;
};

/**
 * Checks if URL is a Google Drive video
 */
export const isGoogleDriveUrl = (url: string): boolean => {
  return url.includes('drive.google.com') && getGoogleDriveFileId(url) !== null;
};

/**
 * Checks if URL is a YouTube video
 */
export const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com/watch') || url.includes('youtu.be/');
};

/**
 * Extracts YouTube video ID
 */
export const getYouTubeVideoId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
};

/**
 * Gets YouTube thumbnail URL
 */
export const getYouTubeThumbnail = (url: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};