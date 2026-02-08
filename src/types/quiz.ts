export interface Quiz {
  id: string;
  video_id: string;
  title: string;
  description?: string;
  version: number;
  version_group_id: string;
  archived_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'single_answer';
  order_index: number;
  created_at: string;
  updated_at: string;
  options?: (QuizQuestionOption | SafeQuizQuestionOption)[];
}

export interface QuizQuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Safe version for employees - excludes is_correct field
export interface SafeQuizQuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  employee_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface QuizResponse {
  id: string;
  quiz_attempt_id: string;
  question_id: string;
  selected_option_id?: string;
  text_answer?: string;
  is_correct: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizSubmissionData {
  question_id: string;
  selected_option_id?: string;
  text_answer?: string;
}

export interface QuizWithQuestions extends Quiz {
  questions: QuizQuestion[];
}

export interface QuizAttemptWithDetails extends QuizAttempt {
  quiz: Quiz;
  responses: QuizResponse[];
  employee_email?: string;
  employee_name?: string;
}