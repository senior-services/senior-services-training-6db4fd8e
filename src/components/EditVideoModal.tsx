import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Play, FileVideo, Trash2, Copy, ExternalLink, Plus, FileQuestion } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { sanitizeText } from "@/utils/security";
import { isYouTubeUrl, isGoogleDriveUrl, getYouTubeVideoId, getGoogleDriveEmbedUrl, getGoogleDriveViewUrl, getYouTubeWatchUrl } from "@/utils/videoUtils";
import { quizOperations, questionOperations, optionOperations } from "@/services/quizService";
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
}
export const EditVideoModal = ({
  open,
  onOpenChange,
  video,
  onSave,
  onDelete
}: EditVideoModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [questions, setQuestions] = useState<EditableQuestionFormData[]>([]);
  
  // Track original quiz state for unsaved changes detection
  const [originalQuizTitle, setOriginalQuizTitle] = useState('');
  const [originalQuizDescription, setOriginalQuizDescription] = useState('');
  const [originalQuestions, setOriginalQuestions] = useState<EditableQuestionFormData[]>([]);
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  
  const { toast } = useToast();
  useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setDescription(video.description || '');
      loadQuiz();
    }
  }, [video]);

  const loadQuiz = async () => {
    if (!video) return;
    
    setQuizLoading(true);
    try {
      const quizData = await quizOperations.getByVideoId(video.id);
      setQuiz(quizData);
      if (quizData) {
        setQuizTitle(quizData.title);
        setQuizDescription(quizData.description || '');
        
        // Load existing questions into the editing form
        const loadedQuestions: EditableQuestionFormData[] = quizData.questions.map(q => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          order_index: q.order_index,
          options: q.options.map(opt => ({
            id: opt.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            order_index: opt.order_index
          }))
        }));
        setQuestions(loadedQuestions);
        
        // Store original values for unsaved changes detection
        setOriginalQuizTitle(quizData.title);
        setOriginalQuizDescription(quizData.description || '');
        setOriginalQuestions(JSON.parse(JSON.stringify(loadedQuestions)));
      } else {
        // No quiz found, ensure local state is cleared for this video
        setQuiz(null);
        setQuizTitle('');
        setQuizDescription('');
        setQuestions([]);
        
        // Clear original values too
        setOriginalQuizTitle('');
        setOriginalQuizDescription('');
        setOriginalQuestions([]);
      }
    } catch (error) {
      console.log('No quiz found for this video:', error);
    } finally {
      setQuizLoading(false);
    }
  };
  const handleSave = async () => {
    if (!video) return;
    setLoading(true);
    try {
      const isCreatingNewQuiz = !quiz && (quizTitle.trim() || questions.length > 0);
      
      // Handle quiz changes first
      if (quizTitle.trim() || questions.length > 0) {
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
    setQuizTitle('');
    setQuizDescription('');
    setQuestions([]);
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
    if (!quiz && (quizTitle.trim() || questions.length > 0)) {
      return true; // New quiz being created
    }
    
    if (quiz) {
      return (
        quizTitle !== originalQuizTitle ||
        quizDescription !== originalQuizDescription ||
        JSON.stringify(questions) !== JSON.stringify(originalQuestions)
      );
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
      setQuizTitle(originalQuizTitle);
      setQuizDescription(originalQuizDescription);
      setQuestions(JSON.parse(JSON.stringify(originalQuestions)));
    } else {
      setQuizTitle('');
      setQuizDescription('');
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
      options: []
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<EditableQuestionFormData>) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, ...updates } : q
    ));
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
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
    const updatedOptions = question.options.map((option, i) => 
      i === optionIndex ? { ...option, ...updates } : option
    );
    
    updateQuestion(questionIndex, { options: updatedOptions });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    const updatedOptions = question.options.filter((_, i) => i !== optionIndex);
    
    updateQuestion(questionIndex, { options: updatedOptions });
  };

  const handleUpdateQuiz = async () => {
    if (!quiz || !video) return;
    
    setIsCreatingQuiz(true);
    try {
      // Update quiz basic info
      await quizOperations.update(quiz.id, {
        title: sanitizeText(quizTitle),
        description: sanitizeText(quizDescription) || undefined
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

          // Update or create options
          for (const [optionIndex, optionData] of questionData.options.entries()) {
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
        } else if (questionData.question_type === 'true_false' && !questionData.id) {
          // Only create True/False options for new true/false questions
          await optionOperations.create({
            question_id: question.id,
            option_text: 'True',
            is_correct: true,
            order_index: 0
          });
          await optionOperations.create({
            question_id: question.id,
            option_text: 'False',
            is_correct: false,
            order_index: 1
          });
        }
      }

      toast({
        title: "Success",
        description: "Quiz updated successfully",
      });
      
      // Reload quiz data and update original state
      await loadQuiz();
    } catch (error) {
      logger.error('Error updating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to update quiz",
        variant: "destructive",
      });
    } finally {
      setIsCreatingQuiz(false);
    }
  };
  const handleCreateQuiz = async () => {
    if (!video) return;
    
    setIsCreatingQuiz(true);
    try {
      // Create the quiz
      const newQuiz = await quizOperations.create({
        title: sanitizeText(quizTitle),
        description: sanitizeText(quizDescription) || undefined,
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
          for (const [optionIndex, optionData] of questionData.options.entries()) {
            await optionOperations.create({
              question_id: question.id,
              option_text: sanitizeText(optionData.option_text),
              is_correct: optionData.is_correct,
              order_index: optionIndex
            });
          }
        } else if (questionData.question_type === 'true_false') {
          // Create True/False options
          await optionOperations.create({
            question_id: question.id,
            option_text: 'True',
            is_correct: true,
            order_index: 0
          });
          await optionOperations.create({
            question_id: question.id,
            option_text: 'False',
            is_correct: false,
            order_index: 1
          });
        }
      }

      toast({
        title: "Success",
        description: "Quiz created successfully",
      });
      
      // Reload quiz data and update original state
      await loadQuiz();
    } catch (error) {
      logger.error('Error creating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to create quiz",
        variant: "destructive",
      });
    } finally {
      setIsCreatingQuiz(false);
    }
  };
  const hasChanges = video && (
    title !== (video.title || '') || 
    description !== (video.description || '') ||
    (!quiz && (quizTitle.trim() || questions.length > 0)) ||
    (quiz && (
      quizTitle !== quiz.title || 
      quizDescription !== (quiz.description || '') ||
      questions.length !== quiz.questions.length ||
      questions.some((q, i) => {
        const originalQ = quiz.questions[i];
        return !originalQ || 
               q.question_text !== originalQ.question_text ||
               q.question_type !== originalQ.question_type ||
               q.options.length !== originalQ.options.length ||
               q.options.some((opt, j) => {
                 const originalOpt = originalQ.options[j];
                 return !originalOpt ||
                        opt.option_text !== originalOpt.option_text ||
                        opt.is_correct !== originalOpt.is_correct;
               });
      })
    ))
  );
  if (!video) return null;

  // Check video URL type using utility functions
  const isYouTube = video.video_url && isYouTubeUrl(video.video_url);
  const isGoogleDrive = video.video_url && isGoogleDriveUrl(video.video_url);
  const isFileUpload = video.video_file_name;
  const youtubeVideoId = isYouTube && video.video_url ? getYouTubeVideoId(video.video_url) : null;
  const googleDriveEmbedUrl = isGoogleDrive && video.video_url ? getGoogleDriveEmbedUrl(video.video_url) : null;
  const storageUrl = isFileUpload && video.video_file_name 
    ? `https://wicbqqoudkaulltsjsvp.supabase.co/storage/v1/object/public/videos/${video.video_file_name}` 
    : null;
  const sourceUrl = video.video_url
    ? (isYouTube ? getYouTubeWatchUrl(video.video_url as string)
      : isGoogleDrive ? getGoogleDriveViewUrl(video.video_url as string)
      : video.video_url)
    : storageUrl;
  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Edit Training Video</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Video Info</TabsTrigger>
                <TabsTrigger value="quiz" className="flex items-center gap-2">
                  Quiz
                  {questions.length > 0 && (
                    <Badge variant="hollow-primary" className="text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                      {questions.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-6 mt-6">
                {/* Video Preview Section */}
                <div className="space-y-3">
                  
                  <div className="border border-border-primary rounded-lg overflow-hidden bg-muted/30">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      {isYouTube && youtubeVideoId ? <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${youtubeVideoId}`} title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="w-full h-full" /> : isGoogleDrive && googleDriveEmbedUrl ? <iframe width="100%" height="100%" src={googleDriveEmbedUrl} title={video.title} frameBorder="0" allowFullScreen className="w-full h-full" /> : video.video_url ? <video className="w-full h-full" controls preload="metadata" poster={video.thumbnail_url || undefined}>
                          <source src={video.video_url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video> : isFileUpload ? <video className="w-full h-full" controls preload="metadata" poster={video.thumbnail_url || undefined}>
                          <source src={`https://wicbqqoudkaulltsjsvp.supabase.co/storage/v1/object/public/videos/${video.video_file_name}`} type="video/mp4" />
                          <source src={`https://wicbqqoudkaulltsjsvp.supabase.co/storage/v1/object/public/videos/${video.video_file_name}`} type="video/quicktime" />
                          Your browser does not support the video tag.
                        </video> : <div className="w-full h-full bg-muted flex items-center justify-center">
                          <div className="text-center space-y-3">
                            <Play className="w-16 h-16 text-muted-foreground mx-auto" />
                            <div>
                              <p className="font-medium text-foreground">No video source available</p>
                              <p className="text-sm text-muted-foreground">
                                Add a video URL or upload a file to enable playback
                              </p>
                            </div>
                          </div>
                        </div>}
                     </div>
                   </div>
                   
                    {/* Video Source */}
                    <div className="text-left">
                      <span className="text-xs text-muted-foreground">
                        Video Source: {isYouTube ? 'YouTube' : 
                         isGoogleDrive ? 'Google Drive' : 
                         isFileUpload ? 'Uploaded File' : 
                         'External'}
                      </span>
                    </div>
                 </div>

                {/* Title Section */}
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Video Title</Label>
                  <Input id="edit-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter video title..." />
                </div>

                {/* Description Section */}
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="edit-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter video description..." rows={4} />
                </div>

                {/* Video Info */}
                
              </TabsContent>

              <TabsContent value="quiz" className="space-y-6 mt-6">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      {quiz ? 'Edit Quiz' : 'Create Quiz'}
                    </h3>
                    
                    <div>
                      <Label htmlFor="quiz-title">Quiz Title</Label>
                      <Input
                        id="quiz-title"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        placeholder="Enter quiz title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="quiz-description">Description (Optional)</Label>
                      <Textarea
                        id="quiz-description"
                        value={quizDescription}
                        onChange={(e) => setQuizDescription(e.target.value)}
                        placeholder="Enter quiz description"
                      />
                    </div>
                  </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Questions</h3>
                        <Button onClick={addQuestion} variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Question
                        </Button>
                      </div>

                      {questions.map((question, questionIndex) => (
                        <Card key={questionIndex} className="border-border">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">Question {questionIndex + 1}</CardTitle>
                              <Button
                                onClick={() => removeQuestion(questionIndex)}
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label>Question Type</Label>
                              <Select
                                value={question.question_type}
                                onValueChange={(value: any) => {
                                  updateQuestion(questionIndex, { 
                                    question_type: value,
                                    options: value === 'true_false' ? [] : question.options
                                  });
                                }}
                              >
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
                              <Textarea
                                value={question.question_text}
                                onChange={(e) => updateQuestion(questionIndex, { question_text: e.target.value })}
                                placeholder="Enter your question"
                              />
                            </div>

                            {(question.question_type === 'multiple_choice' || question.question_type === 'single_answer') && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label>Answer Options</Label>
                                  <Button
                                    onClick={() => addOption(questionIndex)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Option
                                  </Button>
                                </div>
                                
                                {question.question_type === 'single_answer' ? (
                                  <RadioGroup
                                    value={question.options.find(opt => opt.is_correct)?.order_index?.toString() || ""}
                                    onValueChange={(value) => {
                                      const selectedIndex = parseInt(value);
                                      const updatedOptions = question.options.map((opt, i) => ({
                                        ...opt,
                                        is_correct: i === selectedIndex
                                      }));
                                      updateQuestion(questionIndex, { options: updatedOptions });
                                    }}
                                    className="space-y-3"
                                  >
                                    {question.options.map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center gap-2 p-3 border rounded">
                                        <Input
                                          value={option.option_text}
                                          onChange={(e) => updateOption(questionIndex, optionIndex, { option_text: e.target.value })}
                                          placeholder={`Option ${optionIndex + 1}`}
                                          className="flex-1"
                                        />
                                        
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem 
                                            value={optionIndex.toString()}
                                            id={`edit_question_${questionIndex}_option_${optionIndex}`} 
                                          />
                                          <Label 
                                            htmlFor={`edit_question_${questionIndex}_option_${optionIndex}`} 
                                            className="whitespace-nowrap cursor-pointer"
                                          >
                                            Correct
                                          </Label>
                                        </div>
                                        
                                        <Button
                                          onClick={() => removeOption(questionIndex, optionIndex)}
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </RadioGroup>
                                ) : (
                                  <div className="space-y-3">
                                    {question.options.map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center gap-2 p-3 border rounded">
                                        <Input
                                          value={option.option_text}
                                          onChange={(e) => updateOption(questionIndex, optionIndex, { option_text: e.target.value })}
                                          placeholder={`Option ${optionIndex + 1}`}
                                          className="flex-1"
                                        />
                                        
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`edit_question_${questionIndex}_option_${optionIndex}`}
                                            checked={option.is_correct}
                                            onCheckedChange={(checked) => {
                                              updateOption(questionIndex, optionIndex, { is_correct: checked as boolean });
                                            }}
                                          />
                                          <Label 
                                            htmlFor={`edit_question_${questionIndex}_option_${optionIndex}`} 
                                            className="whitespace-nowrap cursor-pointer"
                                          >
                                            Correct
                                          </Label>
                                        </div>
                                        
                                        <Button
                                          onClick={() => removeOption(questionIndex, optionIndex)}
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {question.question_type === 'true_false' && (
                              <div className="text-sm text-muted-foreground">
                                True/False questions will be automatically generated with "True" and "False" options.
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      {questions.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          No questions added yet. Click "Add Question" to get started.
                        </p>
                      )}
                    </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="!flex !flex-row !justify-between !items-center shrink-0">
            <Button variant="link" onClick={() => setDeleteDialogOpen(true)} className="text-destructive hover:text-destructive p-0 h-auto font-normal">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Video
            </Button>
            
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
              Are you sure you want to delete "{video?.title}"? This action cannot be undone.
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
    </>
  );
};