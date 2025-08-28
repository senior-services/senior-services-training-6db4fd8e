import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileQuestion } from 'lucide-react';
import { CreateQuizModal, QuizFormData } from '@/components/quiz/CreateQuizModal';
import { quizOperations, questionOperations, optionOperations } from '@/services/quizService';
import { videoOperations } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { sanitizeText } from '@/utils/security';
import type { Video } from '@/types';

export const QuizManagement: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const res = await videoOperations.getAll();
      if (res.success) {
        setVideos(res.data || []);
      }
    } catch (error) {
      logger.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = (video: Video) => {
    setSelectedVideo(video);
    setShowCreateQuiz(true);
  };

  const handleQuizSubmit = async (quizData: QuizFormData) => {
    if (!selectedVideo) return;
    
    setIsCreatingQuiz(true);
    try {
      const quiz = await quizOperations.create({
        title: sanitizeText(quizData.title),
        description: sanitizeText(quizData.description) || undefined,
        video_id: selectedVideo.id
      });

      // Create questions and options
      for (const [index, questionData] of quizData.questions.entries()) {
        const question = await questionOperations.create({
          quiz_id: quiz.id,
          question_text: sanitizeText(questionData.question_text),
          question_type: questionData.question_type,
          order_index: index
        });

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
      
      setShowCreateQuiz(false);
      setSelectedVideo(null);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            Quiz Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {videos.map((video) => (
              <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{video.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">No Quiz</Badge>
                  <Button
                    onClick={() => handleCreateQuiz(video)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Quiz
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showCreateQuiz && selectedVideo && (
        <CreateQuizModal
          open={showCreateQuiz}
          onOpenChange={setShowCreateQuiz}
          onSubmit={handleQuizSubmit}
          videoId={selectedVideo.id}
          isSubmitting={isCreatingQuiz}
        />
      )}
    </div>
  );
};