/**
 * Shared quiz & training helpers — single source of truth for:
 *   • Legacy exemption check
 *   • Quiz results display string
 *   • Quiz version display string
 *   • Completion date resolution
 *   • Training completion status
 */

/**
 * Returns true when the employee completed the video *before* the quiz was created,
 * making them exempt from the quiz requirement.
 */
export function isLegacyExempt(
  completedAt: string | null | undefined,
  quizCreatedAt: string | null | undefined,
): boolean {
  if (!completedAt || !quizCreatedAt) return false;
  return new Date(completedAt) < new Date(quizCreatedAt);
}

/**
 * Whether a video with its quiz context counts as "has an active quiz requirement"
 * for the given employee. Returns false when no quiz exists or the employee is legacy-exempt.
 */
export function hasActiveQuizRequirement(
  quizCreatedAt: string | null | undefined,
  completedAt: string | null | undefined,
): boolean {
  if (!quizCreatedAt) return false;
  return !isLegacyExempt(completedAt, quizCreatedAt);
}

// ------------------------------------------------------------------
// Quiz results display
// ------------------------------------------------------------------

export interface QuizAttemptData {
  score: number;
  total_questions: number;
  completed_at: string;
  quiz_version?: number;
}

/**
 * Returns a display string for quiz results consistent across all surfaces.
 *
 * Priority order:
 * 1. If the employee has a quiz attempt → actual score
 * 2. No quiz on the training → "N/A"
 * 3. Legacy-exempt (no attempt) → "Exempt (No Quiz)"
 * 4. Otherwise → "Not Completed"
 *
 * @param isAssignedOrCompleted  Whether the video is assigned to / completed by the employee
 *                               (unassigned videos show "--" placeholders)
 */
export function getDisplayQuizResults(
  quizAttempt: QuizAttemptData | null | undefined,
  hasQuiz: boolean,
  isExempt: boolean,
  isAssignedOrCompleted: boolean = true,
): string {
  // Priority 1: actual attempt data always wins
  if (quizAttempt) {
    const pct = Math.round((quizAttempt.score / quizAttempt.total_questions) * 100);
    return `${pct}% (${quizAttempt.score}/${quizAttempt.total_questions} Correct)`;
  }

  if (!isAssignedOrCompleted) return '--';

  if (!hasQuiz) {
    return isExempt ? 'Exempt (No Quiz)' : 'N/A';
  }

  if (isExempt) return 'Exempt (No Quiz)';

  return 'Not Completed';
}

// ------------------------------------------------------------------
// Quiz version display
// ------------------------------------------------------------------

/**
 * Returns the quiz version string to display.
 *
 * • If the employee has an attempt → show the version from the attempt record
 * • Legacy-exempt or no quiz → "N/A"
 * • Otherwise → the latest active quiz version
 * • Unassigned → "--"
 */
export function getDisplayQuizVersion(
  quizAttempt: QuizAttemptData | null | undefined,
  latestVersion: number | undefined,
  hasQuiz: boolean,
  isExempt: boolean,
  isAssignedOrCompleted: boolean = true,
): string {
  if (!isAssignedOrCompleted) return '--';

  if (!hasQuiz && !isExempt) return 'N/A';

  // Attempt exists → show the version the employee actually took
  if (quizAttempt) {
    const version = quizAttempt.quiz_version ?? latestVersion;
    return version !== undefined ? `${version}` : '--';
  }

  if (isExempt) return 'N/A';

  return latestVersion !== undefined ? `${latestVersion}` : '--';
}

// ------------------------------------------------------------------
// Completion date resolution
// ------------------------------------------------------------------

/**
 * Returns the best completion date string.
 * Prefers the quiz attempt timestamp (the true "training finished" moment)
 * and falls back to the video progress completion timestamp.
 */
export function getCompletionDate(
  quizAttempt: QuizAttemptData | null | undefined,
  videoCompletedAt: string | null | undefined,
): string | null {
  if (quizAttempt?.completed_at) return quizAttempt.completed_at;
  return videoCompletedAt ?? null;
}

// ------------------------------------------------------------------
// Training completion check
// ------------------------------------------------------------------

/**
 * Is the training fully completed?
 * A training is complete when:
 *   1. The video is marked as 100% / has a completed_at timestamp
 *   AND
 *   2. If a quiz requirement exists → the employee has a quiz attempt
 *      (or is legacy-exempt)
 */
export function isTrainingCompleted(
  videoCompleted: boolean,
  hasQuiz: boolean,
  hasQuizAttempt: boolean,
  isExempt: boolean,
): boolean {
  if (!videoCompleted) return false;
  if (!hasQuiz || isExempt) return true;
  return hasQuizAttempt;
}
