import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import type { Video } from "@/types";
import type { QuizWithQuestions } from "@/types/quiz";

interface CompletionOverlayProps {
  video: Video | null;
  quiz: QuizWithQuestions | null;
  onStartQuiz: () => void;
  onCompleteTraining: () => void;
}

export function CompletionOverlay({ video, quiz, onStartQuiz, onCompleteTraining }: CompletionOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
      <div className="bg-card rounded-xl p-8 max-w-md mx-4 text-center shadow-xl border animate-scale-in">
        <div className="mb-4">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Video Completed! 🎉
          </h3>
          <p className="text-muted-foreground">
            You've finished watching "{video?.title}"
          </p>
        </div>
        
        {quiz && quiz.questions && quiz.questions.length > 0 ? (
          <Button 
            onClick={onStartQuiz}
            className="w-full"
          >
            Start Quiz to Complete Training
          </Button>
        ) : (
          <Button 
            onClick={onCompleteTraining}
            className="w-full"
          >
            Complete Training
          </Button>
        )}
      </div>
    </div>
  );
}