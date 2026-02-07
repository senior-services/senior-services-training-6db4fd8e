import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Target, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizResponse } from "@/types/quiz";

interface QuizScoreSummaryProps {
  quizResults: QuizResponse[];
  totalQuestions: number;
}

export function QuizScoreSummary({ quizResults, totalQuestions }: QuizScoreSummaryProps) {
  if (totalQuestions === 0) return null;

  const correctAnswers = quizResults.filter(result => result.is_correct).length;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  
  const getScoreColor = (percent: number) => {
    if (percent >= 90) return "text-success bg-success/10 border-success/20";
    if (percent >= 70) return "text-attention bg-attention/10 border-attention/20";
    return "text-destructive bg-destructive/10 border-destructive/20";
  };

  const getScoreIcon = (percent: number) => {
    if (percent >= 90) return <Trophy className="w-5 h-5" />;
    if (percent >= 70) return <Target className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  return (
    <Card
      className={cn("border-2", getScoreColor(percentage))}
      role="status"
      aria-label={`Quiz complete: ${percentage}% — ${correctAnswers} of ${totalQuestions} correct`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full", getScoreColor(percentage))}>
            {getScoreIcon(percentage)}
          </div>
          <span className="text-2xl font-bold">{percentage}%</span>
          <Badge 
            variant="secondary" 
            className={cn(getScoreColor(percentage), "font-medium")}
          >
            {correctAnswers} of {totalQuestions} correct
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
