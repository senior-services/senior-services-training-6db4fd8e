import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Target, Trophy } from "lucide-react";
import type { QuizResponse } from "@/types/quiz";

interface QuizScoreSummaryProps {
  quizResults: QuizResponse[];
  totalQuestions: number;
}

export function QuizScoreSummary({ quizResults, totalQuestions }: QuizScoreSummaryProps) {
  const correctAnswers = quizResults.filter(result => result.is_correct).length;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  
  const getScoreColor = (percent: number) => {
    if (percent >= 90) return "text-success bg-success/10 border-success/20";
    if (percent >= 70) return "text-attention bg-attention/10 border-attention/20";
    return "text-destructive bg-destructive/10 border-destructive/20";
  };

  const getScoreIcon = (percent: number) => {
    if (percent >= 90) return <Trophy className="w-6 h-6" />;
    if (percent >= 70) return <Target className="w-6 h-6" />;
    return <CheckCircle className="w-6 h-6" />;
  };

  return (
    <Card className={`border-2 ${getScoreColor(percentage)}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${getScoreColor(percentage)}`}>
              {getScoreIcon(percentage)}
            </div>
            <div>
              <h3 className="text-xl font-bold">Quiz Complete!</h3>
              <p className="text-sm text-muted-foreground">Your final score</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold">{percentage}%</span>
            </div>
            <Badge 
              variant="secondary" 
              className={`${getScoreColor(percentage)} font-medium`}
            >
              {correctAnswers} of {totalQuestions} correct
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}