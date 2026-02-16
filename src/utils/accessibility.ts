/**
 * Accessibility utilities for enhanced screen reader support and keyboard navigation
 * Ensures compliance with WCAG 2.1 guidelines
 */

import { A11Y_CONFIG } from '@/constants';
import { AriaProps } from '@/types';
import { formatLong, getDueDateStatus } from '@/utils/date-formatter';

/**
 * Generates unique IDs for accessibility attributes
 * @param prefix - Prefix for the ID
 * @returns Unique ID string
 */
export const generateAccessibilityId = (prefix: string = 'a11y'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Creates ARIA props for form field associations
 * @param fieldName - Name of the form field
 * @param hasError - Whether the field has an error
 * @param hasDescription - Whether the field has a description
 * @returns ARIA props object
 */
export const createFieldAriaProps = (
  fieldName: string,
  hasError: boolean = false,
  hasDescription: boolean = false
): AriaProps => {
  const baseId = `field-${fieldName}`;
  const props: AriaProps = {};
  
  if (hasError) {
    props['aria-describedby'] = `${baseId}-error`;
    props['aria-invalid'] = 'true' as any;
  }
  
  if (hasDescription) {
    const existingDescribedBy = props['aria-describedby'];
    props['aria-describedby'] = existingDescribedBy 
      ? `${existingDescribedBy} ${baseId}-description`
      : `${baseId}-description`;
  }
  
  return props;
};

/**
 * Creates ARIA props for modal dialogs
 * @param title - Modal title
 * @param description - Modal description (optional)
 * @returns ARIA props object
 */
export const createModalAriaProps = (
  title: string,
  description?: string
): AriaProps => {
  const titleId = generateAccessibilityId('modal-title');
  const descId = description ? generateAccessibilityId('modal-desc') : undefined;
  
  return {
    role: 'dialog',
    'aria-modal': 'true' as any,
    'aria-labelledby': titleId,
    'aria-describedby': descId,
  };
};

/**
 * Creates ARIA props for navigation items
 * @param isActive - Whether the navigation item is active
 * @param label - Accessible label for the item
 * @returns ARIA props object
 */
export const createNavAriaProps = (
  isActive: boolean = false,
  label?: string
): AriaProps => {
  return {
    'aria-current': isActive ? 'page' : undefined,
    'aria-label': label,
    role: 'menuitem',
  };
};

/**
 * Creates ARIA props for button elements
 * @param action - The action the button performs
 * @param isExpanded - For dropdown/collapsible buttons
 * @param isPressed - For toggle buttons
 * @returns ARIA props object
 */
export const createButtonAriaProps = (
  action: string,
  isExpanded?: boolean,
  isPressed?: boolean
): AriaProps => {
  const props: AriaProps = {
    'aria-label': action,
  };
  
  if (typeof isExpanded === 'boolean') {
    props['aria-expanded'] = isExpanded;
  }
  
  if (typeof isPressed === 'boolean') {
    props['aria-pressed'] = isPressed as any;
  }
  
  return props;
};

/**
 * Creates ARIA props for table elements
 * @param sortColumn - Currently sorted column (if any)
 * @param sortDirection - Sort direction
 * @returns ARIA props object
 */
export const createTableAriaProps = (
  sortColumn?: string,
  sortDirection?: 'asc' | 'desc'
): AriaProps => {
  const props: AriaProps = {
    role: 'table',
  };
  
  if (sortColumn && sortDirection) {
    props['aria-sort'] = sortDirection === 'asc' ? 'ascending' : 'descending';
  }
  
  return props;
};

/**
 * Announces content to screen readers
 * @param message - Message to announce
 * @param priority - Priority level ('polite' or 'assertive')
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Manages focus for keyboard navigation
 * @param element - Element to focus
 * @param options - Focus options
 */
export const manageFocus = (
  element: HTMLElement | null,
  options: {
    preventScroll?: boolean;
    selectText?: boolean;
  } = {}
): void => {
  if (!element) return;
  
  element.focus({ preventScroll: options.preventScroll });
  
  if (options.selectText && element instanceof HTMLInputElement) {
    element.select();
  }
};

/**
 * Creates a focus trap for modal dialogs
 * @param containerElement - Container element to trap focus within
 * @returns Function to cleanup the focus trap
 */
export const createFocusTrap = (containerElement: HTMLElement): (() => void) => {
  const focusableSelector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');
  
  const getFocusableElements = (): HTMLElement[] => {
    return Array.from(containerElement.querySelectorAll(focusableSelector));
  };
  
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;
    
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };
  
  // Set initial focus
  const focusableElements = getFocusableElements();
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
  
  // Add event listener
  document.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Checks if user prefers reduced motion
 * @returns True if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia(A11Y_CONFIG.REDUCED_MOTION_QUERY).matches;
};

/**
 * Checks if user prefers high contrast
 * @returns True if user prefers high contrast
 */
export const prefersHighContrast = (): boolean => {
  return window.matchMedia(A11Y_CONFIG.HIGH_CONTRAST_QUERY).matches;
};

/**
 * Calculates color contrast ratio
 * @param color1 - First color in hex format
 * @param color2 - Second color in hex format
 * @returns Contrast ratio
 */
export const calculateContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Validates color contrast meets accessibility standards
 * @param foreground - Foreground color
 * @param background - Background color
 * @param isLargeText - Whether the text is considered large (>= 18pt or >= 14pt bold)
 * @returns True if contrast meets WCAG AA standards
 */
export const meetsContrastStandard = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = calculateContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 3 : A11Y_CONFIG.MIN_CONTRAST_RATIO;
  
  return ratio >= requiredRatio;
};

/**
 * Ensures minimum touch target size for mobile accessibility
 * @param element - Element to check/modify
 * @returns True if element meets minimum size requirements
 */
export const ensureMinimumTouchTarget = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  const meetsWidth = rect.width >= A11Y_CONFIG.MIN_TOUCH_TARGET;
  const meetsHeight = rect.height >= A11Y_CONFIG.MIN_TOUCH_TARGET;
  
  if (!meetsWidth || !meetsHeight) {
    // Add padding to meet minimum requirements
    const style = window.getComputedStyle(element);
    const currentPadding = {
      top: parseInt(style.paddingTop, 10),
      right: parseInt(style.paddingRight, 10),
      bottom: parseInt(style.paddingBottom, 10),
      left: parseInt(style.paddingLeft, 10),
    };
    
    if (!meetsWidth) {
      const additionalPadding = (A11Y_CONFIG.MIN_TOUCH_TARGET - rect.width) / 2;
      element.style.paddingLeft = `${currentPadding.left + additionalPadding}px`;
      element.style.paddingRight = `${currentPadding.right + additionalPadding}px`;
    }
    
    if (!meetsHeight) {
      const additionalPadding = (A11Y_CONFIG.MIN_TOUCH_TARGET - rect.height) / 2;
      element.style.paddingTop = `${currentPadding.top + additionalPadding}px`;
      element.style.paddingBottom = `${currentPadding.bottom + additionalPadding}px`;
    }
  }
  
  return meetsWidth && meetsHeight;
};

/**
 * Calculates training progress efficiently
 */
export const calculateProgressPercentage = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

/**
 * Formats duration in seconds to an accessible, human-readable format
 * Includes proper screen reader announcements
 */
export const formatDurationSeconds = (seconds: number): string => {
  if (seconds === 0) return '0 minutes';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0 && remainingSeconds === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  if (remainingSeconds === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
};

/**
 * Formats duration in an accessible, human-readable format
 * Includes proper screen reader announcements
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
};

/**
 * Generates comprehensive ARIA labels for training cards
 */
export const getTrainingCardAriaLabel = (
  title: string, 
  progress: number, 
  isRequired: boolean, 
  dueDate?: string | null
): string => {
  let label = `Training video: ${title}. Progress: ${progress} percent complete.`;
  
  if (isRequired) {
    label += ' This is required training.';
  }
  
  if (dueDate) {
    label += ` Due date: ${formatLong(dueDate)}.`;
  }
  
  if (progress === 100) {
    label += ' Completed.';
  } else if (progress > 0) {
    label += ' In progress.';
  } else {
    label += ' Not started.';
  }
  
  return label;
};

/**
 * Generates ARIA labels for progress indicators
 */
export const getProgressAriaLabel = (progress: number, title?: string): string => {
  const baseLabel = `Progress: ${progress} percent complete`;
  return title ? `${title} - ${baseLabel}` : baseLabel;
};

/**
 * Creates accessible status announcements for screen readers
 */
export const getStatusAnnouncement = (
  progress: number,
  isRequired: boolean,
  dueDate?: string | null
): string => {
  let announcement = '';
  
  if (progress === 100) {
    announcement = 'Training completed successfully.';
  } else if (progress > 0) {
    announcement = `Training in progress. ${progress} percent complete.`;
  } else {
    announcement = 'Training not started.';
  }
  
  if (isRequired && dueDate) {
    const { text, status } = getDueDateStatus(dueDate);
    if (status === 'overdue' || status === 'today' || status === 'near') {
      announcement += ` This required training: ${text}.`;
    }
  }
  
  return announcement;
};

/**
 * Keyboard navigation helper for interactive elements
 */
export const handleKeyPress = (
  event: React.KeyboardEvent,
  callback: () => void,
  keys: string[] = ['Enter', ' ']
): void => {
  if (keys.includes(event.key)) {
    event.preventDefault();
    callback();
  }
};