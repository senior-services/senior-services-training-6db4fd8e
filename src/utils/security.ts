/**
 * Security utilities for the Senior Services Training Portal
 * Provides XSS protection, input sanitization, and secure data handling
 */

/**
 * Sanitizes text input to prevent XSS attacks
 * Escapes HTML characters and removes potentially dangerous content
 */
export const sanitizeText = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates email format with comprehensive regex
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * Validates URL format and ensures safe protocols
 */
export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitizes and validates video URLs (YouTube, Google Drive, direct links)
 * Ensures only safe video sources are allowed
 */
export const sanitizeVideoUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  const trimmedUrl = url.trim();
  
  // Allow YouTube URLs
  if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
    return validateUrl(trimmedUrl) ? trimmedUrl : null;
  }
  
  // Allow Google Drive URLs
  if (trimmedUrl.includes('drive.google.com')) {
    return validateUrl(trimmedUrl) ? trimmedUrl : null;
  }
  
  // Allow other HTTPS URLs (for direct video files)
  if (trimmedUrl.startsWith('https://')) {
    return validateUrl(trimmedUrl) ? trimmedUrl : null;
  }
  
  return null;
};

/**
 * Sanitizes user input for search/filter functionality
 * Prevents SQL injection-like attacks in client-side filtering
 */
/**
 * Sanitizes user input for database storage - trims and length-limits only.
 * Does NOT HTML-encode; React's JSX handles XSS prevention natively.
 */
export const sanitizeInput = (input: string, maxLength = 200): string => {
  if (!input || typeof input !== 'string') return '';
  return input.trim().substring(0, maxLength);
};

export const sanitizeSearchInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .substring(0, 100); // Limit length to prevent abuse
};

/**
 * Validates user role to ensure only valid roles are processed
 */
export const validateUserRole = (role: string): 'admin' | 'employee' | null => {
  if (role === 'admin' || role === 'employee') {
    return role;
  }
  return null;
};

/**
 * Creates a secure, user-friendly display name from potentially unsafe input
 */
export const createSafeDisplayName = (fullName: string, email: string): string => {
  if (fullName && typeof fullName === 'string') {
    const trimmed = fullName.trim();
    if (trimmed.length > 0 && trimmed.length <= 50) {
      return trimmed;
    }
  }
  
  // Fallback to email prefix if name is invalid
  if (email && typeof email === 'string') {
    const emailPrefix = email.split('@')[0];
    return emailPrefix.substring(0, 20);
  }
  
  return 'User';
};