import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogScrollArea, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { Play, FileVideo, Trash2, Copy, ExternalLink, Plus, FileQuestion } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { videoOperations } from '@/services/api';
import { quizOperations, questionOperations, optionOperations } from '@/services/quizService';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { sanitizeText } from "@/utils/security";
import { isYouTubeUrl, isGoogleDriveUrl, getYouTubeVideoId, getGoogleDriveEmbedUrl, getGoogleDriveViewUrl, getYouTubeWatchUrl } from "@/utils/videoUtils";
import { ContentPlayer } from "@/components/content/ContentPlayer";
import { TrainingContent, VideoType, ContentType } from "@/types";
import { QuizWithQuestions } from "@/types/quiz";
import { QuestionFormData, OptionFormData } from "@/components/quiz/CreateQuizModal";

// Extended interfaces for editing with IDs
interface EditableQuestionFormData extends QuestionFormData {
  id?: string;
  options: EditableOptionFormData[];
}
interface EditableOptionFormData extends OptionFormData {
  id?: string;
}
interface VideoData {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_file_name: string | null;
  thumbnail_url?: string | null;
  type: string;
  completion_rate: number;
  created_at: string;
  updated_at: string;
  content_type?: ContentType;
  archived_at?: string | null;
  duration_seconds?: number;
}
interface EditVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: VideoData | null;
  onSave: (videoId: string, updates: {
    title: string;
    description: string;
  }) => Promise<void>;
  onDelete: (videoId: string) => Promise<void>;
  onQuizSaved?: (videoId: string) => void;
}
export const EditVideoModal = ({
  open,
  onOpenChange,
  video,
  onSave,
  onDelete,
  onQuizSaved
}: EditVideoModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [questions, setQuestions] = useState<EditableQuestionFormData[]>([]);
  const [questionValidationErrors, setQuestionValidationErrors] = useState<{
    [key: number]: string;
  }>({});
  const [showQuizValidation, setShowQuizValidation] = useState(false);

  // Track original quiz state for unsaved changes detection
  const [originalQuestions, setOriginalQuestions] = useState<EditableQuestionFormData[]>([]);
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // New state for usage checking
  const [videoUsage, setVideoUsage] = useState<{
    canDelete: boolean;
    assignedCount: number;
    completedCount: number;
    quizCompletedCount: number;
  } | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const {
    toast
  } = useToast();

  // Load usage information for video only (quiz usage removed to prevent double-load flicker)
  const loadUsageInfo = useCallback(async () => {
    if (!video) return;
    setUsageLoading(true);
    try {
      const videoUsageResult = await videoOperations.checkUsage(video.id);
      if (videoUsageResult.success && videoUsageResult.data) {
        setVideoUsage(videoUsageResult.data);
      }
    } catch (error) {
      console.error('Error loading usage info:', error);
    } finally {
      setUsageLoading(false);
    }
  }, [video]);
  useEffect(() => {
    const abortController = new AbortController();
    if (video) {
      setVideoUsage(null); // Reset to prevent showing previous video's state
      setTitle(video.title || '');
      setDescription(video.description || '');
      loadQuiz(abortController.signal);
      loadUsageInfo();
    }
    return () => {
      abortController.abort();
    };
  }, [video, loadUsageInfo]);
  const loadQuiz = useCallback(async (abortSignal?: AbortSignal) => {
    if (!video) return;
    setQuizLoading(true);
    try {
      const quizData = await quizOperations.getByVideoId(video.id);

      // Check if the operation was aborted
      if (abortSignal?.aborted) return;
      setQuiz(quizData);
      if (quizData) {
        // Load existing questions into the editing form
        const loadedQuestions: EditableQuestionFormData[] = quizData.questions.map(q => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          order_index: q.order_index,
          options: q.options.map(opt => ({
            id: opt.id,
            option_text: opt.option_text,
            is_correct: 'is_correct' in opt ? opt.is_correct : false,
            order_index: opt.order_index
          }))
        }));
        setQuestions(loadedQuestions);

        // Store original values for unsaved changes detection
        setOriginalQuestions(JSON.parse(JSON.stringify(loadedQuestions)));
      } else {
        // No quiz found, show empty state
        setQuiz(null);
        setQuestions([]);

        // Clear original values too
        setOriginalQuestions([]);
      }
    } catch (error) {
      console.log('No quiz found for this video:', error);
    } finally {
      setQuizLoading(false);
    }
  }, [video]);
  // Helper function to ensure minimum options are always visible
  const ensureMinOptions = (options: EditableOptionFormData[], minCount: number = 2): EditableOptionFormData[] => {
    // Keep all existing options (both empty and non-empty)
    const existingOptions = [...options];

    // If we have fewer than the minimum, pad with empty options
    while (existingOptions.length < minCount) {
      existingOptions.push({
        option_text: "",
        is_correct: false,
        order_index: existingOptions.length
      });
    }

    // Reindex all options
    return existingOptions.map((opt, i) => ({
      ...opt,
      order_index: i
    }));
  };

  // Helper function to check if a question is valid
  const isQuestionValid = (question: EditableQuestionFormData): boolean => {
    // Question text must not be empty
    if (!question.question_text.trim()) {
      return false;
    }
    if (question.question_type === 'true_false') {
      // True/false questions only need non-empty question text
      return true;
    }
    if (question.question_type === 'multiple_choice' || question.question_type === 'single_answer') {
      // Need at least 2 non-empty options
      const nonEmptyOptions = question.options.filter(opt => opt.option_text.trim());
      if (nonEmptyOptions.length < 2) {
        return false;
      }

      // Need at least one correct answer
      const hasCorrectAnswer = nonEmptyOptions.some(opt => opt.is_correct);
      return hasCorrectAnswer;
    }
    return false;
  };
  const cleanupAndValidateQuestions = () => {
    const errors: {
      [key: number]: string;
    } = {};
    const cleanedQuestions = questions.map((question, index) => {
      // Check if question text is empty for all question types
      if (!question.question_text.trim()) {
        errors[index] = 'Question text is required.';
        return question;
      }
      if (question.question_type === 'multiple_choice') {
        // For multiple choice, filter out empty options for validation but keep them in UI
        const nonEmptyOptions = question.options.filter(opt => opt.option_text.trim());

        // Validate minimum 2 options
        if (nonEmptyOptions.length < 2) {
          errors[index] = 'Multiple choice questions require a minimum of 2 answers.';
        }

        // Ensure at least one correct answer
        const hasCorrectAnswer = nonEmptyOptions.some(opt => opt.is_correct);
        if (nonEmptyOptions.length >= 2 && !hasCorrectAnswer) {
          errors[index] = 'Please select at least one correct answer for this multiple choice question.';
        }

        // Ensure minimum 2 visible options in UI
        const optionsWithMinimum = ensureMinOptions(question.options, 2);
        return {
          ...question,
          options: optionsWithMinimum
        };
      } else if (question.question_type === 'single_answer') {
        // For single answer, filter out empty options for validation but keep them in UI
        const nonEmptyOptions = question.options.filter(opt => opt.option_text.trim());

        // Validate minimum 2 options
        if (nonEmptyOptions.length < 2) {
          errors[index] = 'Single answer questions require a minimum of 2 answers.';
        }

        // Ensure at least one correct answer
        const hasCorrectAnswer = nonEmptyOptions.some(opt => opt.is_correct);
        if (nonEmptyOptions.length >= 2 && !hasCorrectAnswer) {
          errors[index] = 'Please select one correct answer for this single answer question.';
        }

        // Ensure minimum 2 visible options in UI
        const optionsWithMinimum = ensureMinOptions(question.options, 2);
        return {
          ...question,
          options: optionsWithMinimum
        };
      } else if (question.question_type === 'true_false') {
        // For true/false questions, ensure exactly one correct answer
        const hasCorrectAnswer = question.options.some(opt => opt.is_correct);
        if (!hasCorrectAnswer) {
          errors[index] = 'Please select the correct answer (True or False).';
        }
        return question;
      }
      return question;
    });
    setQuestionValidationErrors(errors);
    setQuestions(cleanedQuestions);
    return Object.keys(errors).length === 0;
  };
  const validateQuestions = () => {
    const errors: {
      [key: number]: string;
    } = {};
    questions.forEach((question, index) => {
      // Check if question text is empty for all question types
      if (!question.question_text.trim()) {
        errors[index] = 'Question text is required.';
        return;
      }
      if (question.question_type === 'multiple_choice') {
        const nonEmptyOptions = question.options.filter(opt => opt.option_text.trim());
        if (nonEmptyOptions.length < 2) {
          errors[index] = 'Multiple choice questions require a minimum of 2 answers.';
        } else {
          const hasCorrectAnswer = nonEmptyOptions.some(opt => opt.is_correct);
          if (!hasCorrectAnswer) {
            errors[index] = 'Please select at least one correct answer for this multiple choice question.';
          }
        }
      } else if (question.question_type === 'single_answer') {
        const nonEmptyOptions = question.options.filter(opt => opt.option_text.trim());
        if (nonEmptyOptions.length < 2) {
          errors[index] = 'Single answer questions require a minimum of 2 answers.';
        } else {
          const hasCorrectAnswer = nonEmptyOptions.some(opt => opt.is_correct);
          if (!hasCorrectAnswer) {
            errors[index] = 'Please select one correct answer for this single answer question.';
          }
        }
      } else if (question.question_type === 'true_false') {
        // For true/false questions, ensure exactly one correct answer
        const hasCorrectAnswer = question.options.some(opt => opt.is_correct);
        if (!hasCorrectAnswer) {
          errors[index] = 'Please select the correct answer (True or False).';
        }
      }
    });
    setQuestionValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSave = async () => {
    if (!video) return;

    // Enable validation display and cleanup/validate questions before saving
    setShowQuizValidation(true);

    // Check quiz creation requirements for new quizzes
    const isCreatingNewQuiz = !quiz && questions.length > 0;
    if (isCreatingNewQuiz) {
      // Check if no questions added
      if (questions.length === 0) {
        toast({
          title: "Please add at least one question",
          description: "Please add at least one question to create the quiz.",
          variant: "destructive"
        });
        return;
      }
    }
    if (questions.length > 0 && !cleanupAndValidateQuestions()) {
      toast({
        title: "Validation Error",
        description: "Please fix the question errors before saving.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const isCreatingNewQuiz = !quiz && questions.length > 0;

      // Handle quiz changes first
      if (questions.length > 0) {
        if (quiz) {
          // Update existing quiz
          await handleUpdateQuiz();
        } else {
          // Create new quiz - this will show its own success toast
          await handleCreateQuiz();
        }
      }

      // Save video changes (only if not creating a new quiz to avoid duplicate toasts)
      if (!isCreatingNewQuiz) {
        await onSave(video.id, {
          title,
          description
        });
      }
      handleClose();
    } catch (error) {
      logger.error('Error updating video', error as Error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!video) return;
    setIsDeleting(true);
    try {
      await onDelete(video.id);
      setDeleteDialogOpen(false);
      handleClose();
    } catch (error) {
      logger.error('Error deleting video', error as Error);
    } finally {
      setIsDeleting(false);
    }
  };
  const handleClose = () => {
    // Clear all state
    setTitle('');
    setDescription('');
    setQuiz(null);
    setQuestions([]);
    setQuestionValidationErrors({});
    setShowQuizValidation(false);
    setQuizLoading(false);
    setIsCreatingQuiz(false);
    onOpenChange(false);
  };

  // Handle modal open/close events
  const handleOpenChange = (open: boolean) => {
    if (!open && hasQuizChanges()) {
      // Show unsaved changes dialog before closing
      setUnsavedChangesDialogOpen(true);
      return;
    }
    onOpenChange(open);

    // When opening, ensure quiz is loaded for the current video if not already
    if (open && video && !quiz && !quizLoading) {
      loadQuiz();
    }
  };

  // Check if there are unsaved quiz changes
  const hasQuizChanges = () => {
    if (!quiz && questions.length > 0) {
      return true; // New quiz being created
    }
    if (quiz) {
      return JSON.stringify(questions) !== JSON.stringify(originalQuestions);
    }
    return false;
  };

  // Handle cancel button click
  const handleCancel = () => {
    if (hasQuizChanges()) {
      // Show unsaved changes dialog
      setUnsavedChangesDialogOpen(true);
    } else {
      // No changes, just close
      onOpenChange(false);
    }
  };
  const handleDiscardChanges = () => {
    // Reset to original values
    if (quiz) {
      setQuestions(JSON.parse(JSON.stringify(originalQuestions)));
    } else {
      setQuestions([]);
    }
    setUnsavedChangesDialogOpen(false);
    onOpenChange(false);
  };
  const addQuestion = () => {
    const newQuestion: EditableQuestionFormData = {
      question_text: "",
      question_type: "multiple_choice",
      order_index: questions.length,
      options: [{
        option_text: "",
        is_correct: false,
        order_index: 0
      }, {
        option_text: "",
        is_correct: false,
        order_index: 1
      }]
    };
    setQuestions(prev => [...prev, newQuestion]);
    // Clear validation errors and reset validation display when adding questions
    setQuestionValidationErrors({});
    setShowQuizValidation(false);
  };
  const updateQuestion = (index: number, updates: Partial<EditableQuestionFormData>) => {
    setQuestions(prev => prev.map((q, i) => i === index ? {
      ...q,
      ...updates
    } : q));

    // Clear validation error for this question when it's updated
    if (questionValidationErrors[index]) {
      setQuestionValidationErrors(prev => {
        const newErrors = {
          ...prev
        };
        delete newErrors[index];
        return newErrors;
      });
    }

    // Reset validation display when question type changes
    if (updates.question_type) {
      setShowQuizValidation(false);

      // Initialize true/false options when switching to true_false type
      if (updates.question_type === 'true_false') {
        updates.options = [{
          option_text: 'True',
          is_correct: false,
          order_index: 0
        }, {
          option_text: 'False',
          is_correct: false,
          order_index: 1
        }];
      }
    }
  };
  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    // Clear all validation errors and reset validation display when removing questions
    setQuestionValidationErrors({});
    setShowQuizValidation(false);
  };
  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    const newOption: EditableOptionFormData = {
      option_text: "",
      is_correct: false,
      order_index: question.options.length
    };
    updateQuestion(questionIndex, {
      options: [...question.options, newOption]
    });
  };
  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<EditableOptionFormData>) => {
    const question = questions[questionIndex];
    const updatedOptions = question.options.map((option, i) => i === optionIndex ? {
      ...option,
      ...updates
    } : option);
    updateQuestion(questionIndex, {
      options: updatedOptions
    });
  };
  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];

    // Safety guard: prevent deletion if only 2 or fewer options remain for single_answer and multiple_choice
    if ((question.question_type === 'single_answer' || question.question_type === 'multiple_choice') && question.options.length <= 2) {
      return;
    }
    const updatedOptions = question.options.filter((_, i) => i !== optionIndex);

    // Ensure minimum options remain visible for single_answer and multiple_choice
    const finalOptions = question.question_type === 'single_answer' || question.question_type === 'multiple_choice' ? ensureMinOptions(updatedOptions, 2) : updatedOptions;
    updateQuestion(questionIndex, {
      options: finalOptions
    });
  };
  const handleUpdateQuiz = async () => {
    if (!quiz || !video) return;
    setIsCreatingQuiz(true);
    try {
      // Update quiz basic info (auto-derive title from video)
      await quizOperations.update(quiz.id, {
        title: sanitizeText(title),
        description: undefined
      });

      // Handle questions - delete removed ones, update existing ones, create new ones
      const existingQuestionIds = quiz.questions.map(q => q.id);
      const currentQuestionIds = questions.filter(q => q.id).map(q => q.id);

      // Delete removed questions
      const questionsToDelete = existingQuestionIds.filter(id => !currentQuestionIds.includes(id));
      for (const questionId of questionsToDelete) {
        await questionOperations.delete(questionId);
      }

      // Update or create questions
      for (const [index, questionData] of questions.entries()) {
        let question;
        if (questionData.id) {
          // Update existing question
          question = await questionOperations.update(questionData.id, {
            question_text: sanitizeText(questionData.question_text),
            question_type: questionData.question_type,
            order_index: index
          });
        } else {
          // Create new question
          question = await questionOperations.create({
            quiz_id: quiz.id,
            question_text: sanitizeText(questionData.question_text),
            question_type: questionData.question_type,
            order_index: index
          });
        }

        // Handle options for multiple choice questions
        if (questionData.question_type === 'multiple_choice' || questionData.question_type === 'single_answer') {
          const existingOptions = quiz.questions.find(q => q.id === question.id)?.options || [];
          const existingOptionIds = existingOptions.map(opt => opt.id);
          const currentOptionIds = questionData.options.filter(opt => opt.id).map(opt => opt.id);

          // Delete removed options
          const optionsToDelete = existingOptionIds.filter(id => !currentOptionIds.includes(id));
          for (const optionId of optionsToDelete) {
            await optionOperations.delete(optionId);
          }

          // Filter out empty options and update or create non-empty options
          const nonEmptyOptions = questionData.options.filter(opt => opt.option_text.trim());
          for (const [optionIndex, optionData] of nonEmptyOptions.entries()) {
            if (optionData.id) {
              // Update existing option
              await optionOperations.update(optionData.id, {
                option_text: sanitizeText(optionData.option_text),
                is_correct: optionData.is_correct,
                order_index: optionIndex
              });
            } else {
              // Create new option
              await optionOperations.create({
                question_id: question.id,
                option_text: sanitizeText(optionData.option_text),
                is_correct: optionData.is_correct,
                order_index: optionIndex
              });
            }
          }
        } else if (questionData.question_type === 'true_false') {
          if (!questionData.id) {
            // Create True/False options for new questions based on user selection
            const trueOption = questionData.options.find(opt => opt.option_text === 'True');
            const falseOption = questionData.options.find(opt => opt.option_text === 'False');
            await optionOperations.create({
              question_id: question.id,
              option_text: 'True',
              is_correct: trueOption?.is_correct || false,
              order_index: 0
            });
            await optionOperations.create({
              question_id: question.id,
              option_text: 'False',
              is_correct: falseOption?.is_correct || false,
              order_index: 1
            });
          } else {
            // Update existing True/False options
            const trueOption = questionData.options.find(opt => opt.option_text === 'True');
            const falseOption = questionData.options.find(opt => opt.option_text === 'False');
            if (trueOption?.id) {
              await optionOperations.update(trueOption.id, {
                option_text: 'True',
                is_correct: trueOption.is_correct,
                order_index: 0
              });
            }
            if (falseOption?.id) {
              await optionOperations.update(falseOption.id, {
                option_text: 'False',
                is_correct: falseOption.is_correct,
                order_index: 1
              });
            }
          }
        }
      }

      // Reload quiz data and update original state
      await loadQuiz();

      // Notify parent that quiz was saved
      if (video) onQuizSaved?.(video.id);
    } catch (error) {
      logger.error('Error updating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to update quiz",
        variant: "destructive"
      });
    } finally {
      setIsCreatingQuiz(false);
    }
  };
  const handleCreateQuiz = async () => {
    if (!video) return;

    if (questions.length === 0) {
      toast({
        title: "Please add at least one question",
        description: "Please add at least one question to create the quiz.",
        variant: "destructive"
      });
      return;
    }
    setIsCreatingQuiz(true);
    try {
      // Create the quiz (auto-derive title from video)
      const newQuiz = await quizOperations.create({
        title: sanitizeText(title),
        description: undefined,
        video_id: video.id
      });

      // Create questions and their options
      for (const [index, questionData] of questions.entries()) {
        const question = await questionOperations.create({
          quiz_id: newQuiz.id,
          question_text: sanitizeText(questionData.question_text),
          question_type: questionData.question_type,
          order_index: index
        });

        // Create options for multiple choice questions
        if (questionData.question_type === 'multiple_choice' || questionData.question_type === 'single_answer') {
          // Filter out empty options before creating
          const nonEmptyOptions = questionData.options.filter(opt => opt.option_text.trim());
          for (const [optionIndex, optionData] of nonEmptyOptions.entries()) {
            await optionOperations.create({
              question_id: question.id,
              option_text: sanitizeText(optionData.option_text),
              is_correct: optionData.is_correct,
              order_index: optionIndex
            });
          }
        } else if (questionData.question_type === 'true_false') {
          // Create True/False options based on user selection
          const trueOption = questionData.options.find(opt => opt.option_text === 'True');
          const falseOption = questionData.options.find(opt => opt.option_text === 'False');
          await optionOperations.create({
            question_id: question.id,
            option_text: 'True',
            is_correct: trueOption?.is_correct || false,
            order_index: 0
          });
          await optionOperations.create({
            question_id: question.id,
            option_text: 'False',
            is_correct: falseOption?.is_correct || false,
            order_index: 1
          });
        }
      }

      // Reload quiz data and update original state
      await loadQuiz();

      // Notify parent that quiz was saved
      if (video) onQuizSaved?.(video.id);
    } catch (error) {
      logger.error('Error creating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to create quiz",
        variant: "destructive"
      });
    } finally {
      setIsCreatingQuiz(false);
    }
  };
  const hasChanges = video && (title !== (video.title || '') || description !== (video.description || '') || !quiz && questions.length > 0 || quiz && (questions.length !== quiz.questions.length || questions.some((q, i) => {
    const originalQ = quiz.questions[i];
    return !originalQ || q.question_text !== originalQ.question_text || q.question_type !== originalQ.question_type || q.options.length !== originalQ.options.length || q.options.some((opt, j) => {
      const originalOpt = originalQ.options[j];
      return !originalOpt || opt.option_text !== originalOpt.option_text || opt.is_correct !== ('is_correct' in originalOpt ? originalOpt.is_correct : false);
    });
  })));
  if (!video) return null;

  // Convert to TrainingContent format for ContentPlayer
  const trainingContent: TrainingContent = {
    id: video.id,
    title: video.title,
    description: video.description || null,
    type: video.type as VideoType || 'Optional',
    video_url: video.video_url || null,
    video_file_name: video.video_file_name || null,
    thumbnail_url: video.thumbnail_url || null,
    content_type: video.content_type || 'video',
    // Default to video for backward compatibility
    completion_rate: video.completion_rate || 0,
    duration_seconds: video.duration_seconds || 0,
    created_at: video.created_at,
    updated_at: video.updated_at,
    archived_at: video.archived_at || null
  };

  // Check video URL type for source display only
  const isYouTube = video.video_url && isYouTubeUrl(video.video_url);
  const isGoogleDrive = video.video_url && isGoogleDriveUrl(video.video_url);
  const isFileUpload = video.video_file_name;
  const sourceUrl = video.video_url ? isYouTube ? getYouTubeWatchUrl(video.video_url as string) : isGoogleDrive ? getGoogleDriveViewUrl(video.video_url as string) : video.video_url : isFileUpload && video.video_file_name ? `https://wicbqqoudkaulltsjsvp.supabase.co/storage/v1/object/public/videos/${video.video_file_name}` : null;
  return <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>

          <DialogScrollArea>
            <Tabs defaultValue="info" className="w-full">
              <TabsList>
                <TabsTrigger value="info">Details</TabsTrigger>
                <TabsTrigger value="quiz" className="flex items-center gap-2">
                   Quiz
                   {questions.length > 0 && <Badge variant="soft-tertiary" className="text-xs">
                       {questions.length}
                     </Badge>}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-6 mt-4">
                {/* Video Preview Section */}
                <div className="space-y-3">
                  
                  <div className="border border-border-primary rounded-lg overflow-hidden bg-muted/30">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <ContentPlayer content={trainingContent} onProgressUpdate={() => {}} onComplete={() => {}} />
                     </div>
                   </div>
                   
                    {/* Content Source */}
                    <div className="text-left">
                      <span className="text-xs text-muted-foreground">
                        Content Source: {isYouTube ? 'YouTube' : isGoogleDrive ? trainingContent.content_type === 'presentation' ? 'Google Slides' : 'Google Drive' : isFileUpload ? 'Uploaded File' : 'External'}
                      </span>
                    </div>
                 </div>

                {/* Title Section */}
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Course Title</Label>
                  <Input id="edit-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter video title..." />
                </div>

                {/* Description Section */}
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description <span className="font-normal italic text-muted-foreground">(optional)</span></Label>
                  <Textarea id="edit-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter video description..." rows={4} />
                </div>

                {/* Video Info */}
                
              </TabsContent>

              <TabsContent value="quiz" className="space-y-6 mt-4">
                     <div className="space-y-4">

                      {questions.map((question, questionIndex) => <Card key={questionIndex} className="border-border">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">Question {questionIndex + 1}</CardTitle>
                              <Button onClick={() => removeQuestion(questionIndex)} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label>Question Type</Label>
                              <Select value={question.question_type} onValueChange={(value: any) => {
                          let newOptions = question.options;
                          if (value === 'true_false') {
                            newOptions = [{
                              option_text: 'True',
                              is_correct: false,
                              order_index: 0
                            }, {
                              option_text: 'False',
                              is_correct: false,
                              order_index: 1
                            }];
                          } else if (value === 'single_answer') {
                            // Ensure at least 2 options and only one correct
                            newOptions = ensureMinOptions(question.options, 2);
                            const correctCount = newOptions.filter(opt => opt.is_correct).length;
                            if (correctCount !== 1) {
                              // Set first option as correct if none or multiple are correct
                              newOptions = newOptions.map((opt, i) => ({
                                ...opt,
                                is_correct: i === 0
                              }));
                            }
                          } else if (value === 'multiple_choice') {
                            // Ensure at least 2 options
                            newOptions = ensureMinOptions(question.options, 2);
                          }
                          updateQuestion(questionIndex, {
                            question_type: value,
                            options: newOptions
                          });
                        }}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                  <SelectItem value="true_false">True/False</SelectItem>
                                  <SelectItem value="single_answer">Single Answer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Question Text</Label>
                              <Textarea value={question.question_text} onChange={e => updateQuestion(questionIndex, {
                          question_text: e.target.value
                        })} placeholder="Enter your question" className={cn(questionValidationErrors[questionIndex]?.includes('Question text is required') ? "border-destructive focus-visible:ring-destructive" : "")} />
                              {questionValidationErrors[questionIndex]?.includes('Question text is required') && <div className="text-sm text-destructive mt-1">
                                  Question text is required.
                                </div>}
                            </div>

                            {(question.question_type === 'multiple_choice' || question.question_type === 'single_answer') && <div className="space-y-3">
                                <Label>Answer Options</Label>
                                
                                 {question.question_type === 'single_answer' ? <div className="space-y-3">
                                    <RadioGroup value={question.options.find(opt => opt.is_correct)?.order_index?.toString() || ""} onValueChange={value => {
                            const selectedIndex = parseInt(value);
                            const updatedOptions = question.options.map((opt, i) => ({
                              ...opt,
                              is_correct: i === selectedIndex
                            }));
                            updateQuestion(questionIndex, {
                              options: updatedOptions
                            });
                          }} className="space-y-3">
                                     {question.options.map((option, optionIndex) => <div key={optionIndex} className="flex items-center gap-3">
                                         <Input value={option.option_text} onChange={e => updateOption(questionIndex, optionIndex, {
                                option_text: e.target.value
                              })} placeholder={`Option ${optionIndex + 1}`} className="flex-1" />
                                         
                                         <div className="flex items-center space-x-2">
                                           <RadioGroupItem value={optionIndex.toString()} id={`edit_question_${questionIndex}_option_${optionIndex}`} />
                                           <Label htmlFor={`edit_question_${questionIndex}_option_${optionIndex}`} className="whitespace-nowrap cursor-pointer">
                                             Correct
                                           </Label>
                                         </div>
                                         
                          {question.options.length > 2 && <Button onClick={() => removeOption(questionIndex, optionIndex)} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>}
                                       </div>)}
                                     </RadioGroup>
                                     
                                      {showQuizValidation && questionValidationErrors[questionIndex] && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                          {questionValidationErrors[questionIndex]}
                                        </div>}
                                      
                                  </div> : <div className="space-y-3">
                                     {question.options.map((option, optionIndex) => <div key={optionIndex} className="flex items-center gap-3">
                                         <Input value={option.option_text} onChange={e => updateOption(questionIndex, optionIndex, {
                              option_text: e.target.value
                            })} placeholder={`Option ${optionIndex + 1}`} className="flex-1" />
                                         
                                         <div className="flex items-center space-x-2">
                                           <Checkbox id={`edit_question_${questionIndex}_option_${optionIndex}`} checked={option.is_correct} onCheckedChange={checked => {
                                updateOption(questionIndex, optionIndex, {
                                  is_correct: checked as boolean
                                });
                              }} />
                                           <Label htmlFor={`edit_question_${questionIndex}_option_${optionIndex}`} className="whitespace-nowrap cursor-pointer">
                                             Correct
                                           </Label>
                                         </div>
                                         
                          {question.options.length > 2 && <Button onClick={() => removeOption(questionIndex, optionIndex)} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>}
                                       </div>)}
                                     
                                      {showQuizValidation && questionValidationErrors[questionIndex] && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                          {questionValidationErrors[questionIndex]}
                                        </div>}
                                      
                                   </div>}
                                
                                <Button onClick={() => addOption(questionIndex)} variant="outline" size="sm" className="justify-start">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Option
                                </Button>
                              </div>}

                            {question.question_type === 'true_false' && <div className="space-y-3">
                                <Label>Select Correct Answer</Label>
                                <div className="space-y-3">
                                  <div className="text-sm text-muted-foreground mb-2">
                                    Choose which option is correct:
                                  </div>
                                  <RadioGroup value={question.options.find(opt => opt.is_correct)?.option_text || ""} onValueChange={value => {
                            const updatedOptions = question.options.map(opt => ({
                              ...opt,
                              is_correct: opt.option_text === value
                            }));
                            updateQuestion(questionIndex, {
                              options: updatedOptions
                            });
                          }}>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="True" id={`edit_question_${questionIndex}_true`} />
                                      <Label htmlFor={`edit_question_${questionIndex}_true`} className="cursor-pointer">
                                        True
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="False" id={`edit_question_${questionIndex}_false`} />
                                      <Label htmlFor={`edit_question_${questionIndex}_false`} className="cursor-pointer">
                                        False
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                  
                                  {showQuizValidation && questionValidationErrors[questionIndex] && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                      {questionValidationErrors[questionIndex]}
                                    </div>}
                                </div>
                              </div>}
                          </CardContent>
                        </Card>)}

                      <Button onClick={addQuestion} variant="outline" size="sm" className="justify-start">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </Button>

                      {questions.length === 0 && <div className="text-center py-12 space-y-4">
                          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                            <FileQuestion className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-medium">No quiz questions yet</p>
                            <p className="text-muted-foreground">
                              Create questions to test understanding of this training video
                            </p>
                          </div>
                        </div>}
                    </div>
              </TabsContent>
            </Tabs>
          </DialogScrollArea>

          <DialogFooter className="!flex !flex-row !justify-between !items-center">
            <div className="flex items-center space-x-4">
              <ButtonWithTooltip
                variant="link"
                onClick={() => videoUsage?.canDelete && setDeleteDialogOpen(true)}
                className={cn(
                  "text-destructive hover:text-destructive p-0 h-auto font-normal transition-none",
                  videoUsage && !videoUsage.canDelete && "opacity-50"
                )}
                disabled={!videoUsage?.canDelete || usageLoading}
                tooltip={
                  videoUsage?.canDelete
                    ? quiz
                      ? "Delete Video and Quiz"
                      : "Delete Video"
                    : `Cannot delete: Assigned to ${videoUsage?.assignedCount} user${videoUsage?.assignedCount !== 1 ? 's' : ''}. Use Hide on Trainings tab instead.`
                }
                aria-label={
                  videoUsage?.canDelete
                    ? quiz
                      ? "Delete Video and Quiz"
                      : "Delete Video"
                    : `Cannot delete: Assigned to ${videoUsage?.assignedCount} user(s). Use Hide on Trainings tab instead.`
                }
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Video
              </ButtonWithTooltip>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{video?.title}"?
              {quiz && " This will also delete the associated quiz."}
              {" "}This video has not been assigned to any users. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Unsaved Changes Dialog */}
      <AlertDialog open={unsavedChangesDialogOpen} onOpenChange={setUnsavedChangesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to the quiz. Do you want to discard these changes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardChanges} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
};