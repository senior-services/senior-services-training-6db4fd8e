/**
 * Centralized date formatting & due-date status utility.
 * Display-layer only — database/state values remain raw ISO strings.
 */

import { format, differenceInDays, isPast, isToday, startOfDay } from 'date-fns';

// ---------------------------------------------------------------------------
// Format helpers (all accept string | Date)
// ---------------------------------------------------------------------------

const toDate = (input: string | Date): Date =>
  typeof input === 'string' ? new Date(input) : input;

/** Short format: Feb 16, '26 */
export const formatShort = (input: string | Date): string =>
  format(toDate(input), "MMM dd, ''yy");

/** Medium format: Feb 16, 2026 */
export const formatMedium = (input: string | Date): string =>
  format(toDate(input), 'MMM dd, yyyy');

/** Long format: February 16, 2026 */
export const formatLong = (input: string | Date): string =>
  format(toDate(input), 'MMMM dd, yyyy');

// ---------------------------------------------------------------------------
// Due-date status calculator
// ---------------------------------------------------------------------------

export type DueDateStatusKey = 'overdue' | 'today' | 'near' | 'far';

export interface DueDateStatus {
  text: string;
  status: DueDateStatusKey;
}

/**
 * Returns a human-readable label and semantic status key for a given due date.
 * Does NOT account for completion — callers should check that separately.
 */
export const getDueDateStatus = (dueDate: string | Date): DueDateStatus => {
  const due = startOfDay(toDate(dueDate));
  const today = startOfDay(new Date());
  const daysUntil = differenceInDays(due, today);

  if (isPast(due) && daysUntil < 0) {
    return { text: 'Overdue', status: 'overdue' };
  }
  if (isToday(due) || daysUntil === 0) {
    return { text: 'Due Today', status: 'today' };
  }
  if (daysUntil < 30) {
    return { text: `Due in ${daysUntil} days`, status: 'near' };
  }
  return { text: `Due ${formatShort(due)}`, status: 'far' };
};

// ---------------------------------------------------------------------------
// Badge variant mapper
// ---------------------------------------------------------------------------

/**
 * Maps a DueDateStatusKey to the appropriate badge variant string.
 */
export const dueDateStatusToVariant = (
  status: DueDateStatusKey
): 'soft-destructive' | 'soft-warning' | 'soft-primary' => {
  switch (status) {
    case 'overdue':
      return 'soft-destructive';
    case 'today':
      return 'soft-warning';
    case 'near':
    case 'far':
    default:
      return 'soft-primary';
  }
};
