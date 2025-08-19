import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, FileVideo, Trash2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface VideoData {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_file_name: string | null;
  thumbnail_url?: string | null;
  type: string;
  has_quiz: boolean;
  assigned_to: number;
  completion_rate: number;
  created_at: string;
  updated_at: string;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'single_choice' | 'true_false';
  order_index: number;
  options: QuizQuestionOption[];
}

interface QuizQuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

interface Quiz {
  id: string;
  video_id: string;
  title: string;
  description: string | null;
  questions: QuizQuestion[];
}

interface EditVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: VideoData | null;
  onSave: (videoId: string, updates: { title: string; description: string }) => Promise<void>;
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('video');
  
  // Quiz state
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  
  const { toast } = useToast();

  // Update form when video changes
  useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setDescription(video.description || '');
      fetchQuiz(video.id);
    }
  }, [video]);

  const fetchQuiz = async (videoId: string) => {
    setLoadingQuiz(true);
    try {
      // Fetch quiz with questions and options
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          *,
          quiz_questions (
            *,
            quiz_question_options (*)
          )
        `)
        .eq('video_id', videoId)
        .maybeSingle();

      if (quizError && quizError.code !== 'PGRST116') {
        console.error('Error fetching quiz:', quizError);
        toast({
          title: "Error",
          description: "Failed to load quiz data.",
          variant: "destructive",
        });
        return;
      }

      if (quizData) {
        const formattedQuestions = quizData.quiz_questions
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((q: any) => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            order_index: q.order_index,
            options: q.quiz_question_options
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map((opt: any) => ({
                id: opt.id,
                option_text: opt.option_text,
                is_correct: opt.is_correct,
                order_index: opt.order_index,
              }))
          }));
        
        const formattedQuiz: Quiz = {
          id: quizData.id,
          video_id: quizData.video_id,
          title: quizData.title,
          description: quizData.description,
          questions: formattedQuestions
        };
        
        setQuiz(formattedQuiz);
        setQuizTitle(quizData.title);
        setQuizDescription(quizData.description || '');
        setQuestions(formattedQuestions);
      } else {
        // No quiz exists, reset state
        setQuiz(null);
        setQuizTitle('');
        setQuizDescription('');
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz data.",
        variant: "destructive",
      });
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSave = async () => {
    if (!video) return;
    
    setIsSaving(true);
    try {
      await onSave(video.id, { title, description });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating video:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!video) return;
    
    setIsDeleting(true);
    try {
      await onDelete(video.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting video:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Quiz management functions
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `temp-${Date.now()}`,
      question_text: '',
      question_type: 'single_choice',
      order_index: questions.length,
      options: [
        { id: `temp-opt-${Date.now()}-1`, option_text: '', is_correct: false, order_index: 0 },
        { id: `temp-opt-${Date.now()}-2`, option_text: '', is_correct: true, order_index: 1 },
      ]
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionIndex: number) => {
    setQuestions(questions.filter((_, index) => index !== questionIndex));
  };

  const updateQuestion = (questionIndex: number, updates: Partial<QuizQuestion>) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], ...updates };
    
    // If changing question type, update options accordingly
    if (updates.question_type) {
      const question = updatedQuestions[questionIndex];
      if (updates.question_type === 'true_false') {
        question.options = [
          { id: `temp-opt-${Date.now()}-true`, option_text: 'True', is_correct: true, order_index: 0 },
          { id: `temp-opt-${Date.now()}-false`, option_text: 'False', is_correct: false, order_index: 1 },
        ];
      } else if (question.options.length === 2 && question.options[0].option_text === 'True') {
        // Converting from true/false, reset options
        question.options = [
          { id: `temp-opt-${Date.now()}-1`, option_text: '', is_correct: false, order_index: 0 },
          { id: `temp-opt-${Date.now()}-2`, option_text: '', is_correct: true, order_index: 1 },
        ];
      }
    }
    
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    const newOption: QuizQuestionOption = {
      id: `temp-opt-${Date.now()}`,
      option_text: '',
      is_correct: false,
      order_index: question.options.length
    };
    question.options.push(newOption);
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter((_, index) => index !== optionIndex);
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<QuizQuestionOption>) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    
    // If this option is being set as correct and it's single choice, unset others
    if (updates.is_correct && question.question_type === 'single_choice') {
      question.options.forEach((opt, idx) => {
        if (idx !== optionIndex) opt.is_correct = false;
      });
    }
    
    question.options[optionIndex] = { ...question.options[optionIndex], ...updates };
    setQuestions(updatedQuestions);
  };

  const saveQuiz = async () => {
    if (!video) return;
    
    try {
      setIsSaving(true);
      
      let quizId: string;
      
      if (quiz) {
        // Update existing quiz
        const { error: quizError } = await supabase
          .from('quizzes')
          .update({
            title: quizTitle,
            description: quizDescription,
          })
          .eq('id', quiz.id);

        if (quizError) throw quizError;
        
        // Delete existing questions and options (cascade will handle options)
        const { error: deleteError } = await supabase
          .from('quiz_questions')
          .delete()
          .eq('quiz_id', quiz.id);

        if (deleteError) throw deleteError;
        quizId = quiz.id;
      } else {
        // Create new quiz
        const { data: newQuiz, error: quizError } = await supabase
          .from('quizzes')
          .insert({
            video_id: video.id,
            title: quizTitle,
            description: quizDescription,
          })
          .select()
          .single();

        if (quizError) throw quizError;
        
        const formattedQuiz: Quiz = {
          id: newQuiz.id,
          video_id: newQuiz.video_id,
          title: newQuiz.title,
          description: newQuiz.description,
          questions: []
        };
        
        setQuiz(formattedQuiz);
        quizId = newQuiz.id;
      }

      // Insert questions and options
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const { data: newQuestion, error: questionError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quizId,
            question_text: question.question_text,
            question_type: question.question_type,
            order_index: i,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Insert options
        const optionsToInsert = question.options.map((option, optionIndex) => ({
          question_id: newQuestion.id,
          option_text: option.option_text,
          is_correct: option.is_correct,
          order_index: optionIndex,
        }));

        const { error: optionsError } = await supabase
          .from('quiz_question_options')
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      // Update video has_quiz status
      const { error: videoError } = await supabase
        .from('videos')
        .update({ has_quiz: questions.length > 0 })
        .eq('id', video.id);

      if (videoError) throw videoError;

      toast({
        title: "Quiz Saved",
        description: "Quiz has been successfully saved.",
      });

      // Refresh quiz data
      fetchQuiz(video.id);
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: "Error",
        description: "Failed to save quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteQuiz = async () => {
    if (!video || !quiz) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quiz.id);

      if (error) throw error;

      // Update video has_quiz status
      const { error: videoError } = await supabase
        .from('videos')
        .update({ has_quiz: false })
        .eq('id', video.id);

      if (videoError) throw videoError;

      toast({
        title: "Quiz Deleted",
        description: "Quiz has been successfully deleted.",
      });

      // Reset quiz state
      setQuiz(null);
      setQuizTitle('');
      setQuizDescription('');
      setQuestions([]);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (video) {
      setTitle(video.title || '');
      setDescription(video.description || '');
    }
    onOpenChange(false);
  };

  // Check if there are unsaved changes
  const hasChanges = video && (
    title !== (video.title || '') || 
    description !== (video.description || '')
  );

  if (!video) return null;

  // Determine video source and type
  const isYouTubeUrl = video.video_url && (
    video.video_url.includes('youtube.com/watch') || 
    video.video_url.includes('youtu.be/')
  );
  const isDriveUrl = video.video_url && video.video_url.includes('drive.google.com');
  const isFileUpload = video.video_file_name;

  // Extract YouTube video ID for embedding
  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    console.log('YouTube URL parsing:', { url, match, videoId: match?.[1] });
    return match ? match[1] : null;
  };

  const youtubeVideoId = isYouTubeUrl && video.video_url ? getYouTubeVideoId(video.video_url) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Edit Training Video</DialogTitle>
            <DialogDescription>
              Preview, edit details, or manage this training video.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="video">Video Info</TabsTrigger>
              <TabsTrigger value="quiz" className="relative">
                Quiz
                {video.has_quiz && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="video" className="flex-1 overflow-y-auto p-1 mt-4 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="space-y-6">
                {/* Video Preview Section */}
                <div className="space-y-3">
                  <Label>Video Preview</Label>
                  <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
                    {isYouTubeUrl && youtubeVideoId ? (
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                          title={video.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    ) : video.video_url && !isYouTubeUrl && !isDriveUrl ? (
                      <div className="relative aspect-video bg-black">
                        <video 
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                        >
                          <source src={video.video_url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : isYouTubeUrl ? (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center p-4">
                        <div className="text-center space-y-2">
                          <Play className="w-8 h-8 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">YouTube Video</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {video.video_url}
                          </p>
                          {video.video_url && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(video.video_url!, '_blank')}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Open Video
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : isDriveUrl ? (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center p-4">
                        <div className="text-center space-y-2">
                          <FileVideo className="w-8 h-8 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">Google Drive Video</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {video.video_url}
                          </p>
                          {video.video_url && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(video.video_url!, '_blank')}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Open Video
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : isFileUpload ? (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center p-4">
                        <div className="text-center space-y-2">
                          <FileVideo className="w-8 h-8 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">Uploaded Video File</p>
                          <p className="text-xs text-muted-foreground">
                            {video.video_file_name}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center p-4">
                        <div className="text-center space-y-2">
                          <FileVideo className="w-8 h-8 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">Video source not available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title Section */}
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Video Title</Label>
                  <Input 
                    id="edit-title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title..."
                  />
                </div>

                {/* Description Section */}
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea 
                    id="edit-description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter video description..."
                    rows={4}
                  />
                </div>

                {/* Video Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground">Type</p>
                    <p className="text-foreground">{video.type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground">Has Quiz</p>
                    <p className="text-foreground">{video.has_quiz ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground">Assigned To</p>
                    <p className="text-foreground">{video.assigned_to} employees</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground">Completion Rate</p>
                    <p className="text-foreground">{video.completion_rate}%</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quiz" className="flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col mt-4">
              {loadingQuiz ? (
                <div className="flex items-center justify-center py-12">
                  <div className="space-y-2 text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Loading quiz...</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-4 p-1">
                    {/* Quiz Header */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="quiz-title">Quiz Title</Label>
                        <Input
                          id="quiz-title"
                          value={quizTitle}
                          onChange={(e) => setQuizTitle(e.target.value)}
                          placeholder="Enter quiz title..."
                        />
                      </div>
                      {quiz && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={deleteQuiz}
                          disabled={isDeleting}
                          className="ml-4"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {isDeleting ? 'Deleting...' : 'Delete Quiz'}
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quiz-description">Quiz Description</Label>
                      <Textarea
                        id="quiz-description"
                        value={quizDescription}
                        onChange={(e) => setQuizDescription(e.target.value)}
                        placeholder="Enter quiz description..."
                        rows={2}
                      />
                    </div>

                    {/* Questions */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-medium">Questions</h4>
                        <Button onClick={addQuestion} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Question
                        </Button>
                      </div>

                      {questions.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 text-center">
                            <p className="text-muted-foreground">No questions added yet.</p>
                            <p className="text-sm text-muted-foreground mt-1">Click "Add Question" to get started.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {questions.map((question, questionIndex) => (
                            <Card key={question.id}>
                              <CardHeader>
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-base">Question {questionIndex + 1}</CardTitle>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeQuestion(questionIndex)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {/* Question Text */}
                                <div className="space-y-2">
                                  <Label>Question Text</Label>
                                  <Textarea
                                    value={question.question_text}
                                    onChange={(e) => updateQuestion(questionIndex, { question_text: e.target.value })}
                                    placeholder="Enter your question..."
                                    rows={2}
                                  />
                                </div>

                                {/* Question Type */}
                                <div className="space-y-2">
                                  <Label>Question Type</Label>
                                  <Select
                                    value={question.question_type}
                                    onValueChange={(value: 'multiple_choice' | 'single_choice' | 'true_false') => 
                                      updateQuestion(questionIndex, { question_type: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="single_choice">Single Choice</SelectItem>
                                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                      <SelectItem value="true_false">True/False</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Options */}
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <Label>Answer Options</Label>
                                    {question.question_type !== 'true_false' && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addOption(questionIndex)}
                                      >
                                        <Plus className="w-3 h-3 mr-2" />
                                        Add Option
                                      </Button>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    {question.options.map((option, optionIndex) => (
                                      <div key={option.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={option.is_correct}
                                          onCheckedChange={(checked) =>
                                            updateOption(questionIndex, optionIndex, { is_correct: !!checked })
                                          }
                                        />
                                        <Input
                                          value={option.option_text}
                                          onChange={(e) =>
                                            updateOption(questionIndex, optionIndex, { option_text: e.target.value })
                                          }
                                          placeholder="Enter option text..."
                                          className="flex-1"
                                          disabled={question.question_type === 'true_false'}
                                        />
                                        {question.question_type !== 'true_false' && question.options.length > 2 && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeOption(questionIndex, optionIndex)}
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  {question.question_type === 'single_choice' && (
                                    <p className="text-xs text-muted-foreground">
                                      Select one correct answer
                                    </p>
                                  )}
                                  {question.question_type === 'multiple_choice' && (
                                    <p className="text-xs text-muted-foreground">
                                      Select all correct answers
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Save Quiz Button */}
                    {questions.length > 0 && (
                      <div className="pt-4 border-t">
                        <Button onClick={saveQuiz} disabled={isSaving} className="w-full">
                          {isSaving ? 'Saving Quiz...' : 'Save Quiz'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between shrink-0">
            <Button 
              variant="link" 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive p-0 h-auto font-normal"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Video
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{video?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};