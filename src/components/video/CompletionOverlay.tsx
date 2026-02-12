import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";
import { TrainingAttestation } from "@/components/shared/TrainingAttestation";
import type { Video } from "@/types";
import type { QuizWithQuestions } from "@/types/quiz";

interface CompletionOverlayProps {
  video: Video | null;
  quiz: QuizWithQuestions | null;
  onStartQuiz: () => void;
  onCompleteTraining: () => void;
  onClose?: () => void;
}

export function CompletionOverlay({ video, quiz, onStartQuiz, onCompleteTraining, onClose }: CompletionOverlayProps) {
  const [attestationChecked, setAttestationChecked] = useState(false);
  const hasQuiz = quiz && quiz.questions && quiz.questions.length > 0;

  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
      <div className="bg-card rounded-xl p-8 max-w-md mx-4 text-center shadow-xl border animate-scale-in relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close overlay"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="mb-4">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-2">
            Video Completed! 🎉
          </h3>
          <p className="text-muted-foreground">
            You've finished watching "{video?.title}"
          </p>
        </div>
        
        {hasQuiz ? (
          <Button 
            onClick={onStartQuiz}
            className="w-full"
          >
            Start Quiz to Complete Training
          </Button>
        ) : (
          <div className="space-y-4">
            <TrainingAttestation
              enabled={true}
              checked={attestationChecked}
              onCheckedChange={setAttestationChecked}
              disabledTooltip=""
            />
            <Button 
              onClick={onCompleteTraining}
              className="w-full"
              disabled={!attestationChecked}
            >
              Complete Training
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
