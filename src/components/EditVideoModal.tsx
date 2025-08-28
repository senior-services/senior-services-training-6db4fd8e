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
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
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
      await onSave(video.id, {
        title,
        description
      });
      onOpenChange(false);
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
      onOpenChange(false);
    } catch (error) {
      logger.error('Error deleting video', error as Error);
    } finally {
      setIsDeleting(false);
    }
  };
  const handleClose = () => {
    setTitle('');
    setDescription('');
    setQuiz(null);
    setQuizTitle('');
    setQuizDescription('');
    setQuestions([]);
    onOpenChange(false);
  };

  const addQuestion = () => {
    const newQuestion: QuestionFormData = {
      question_text: "",
      question_type: "multiple_choice",
      order_index: questions.length,
      options: []
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<QuestionFormData>) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, ...updates } : q
    ));
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    const newOption: OptionFormData = {
      option_text: "",
      is_correct: false,
      order_index: question.options.length
    };
    
    updateQuestion(questionIndex, {
      options: [...question.options, newOption]
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<OptionFormData>) => {
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
        if (questionData.question_type === 'multiple_choice') {
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
      
      // Reload quiz data
      loadQuiz();
      setQuizTitle('');
      setQuizDescription('');
      setQuestions([]);
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
  const hasChanges = video && (title !== (video.title || '') || description !== (video.description || ''));
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
  return <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Edit Training Video</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Video Info</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
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
                {quiz ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileQuestion className="h-5 w-5" />
                        Existing Quiz: {quiz.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-muted-foreground">{quiz.description}</p>
                        <Badge variant="outline">
                          {quiz.questions.length} Question{quiz.questions.length !== 1 ? 's' : ''}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Quiz editing functionality will be added in a future update.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileQuestion className="h-5 w-5" />
                        Create Quiz
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
                              <Label>Question Text</Label>
                              <Textarea
                                value={question.question_text}
                                onChange={(e) => updateQuestion(questionIndex, { question_text: e.target.value })}
                                placeholder="Enter your question"
                              />
                            </div>

                            <div>
                              <Label>Question Type</Label>
                              <Select
                                value={question.question_type}
                                onValueChange={(value: any) => {
                                  updateQuestion(questionIndex, { 
                                    question_type: value,
                                    options: value === 'single_answer' ? [] : question.options
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

                            {question.question_type === 'multiple_choice' && (
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
                                
                                {question.options.map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex items-center gap-2 p-3 border rounded">
                                    <Input
                                      value={option.option_text}
                                      onChange={(e) => updateOption(questionIndex, optionIndex, { option_text: e.target.value })}
                                      placeholder={`Option ${optionIndex + 1}`}
                                      className="flex-1"
                                    />
                                    <label className="flex items-center gap-2 whitespace-nowrap">
                                      <input
                                        type="checkbox"
                                        checked={option.is_correct}
                                        onChange={(e) => updateOption(questionIndex, optionIndex, { is_correct: e.target.checked })}
                                        className="rounded"
                                      />
                                      Correct
                                    </label>
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

                            {question.question_type === 'true_false' && (
                              <div className="text-sm text-muted-foreground">
                                True/False questions will be automatically generated with "True" and "False" options.
                              </div>
                            )}

                            {question.question_type === 'single_answer' && (
                              <div className="text-sm text-muted-foreground">
                                Single answer questions require manual grading by administrators.
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      {questions.length > 0 && (
                        <Button
                          onClick={handleCreateQuiz}
                          disabled={!quizTitle.trim() || questions.length === 0 || 
                            questions.some(q => !q.question_text.trim() || 
                              (q.question_type === 'multiple_choice' && q.options.length < 2)) || 
                            isCreatingQuiz}
                          className="w-full"
                        >
                          {isCreatingQuiz ? "Creating..." : "Create Quiz"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="!flex !flex-row !justify-between !items-center shrink-0">
            <Button variant="link" onClick={() => setDeleteDialogOpen(true)} className="text-destructive hover:text-destructive p-0 h-auto font-normal">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Video
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleClose}>
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
    </>;
};