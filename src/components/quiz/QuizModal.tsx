import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QuizWithQuestions, QuizSubmissionData } from "@/types/quiz";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

interface QuizModalProps {
  quiz: QuizWithQuestions | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (responses: QuizSubmissionData[]) => void;
  isSubmitting: boolean;
}

export function QuizModal({ quiz, open, onOpenChange, onSubmit, isSubmitting }: QuizModalProps) {
  const [responses, setResponses] = useState<Record<string, QuizSubmissionData>>({});

  const handleResponseChange = (questionId: string, response: Partial<QuizSubmissionData>) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        ...prev[questionId],
        ...response
      }
    }));
  };

  const handleSubmit = () => {
    if (!quiz) return;
    
    const responseArray = quiz.questions.map(question => 
      responses[question.id] || { question_id: question.id }
    );
    
    onSubmit(responseArray);
  };

  const allQuestionsAnswered = quiz?.questions.every(question => {
    const response = responses[question.id];
    return response && (response.selected_option_id || response.text_answer?.trim());
  }) || false;

  if (!quiz) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{quiz.title}</DialogTitle>
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {quiz.questions.map((question, index) => (
            <Card key={question.id} className="border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">
                    {index + 1}. {question.question_text}
                  </h3>

                  {question.question_type === 'multiple_choice' && question.options && (
                    <RadioGroup
                      value={responses[question.id]?.selected_option_id || ""}
                      onValueChange={(value) => 
                        handleResponseChange(question.id, { selected_option_id: value })
                      }
                    >
                      {question.options
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={option.id} />
                            <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                              {option.option_text}
                            </Label>
                          </div>
                        ))}
                    </RadioGroup>
                  )}

                  {question.question_type === 'true_false' && (
                    <RadioGroup
                      value={responses[question.id]?.selected_option_id || ""}
                      onValueChange={(value) => 
                        handleResponseChange(question.id, { selected_option_id: value })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id={`${question.id}_true`} />
                        <Label htmlFor={`${question.id}_true`} className="cursor-pointer">
                          <CheckCircle className="inline w-4 h-4 mr-2 text-green-600" />
                          True
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id={`${question.id}_false`} />
                        <Label htmlFor={`${question.id}_false`} className="cursor-pointer">
                          <XCircle className="inline w-4 h-4 mr-2 text-red-600" />
                          False
                        </Label>
                      </div>
                    </RadioGroup>
                  )}

                  {question.question_type === 'single_answer' && (
                    <Textarea
                      placeholder="Type your answer here..."
                      value={responses[question.id]?.text_answer || ""}
                      onChange={(e) => 
                        handleResponseChange(question.id, { text_answer: e.target.value })
                      }
                      className="min-h-[100px]"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!allQuestionsAnswered || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}