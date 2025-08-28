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
  quiz: QuizWithQuestions;
  onSubmit: (responses: QuizSubmissionData[]) => void;
  onCancel: () => void;
  onResponsesChange?: (responses: QuizSubmissionData[], allAnswered: boolean) => void;
}

export function QuizModal({ quiz, onSubmit, onCancel, onResponsesChange }: QuizModalProps) {
  const [responses, setResponses] = useState<Record<string, QuizSubmissionData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResponseChange = (questionId: string, response: Partial<QuizSubmissionData>) => {
    const newResponses = {
      ...responses,
      [questionId]: {
        question_id: questionId,
        ...responses[questionId],
        ...response
      }
    };
    setResponses(newResponses);
    
    // Notify parent of changes
    const responseArray = quiz.questions.map(question => 
      newResponses[question.id] || { question_id: question.id }
    );
    const allAnswered = quiz.questions.every(question => {
      const response = newResponses[question.id];
      return response && (response.selected_option_id || response.text_answer?.trim());
    });
    onResponsesChange?.(responseArray, allAnswered);
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    
    setIsSubmitting(true);
    const responseArray = quiz.questions.map(question => 
      responses[question.id] || { question_id: question.id }
    );
    
    await onSubmit(responseArray);
    setIsSubmitting(false);
  };

  const allQuestionsAnswered = quiz?.questions.every(question => {
    const response = responses[question.id];
    return response && (response.selected_option_id || response.text_answer?.trim());
  }) || false;

  if (!quiz) return null;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}
        </div>

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

                  {question.question_type === 'true_false' && question.options && (
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
                            <Label htmlFor={option.id} className="cursor-pointer">
                              {option.option_text === 'True' ? (
                                <CheckCircle className="inline w-4 h-4 mr-2 text-green-600" />
                              ) : (
                                <XCircle className="inline w-4 h-4 mr-2 text-red-600" />
                              )}
                              {option.option_text}
                            </Label>
                          </div>
                        ))}
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

        </div>
      </div>
    </div>
  );
}