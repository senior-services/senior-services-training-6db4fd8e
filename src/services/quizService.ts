import { supabase } from "@/integrations/supabase/client";
import { Quiz, QuizQuestion, QuizQuestionOption, QuizWithQuestions, QuizSubmissionData, QuizAttemptWithDetails } from "@/types/quiz";
import { logger } from "@/utils/logger";

// Cache user role to avoid repeated database calls
let userRoleCache: { role: 'admin' | 'employee' | null; expires: number } | null = null;
const ROLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get current user role with caching
async function getCurrentUserRole(): Promise<'admin' | 'employee' | null> {
  try {
    // Check cache first
    if (userRoleCache && Date.now() < userRoleCache.expires) {
      return userRoleCache.role;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      userRoleCache = { role: null, expires: Date.now() + ROLE_CACHE_DURATION };
      return null;
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const role = (error || !data) ? 'employee' : data.role as 'admin' | 'employee';
    userRoleCache = { role, expires: Date.now() + ROLE_CACHE_DURATION };
    
    return role;
  } catch (error) {
    logger.error('Error getting user role:', error);
    const role = 'employee'; // Default to employee on error
    userRoleCache = { role, expires: Date.now() + ROLE_CACHE_DURATION };
    return role;
  }
}

// Clear role cache when needed
export function clearUserRoleCache() {
  userRoleCache = null;
}

// Helper function to get safe quiz options for employees
async function getSafeQuizOptions(questionId: string): Promise<Omit<QuizQuestionOption, 'is_correct'>[]> {
  try {
    const { data, error } = await supabase.rpc('get_safe_quiz_options', {
      p_question_id: questionId
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching safe quiz options:', error);
    return [];
  }
}

export const quizOperations = {
  // Get all quizzes
  async getAll(): Promise<Quiz[]> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching quizzes:', error);
      throw error;
    }
  },

  // Get quiz by ID with questions and options (optimized)
  async getById(id: string): Promise<QuizWithQuestions | null> {
    try {
      const userRole = await getCurrentUserRole();
      
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();

      if (quizError) throw quizError;
      if (!quiz) return null;

      // Get questions first
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', id)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      // Transform questions and handle role-based option loading
      const questionsWithOptions = await Promise.all((questions || []).map(async (question: any) => {
        let options = [];
        
        if (userRole === 'admin') {
          // Admins can access options directly
          const { data: adminOptions, error: optionsError } = await supabase
            .from('quiz_question_options')
            .select('*')
            .eq('question_id', question.id)
            .order('order_index', { ascending: true });
          
          if (optionsError) {
            logger.error('Error fetching admin options:', optionsError);
          } else {
            options = adminOptions || [];
          }
        } else {
          // Employees use the safe RPC function
          options = await getSafeQuizOptions(question.id);
        }

        // Log if no options found for debugging
        if (options.length === 0) {
          logger.warn('No options found for question', { questionId: question.id, userRole });
        }

        return {
          ...question,
          question_type: question.question_type as 'multiple_choice' | 'true_false' | 'single_answer',
          options
        };
      }));

      return {
        ...quiz,
        questions: questionsWithOptions
      };
    } catch (error) {
      logger.error('Error fetching quiz by ID:', error);
      throw error;
    }
  },

  // Get quiz by video ID (optimized)
  async getByVideoId(videoId: string): Promise<QuizWithQuestions | null> {
    try {
      const userRole = await getCurrentUserRole();
      
      // Get quiz first
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('video_id', videoId)
        .maybeSingle();

      if (quizError) throw quizError;
      if (!quiz) return null; // No quiz found

      // Get questions
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      // Transform questions and handle role-based option loading
      const questionsWithOptions = await Promise.all((questions || []).map(async (question: any) => {
        let options = [];
        
        if (userRole === 'admin') {
          // Admins can access options directly
          const { data: adminOptions, error: optionsError } = await supabase
            .from('quiz_question_options')
            .select('*')
            .eq('question_id', question.id)
            .order('order_index', { ascending: true });
          
          if (optionsError) {
            logger.error('Error fetching admin options:', optionsError);
          } else {
            options = adminOptions || [];
          }
        } else {
          // Employees use the safe RPC function
          options = await getSafeQuizOptions(question.id);
        }

        // Log if no options found for debugging
        if (options.length === 0) {
          logger.warn('No options found for question', { questionId: question.id, userRole });
        }

        return {
          ...question,
          question_type: question.question_type as 'multiple_choice' | 'true_false' | 'single_answer',
          options
        };
      }));

      return {
        ...quiz,
        questions: questionsWithOptions
      };
    } catch (error) {
      logger.error('Error fetching quiz by video ID:', error);
      return null; // Return null instead of throwing to prevent breaking the UI
    }
  },

  // Lightweight check for quiz presence (for VideoTable)
  async hasQuiz(videoId: string): Promise<boolean> {
    try {
      // First check if quiz exists
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('video_id', videoId)
        .limit(1);

      if (quizError) throw quizError;
      if (!quizData || quizData.length === 0) return false;

      // Then check if quiz has at least one question
      const { count, error: questionError } = await supabase
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizData[0].id);

      if (questionError) throw questionError;
      return (count || 0) > 0;
    } catch (error) {
      logger.debug('Error checking quiz presence:', error);
      return false;
    }
  },

  // Create new quiz
  async create(quiz: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>): Promise<Quiz> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .insert(quiz)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating quiz:', error);
      throw error;
    }
  },

  // Update quiz
  async update(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating quiz:', error);
      throw error;
    }
  },

  // Delete quiz
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting quiz:', error);
      throw error;
    }
  },

  // Submit quiz attempt
  async submitQuiz(employeeEmail: string, quizId: string, responses: QuizSubmissionData[]): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('submit_quiz_attempt', {
        p_employee_email: employeeEmail,
        p_quiz_id: quizId,
        p_responses: responses as any // Cast to any to bypass strict type checking
      });

      if (error) throw error;
      return data; // Returns quiz attempt ID
    } catch (error) {
      logger.error('Error submitting quiz:', error);
      throw error;
    }
  },

  // Get quiz attempts for a user
  async getUserAttempts(employeeEmail: string): Promise<QuizAttemptWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes (*),
          quiz_responses (*),
          employees!inner (email, full_name)
        `)
        .eq('employees.email', employeeEmail)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(attempt => ({
        ...attempt,
        quiz: attempt.quizzes,
        responses: attempt.quiz_responses,
        employee_email: attempt.employees?.email,
        employee_name: attempt.employees?.full_name
      }));
    } catch (error) {
      logger.error('Error fetching user quiz attempts:', error);
      throw error;
    }
  },

  // Get all quiz attempts (admin only)
  async getAllAttempts(): Promise<QuizAttemptWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes (*),
          quiz_responses (*),
          employees (email, full_name)
        `)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(attempt => ({
        ...attempt,
        quiz: attempt.quizzes,
        responses: attempt.quiz_responses,
        employee_email: attempt.employees?.email,
        employee_name: attempt.employees?.full_name
      }));
    } catch (error) {
      logger.error('Error fetching all quiz attempts:', error);
      throw error;
    }
  }
};

export const questionOperations = {
  // Create question
  async create(question: Omit<QuizQuestion, 'id' | 'created_at' | 'updated_at'>): Promise<QuizQuestion> {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .insert(question)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        question_type: data.question_type as 'multiple_choice' | 'true_false' | 'single_answer'
      };
    } catch (error) {
      logger.error('Error creating question:', error);
      throw error;
    }
  },

  // Update question
  async update(id: string, updates: Partial<QuizQuestion>): Promise<QuizQuestion> {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        question_type: data.question_type as 'multiple_choice' | 'true_false' | 'single_answer'
      };
    } catch (error) {
      logger.error('Error updating question:', error);
      throw error;
    }
  },

  // Delete question
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting question:', error);
      throw error;
    }
  }
};

export const optionOperations = {
  // Create option
  async create(option: Omit<QuizQuestionOption, 'id' | 'created_at' | 'updated_at'>): Promise<QuizQuestionOption> {
    try {
      const { data, error } = await supabase
        .from('quiz_question_options')
        .insert(option)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating option:', error);
      throw error;
    }
  },

  // Update option
  async update(id: string, updates: Partial<QuizQuestionOption>): Promise<QuizQuestionOption> {
    try {
      const { data, error } = await supabase
        .from('quiz_question_options')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating option:', error);
      throw error;
    }
  },

  // Delete option
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quiz_question_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting option:', error);
      throw error;
    }
  }
};