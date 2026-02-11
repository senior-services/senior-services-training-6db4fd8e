/**
 * Type definitions for the Senior Services Training Portal
 * Centralized type management for better maintainability and consistency
 */

// Core entity types
export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'employee';
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

// Video and training types
export interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_file_name: string | null;
  thumbnail_url?: string | null;
  type: VideoType;
  completion_rate: number;
  duration_seconds: number;
  archived_at?: string | null; // Controls visibility - when set, item is "hidden" from active lists
  created_at: string;
  updated_at: string;
  content_type?: ContentType; // Optional for backward compatibility
}

// Wrapper interface for enhanced functionality with required content_type
export interface TrainingContent extends Video {
  content_type: ContentType; // Required in wrapper
}

export type VideoType = 'Required' | 'Optional';
export type ContentType = 'video' | 'presentation';


// Employee and progress types
export interface Employee {
  id: string;
  name: string;
  email: string;
  requiredProgress: number;
  completedVideos: number;
  totalVideos: number;
  status: EmployeeStatus;
}

export type EmployeeStatus = 'completed' | 'on-track' | 'behind';

export interface TrainingProgress {
  id: string;
  user_id: string;
  video_id: string;
  completed: boolean;
  progress_percentage: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Component prop types
export interface DashboardProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface VideoModalProps extends ModalProps {
  video: Video | null;
}

export interface EditVideoModalProps extends ModalProps {
  video: Video | null;
  onSave: (videoId: string, updates: VideoUpdateData) => Promise<void>;
  onDelete: (videoId: string) => Promise<void>;
}


// Update and creation types
export interface VideoUpdateData {
  title: string;
  description: string;
  type?: VideoType;
  content_type?: ContentType;
}

export interface VideoCreateData extends VideoUpdateData {
  video_url?: string;
  video_file_name?: string;
  type: VideoType;
  duration_seconds?: number;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  error: string | null;
  loading: boolean;
}

// Toast and notification types
export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

// Accessibility types
export interface AriaProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
  'aria-modal'?: boolean;
  'aria-invalid'?: boolean;
  'aria-pressed'?: boolean;
  'aria-sort'?: 'ascending' | 'descending' | 'none';
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  role?: string;
}

// Form validation types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FormField {
  name: string;
  value: string;
  rules: ValidationRule[];
  error?: string;
}

// Theme and styling types
export type ColorMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  colorMode: ColorMode;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
}