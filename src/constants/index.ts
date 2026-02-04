/**
 * Application constants for the Senior Services Training Portal
 * Centralized configuration values for maintainability
 */

// Application metadata
export const APP_CONFIG = {
  name: 'Senior Services Training Portal',
  version: '1.0.0',
  description: 'Training management system for Senior Services for South Sound',
  supportEmail: 'support@southsoundseniors.org',
} as const;

// User roles and permissions
export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
} as const;

// Assignment status display labels
export const STATUS_LABELS = {
  pending: 'To-do',
  overdue: 'Overdue',
  completed: 'Completed',
  unassigned: 'Unassigned',
} as const;

export const PERMISSIONS = {
  VIDEO_CREATE: 'video:create',
  VIDEO_READ: 'video:read',
  VIDEO_UPDATE: 'video:update',
  VIDEO_DELETE: 'video:delete',
  EMPLOYEE_READ: 'employee:read',
  EMPLOYEE_UPDATE: 'employee:update',
  SETTINGS_MANAGE: 'settings:manage',
} as const;

// Content configuration (videos and presentations)
export const CONTENT_CONFIG = {
  VIDEO: {
    SUPPORTED_FORMATS: ['mp4', 'webm', 'mov', 'avi'] as const,
    MIME_TYPES: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'] as const,
  },
  PRESENTATION: {
    SUPPORTED_FORMATS: ['pptx', 'ppsx'] as const,
    MIME_TYPES: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.slideshow'
    ] as const,
  },
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  THUMBNAIL_COLORS: [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-teal-500',
  ] as const,
  SUPPORTED_URLS: {
    YOUTUBE: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
    GOOGLE_DRIVE: /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/,
    GOOGLE_PRESENTATION: /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+/,
  } as const,
} as const;

// Legacy alias for backward compatibility
export const VIDEO_CONFIG = CONTENT_CONFIG;

// UI configuration
export const UI_CONFIG = {
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  PAGINATION_SIZE: 10,
  TABLE_PAGE_SIZE: 20,
} as const;

// Accessibility configuration
export const A11Y_CONFIG = {
  MIN_TOUCH_TARGET: 44, // pixels
  MIN_CONTRAST_RATIO: 4.5,
  FOCUS_RING_WIDTH: 2,
  REDUCED_MOTION_QUERY: '(prefers-reduced-motion: reduce)',
  HIGH_CONTRAST_QUERY: '(prefers-contrast: high)',
} as const;

// Form validation
export const VALIDATION_RULES = {
  TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  DESCRIPTION: {
    MAX_LENGTH: 500,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  URL: {
    PATTERN: /^https?:\/\/.+/,
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: {
    REQUIRED: 'This field is required.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_URL: 'Please enter a valid URL.',
    MIN_LENGTH: (min: number) => `Must be at least ${min} characters long.`,
    MAX_LENGTH: (max: number) => `Must be no more than ${max} characters long.`,
    FILE_SIZE: `File size must be less than ${VIDEO_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB.`,
    FILE_FORMAT: `Supported formats: ${CONTENT_CONFIG.VIDEO.SUPPORTED_FORMATS.join(', ')}.`,
  },
  VIDEO: {
    LOAD_FAILED: 'Failed to load videos. Please refresh the page.',
    SAVE_FAILED: 'Failed to save video. Please try again.',
    DELETE_FAILED: 'Failed to delete video. Please try again.',
    UPLOAD_FAILED: 'Failed to upload video file. Please try again.',
  },
  EMPLOYEE: {
    LOAD_FAILED: 'Failed to load employee data. Please refresh the page.',
    UPDATE_FAILED: 'Failed to update employee information. Please try again.',
  },
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  VIDEO: {
    CREATED: 'Video has been successfully added to the training library.',
    UPDATED: 'Video details have been successfully updated.',
    DELETED: 'Video has been permanently removed from the library.',
  },
  EMPLOYEE: {
    UPDATED: 'Employee information has been successfully updated.',
  },
  SETTINGS: {
    SAVED: 'Settings have been successfully saved.',
  },
} as const;

// Navigation and routing
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ADMIN_DASHBOARD: '/admin',
  EMPLOYEE_DASHBOARD: '/employee',
  SETTINGS: '/settings',
  NOT_FOUND: '/404',
} as const;

// Database configuration
export const DB_CONFIG = {
  TABLES: {
    PROFILES: 'profiles',
    USER_ROLES: 'user_roles',
    VIDEOS: 'videos',
    TRAINING_PROGRESS: 'training_progress',
  },
  POLICIES: {
    SELECT: 'SELECT',
    INSERT: 'INSERT', 
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
  },
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  CLOSE_MODAL: 'Escape',
  SAVE: 'Ctrl+S',
  DELETE: 'Delete',
  SEARCH: 'Ctrl+K',
  NEW_VIDEO: 'Ctrl+N',
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;