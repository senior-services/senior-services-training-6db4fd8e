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
  // Get correct options for a quiz (after submission)
  async getCorrectOptionsForQuiz(quizId: string): Promise<Record<string, string[]>> {
    try {
      const { data, error } = await supabase.rpc('get_correct_options_for_quiz', {
        p_quiz_id: quizId
      });

      if (error) {
        logger.warn('Failed to get correct options for quiz', { quizId, error });
        return {};
      }

      // Group correct options by question_id
      const correctOptions: Record<string, string[]> = {};
      data?.forEach((item: { question_id: string; option_id: string }) => {
        if (!correctOptions[item.question_id]) {
          correctOptions[item.question_id] = [];
        }
        correctOptions[item.question_id].push(item.option_id);
      });

      return correctOptions;
    } catch (error) {
      logger.error('Error getting correct options for quiz', error);
      return {};
    }
  },

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

  // Get quiz by video ID (optimized) - returns only active (non-archived) quiz
  async getByVideoId(videoId: string): Promise<QuizWithQuestions | null> {
    try {
      const userRole = await getCurrentUserRole();
      
      // Get active quiz (non-archived) first
      const query = supabase
        .from('quizzes')
        .select('*')
        .eq('video_id', videoId);
      
      // For non-admins, RLS already filters archived. For admins, filter explicitly.
      if (userRole === 'admin') {
        query.is('archived_at', null);
      }
      
      const { data: quiz, error: quizError } = await query
        .order('version', { ascending: false })
        .limit(1)
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

  // Lightweight check for quiz presence (for VideoTable) - only active quizzes
  async hasQuiz(videoId: string): Promise<boolean> {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('video_id', videoId)
        .is('archived_at', null)
        .limit(1);

      if (quizError) throw quizError;
      if (!quizData || quizData.length === 0) return false;

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

  // Get quiz version info for a video (version number + total version count)
  async getQuizVersionInfo(videoId: string): Promise<{ hasQuiz: boolean; version: number; versionCount: number }> {
    try {
      // Get all quizzes for this video to determine version count
      const { data: allQuizzes, error: allError } = await supabase
        .from('quizzes')
        .select('id, version, archived_at')
        .eq('video_id', videoId);

      if (allError) throw allError;
      if (!allQuizzes || allQuizzes.length === 0) {
        return { hasQuiz: false, version: 0, versionCount: 0 };
      }

      // Find the active (non-archived) quiz
      const activeQuiz = allQuizzes.find(q => q.archived_at === null);
      if (!activeQuiz) {
        return { hasQuiz: false, version: 0, versionCount: allQuizzes.length };
      }

      // Verify it has questions
      const { count, error: questionError } = await supabase
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', activeQuiz.id);

      if (questionError) throw questionError;
      if ((count || 0) === 0) {
        return { hasQuiz: false, version: 0, versionCount: allQuizzes.length };
      }

      return {
        hasQuiz: true,
        version: activeQuiz.version,
        versionCount: allQuizzes.length
      };
    } catch (error) {
      logger.debug('Error getting quiz version info:', error);
      return { hasQuiz: false, version: 0, versionCount: 0 };
    }
  },

  // Check if a video has any assignments
  async hasAssignments(videoId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('video_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId);

      if (error) throw error;
      return (count || 0) > 0;
    } catch (error) {
      logger.error('Error checking assignments:', error);
      return false;
    }
  },

  // Create a new version of a quiz (archives the old one, returns new quiz ID)
  async createVersion(quizId: string): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('create_quiz_version', {
        p_quiz_id: quizId,
        p_admin_user_id: user.id
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating quiz version:', error);
      throw error;
    }
  },

  // Get version history for a video's quizzes (all versions including archived)
  async getVersionHistory(videoId: string): Promise<QuizWithQuestions[]> {
    try {
      // Explicitly fetch ALL quiz versions for this video (active + archived)
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('video_id', videoId)
        .order('version', { ascending: true });

      if (quizzesError) throw quizzesError;
      
      logger.info(`[getVersionHistory] Fetched ${quizzes?.length ?? 0} quiz version(s) for video ${videoId}`);
      if (quizzes && quizzes.length > 0) {
        logger.info(`[getVersionHistory] Versions: ${quizzes.map(q => `v${q.version} (archived: ${!!q.archived_at})`).join(', ')}`);
      }
      
      if (!quizzes || quizzes.length === 0) return [];

      // Load questions + options for each version
      const results: QuizWithQuestions[] = [];
      for (const quiz of quizzes) {
        const { data: questions, error: qError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quiz.id)
          .order('order_index', { ascending: true });

        if (qError) throw qError;

        const questionsWithOptions = await Promise.all((questions || []).map(async (question: any) => {
          const { data: options, error: optError } = await supabase
            .from('quiz_question_options')
            .select('*')
            .eq('question_id', question.id)
            .order('order_index', { ascending: true });

          if (optError) throw optError;

          return {
            ...question,
            question_type: question.question_type as 'multiple_choice' | 'true_false' | 'single_answer',
            options: options || []
          };
        }));

        results.push({ ...quiz, questions: questionsWithOptions });
      }

      return results;
    } catch (error) {
      logger.error('Error getting version history:', error);
      throw error;
    }
  },

  // Get the count of versions for a video's quiz
  async getVersionCount(videoId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error getting version count:', error);
      return 0;
    }
  },

  // Create new quiz
  async create(quiz: Omit<Quiz, 'id' | 'created_at' | 'updated_at' | 'version' | 'version_group_id' | 'archived_at' | 'created_by' | 'updated_by'>): Promise<Quiz> {
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

  // Check quiz usage
  async checkUsage(id: string): Promise<{ canDelete: boolean; attemptCount: number }> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('employee_id')
        .eq('quiz_id', id);

      if (error) throw error;

      const attemptCount = data?.length || 0;
      const canDelete = attemptCount === 0;

      return { canDelete, attemptCount };
    } catch (error) {
      logger.error('Error checking quiz usage:', error);
      throw error;
    }
  },

  // Delete quiz
  async delete(id: string): Promise<void> {
    try {
      // Check usage before allowing deletion
      const { canDelete, attemptCount } = await this.checkUsage(id);
      if (!canDelete) {
        throw new Error(`Cannot delete quiz: it has ${attemptCount} completion(s) by users`);
      }

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