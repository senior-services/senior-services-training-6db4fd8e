import { supabase } from "@/integrations/supabase/client";
import { Quiz, QuizQuestion, QuizQuestionOption, QuizWithQuestions, QuizSubmissionData, QuizAttemptWithDetails } from "@/types/quiz";
import { logger } from "@/utils/logger";

// Helper function to get current user role
async function getCurrentUserRole(): Promise<'admin' | 'employee' | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return 'employee'; // Default to employee
    return data.role as 'admin' | 'employee';
  } catch (error) {
    logger.error('Error getting user role:', error);
    return 'employee'; // Default to employee on error
  }
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

  // Get quiz by ID with questions and options
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

      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', id)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      // Fetch options based on user role
      const questionsWithOptions = await Promise.all(
        (questions || []).map(async (question) => {
          let options: any[] = [];
          
          if (userRole === 'admin') {
            // Admins can see all fields including is_correct
            const { data: adminOptions, error: optionError } = await supabase
              .from('quiz_question_options')
              .select('*')
              .eq('question_id', question.id)
              .order('order_index', { ascending: true });
              
            if (optionError) throw optionError;
            options = adminOptions || [];
          } else {
            // Employees get safe options without is_correct
            options = await getSafeQuizOptions(question.id);
          }

          return {
            ...question,
            question_type: question.question_type as 'multiple_choice' | 'true_false' | 'single_answer',
            options
          };
        })
      );

      return {
        ...quiz,
        questions: questionsWithOptions
      };
    } catch (error) {
      logger.error('Error fetching quiz by ID:', error);
      throw error;
    }
  },

  // Get quiz by video ID
  async getByVideoId(videoId: string): Promise<QuizWithQuestions | null> {
    try {
      const userRole = await getCurrentUserRole();
      
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('video_id', videoId)
        .maybeSingle();

      if (quizError) throw quizError;
      if (!quiz) return null; // No quiz found

      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      // Fetch options based on user role
      const questionsWithOptions = await Promise.all(
        (questions || []).map(async (question) => {
          let options: any[] = [];
          
          if (userRole === 'admin') {
            // Admins can see all fields including is_correct
            const { data: adminOptions, error: optionError } = await supabase
              .from('quiz_question_options')
              .select('*')
              .eq('question_id', question.id)
              .order('order_index', { ascending: true });
              
            if (optionError) throw optionError;
            options = adminOptions || [];
          } else {
            // Employees get safe options without is_correct
            options = await getSafeQuizOptions(question.id);
          }

          return {
            ...question,
            question_type: question.question_type as 'multiple_choice' | 'true_false' | 'single_answer',
            options
          };
        })
      );

      return {
        ...quiz,
        questions: questionsWithOptions
      };
    } catch (error) {
      logger.error('Error fetching quiz by video ID:', error);
      return null; // Return null instead of throwing to prevent breaking the UI
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