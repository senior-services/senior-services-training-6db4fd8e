/**
 * Configuration for presentation viewer security and parameters
 */

export const PRESENTATION_CONFIG = {
  /**
   * Trusted domains for embedding presentations
   * Only URLs from these domains will be allowed to embed
   */
  TRUSTED_DOMAINS: [
    'docs.google.com',
    'drive.google.com',
  ],

  /**
   * Iframe sandbox permissions
   * Minimal set of permissions required for presentation viewing
   */
  SANDBOX_PERMISSIONS: 'allow-scripts allow-same-origin allow-presentation',

  /**
   * Error messages for different failure scenarios
   */
  ERROR_MESSAGES: {
    INVALID_URL: 'The presentation URL format is not supported',
    UNTRUSTED_DOMAIN: 'This presentation is from an untrusted source',
    LOAD_FAILED: 'Failed to load presentation',
    PERMISSION_REQUIRED: 'The presentation may be private or require permissions',
  },
} as const;
