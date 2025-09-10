import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuizWithQuestions, QuizSubmissionData, QuizResponse } from "@/types/quiz";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { OptionList, OptionRow } from "@/components/ui/option-list";
import { QuizScoreSummary } from "./QuizScoreSummary";

interface QuizModalProps {
  quiz: QuizWithQuestions;
  onSubmit: (responses: QuizSubmissionData[]) => void;
  onCancel: () => void;
  onResponsesChange?: (responses: QuizSubmissionData[], allAnswered: boolean) => void;
  quizResults?: QuizResponse[];
  isSubmitted?: boolean;
  correctOptions?: Record<string, string[]>;
}

// Extended response type for internal state management
interface ExtendedQuizResponse {
  question_id: string;
  selected_option_id?: string;
  selected_option_ids?: string[]; // For multiple choice questions
  text_answer?: string;
}

export function QuizModal({ quiz, onSubmit, onCancel, onResponsesChange, quizResults, isSubmitted, correctOptions = {} }: QuizModalProps) {
  // Initialize responses with saved quiz results when viewing completed quiz
  const initializeResponses = () => {
    if (isSubmitted && quizResults) {
      const initialResponses: Record<string, ExtendedQuizResponse> = {};
      
      // Group quiz results by question_id to handle multiple selections
      const responsesByQuestion = quizResults.reduce((acc, result) => {
        if (!acc[result.question_id]) {
          acc[result.question_id] = [];
        }
        acc[result.question_id].push(result);
        return acc;
      }, {} as Record<string, QuizResponse[]>);
      
      Object.entries(responsesByQuestion).forEach(([questionId, results]) => {
        const question = quiz.questions.find(q => q.id === questionId);
        if (question?.question_type === 'multiple_choice') {
          // Always use array format for multiple choice questions
          initialResponses[questionId] = {
            question_id: questionId,
            selected_option_ids: results.map(r => r.selected_option_id).filter(Boolean) as string[]
          };
        } else {
          // Single selection or text answer for other question types
          const result = results[0];
          initialResponses[questionId] = {
            question_id: questionId,
            selected_option_id: result.selected_option_id,
            text_answer: result.text_answer
          };
        }
      });
      
      return initialResponses;
    }
    return {};
  };

  const [responses, setResponses] = useState<Record<string, ExtendedQuizResponse>>(initializeResponses);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResponseChange = (questionId: string, response: Partial<ExtendedQuizResponse>) => {
    // Don't allow changes if quiz is submitted
    if (isSubmitted) return;
    
    const newResponses = {
      ...responses,
      [questionId]: {
        question_id: questionId,
        ...responses[questionId],
        ...response
      }
    };
    setResponses(newResponses);
    
    // Convert to QuizSubmissionData format for parent callback
    const responseArray: QuizSubmissionData[] = [];
    quiz.questions.forEach(question => {
      const response = newResponses[question.id];
      if (response) {
        if (question.question_type === 'multiple_choice' && response.selected_option_ids) {
          // Create multiple entries for multiple choice selections
          response.selected_option_ids.forEach(optionId => {
            responseArray.push({
              question_id: question.id,
              selected_option_id: optionId
            });
          });
        } else {
          // Single entry for other question types
          responseArray.push({
            question_id: question.id,
            selected_option_id: response.selected_option_id,
            text_answer: response.text_answer
          });
        }
      } else {
        responseArray.push({ question_id: question.id });
      }
    });
    
    // Check if all questions are answered
    const allAnswered = quiz.questions.every(question => {
      const response = newResponses[question.id];
      if (question.question_type === 'multiple_choice') {
        return response && response.selected_option_ids && response.selected_option_ids.length > 0;
      } else if (question.question_type === 'single_answer' || question.question_type === 'true_false') {
        return response && response.selected_option_id;
      }
      return response && response.text_answer?.trim();
    });
    
    onResponsesChange?.(responseArray, allAnswered);
  };

  // Get quiz results for a specific question (handle multiple results for multiple choice)
  const getQuestionResults = (questionId: string): QuizResponse[] => {
    return quizResults?.filter(result => result.question_id === questionId) || [];
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    
    setIsSubmitting(true);
    
    // Convert responses to QuizSubmissionData format
    const responseArray: QuizSubmissionData[] = [];
    quiz.questions.forEach(question => {
      const response = responses[question.id];
      if (response) {
        if (question.question_type === 'multiple_choice' && response.selected_option_ids) {
          // Create multiple entries for multiple choice selections
          response.selected_option_ids.forEach(optionId => {
            responseArray.push({
              question_id: question.id,
              selected_option_id: optionId
            });
          });
        } else {
          // Single entry for other question types
          responseArray.push({
            question_id: question.id,
            selected_option_id: response.selected_option_id,
            text_answer: response.text_answer
          });
        }
      } else {
        responseArray.push({ question_id: question.id });
      }
    });
    
    await onSubmit(responseArray);
    setIsSubmitting(false);
  };

  const allQuestionsAnswered = quiz?.questions.every(question => {
    const response = responses[question.id];
    if (question.question_type === 'multiple_choice') {
      return response && response.selected_option_ids && response.selected_option_ids.length > 0;
    } else if (question.question_type === 'single_answer' || question.question_type === 'true_false') {
      return response && response.selected_option_id;
    }
    return response && response.text_answer?.trim();
  }) || false;

  if (!quiz) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Score Summary - shown when quiz is submitted */}
        {isSubmitted && quizResults && (
          <div className="mb-6">
            <QuizScoreSummary 
              quizResults={quizResults} 
              totalQuestions={quiz.questions.length} 
            />
          </div>
        )}

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

                  {question.question_type === 'multiple_choice' && (
                    <>
                      {question.options && question.options.length > 0 ? (
                        <OptionList>
                          {question.options
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((option) => {
                              const currentSelections = responses[question.id]?.selected_option_ids || 
                                (responses[question.id]?.selected_option_id ? [responses[question.id].selected_option_id!] : []);
                              const isSelected = currentSelections.includes(option.id);
                              const questionResults = getQuestionResults(question.id);
                              const selectedResults = questionResults.filter(r => r.selected_option_id === option.id);
                              const isSelectedCorrect = selectedResults.some(r => r.is_correct);
                              const isCorrect = ('is_correct' in option) 
                                ? option.is_correct 
                                : !!correctOptions[question.id]?.includes(option.id);
                              
                                // Check if user got any answer wrong for this question (for multiple choice)
                                const hasIncorrectAnswers = questionResults.some(r => !r.is_correct);
                                
                                // Calculate correct options and determine if "Also Correct" should be shown
                                const correctOptionIds = question.options?.filter(opt => {
                                  return ('is_correct' in opt) ? opt.is_correct : !!correctOptions[question.id]?.includes(opt.id);
                                }).map(opt => opt.id) || [];
                                const totalCorrectCount = correctOptionIds.length;
                                const selectedOptionIds = responses[question.id]?.selected_option_ids || [];
                                const hasMissedCorrect = correctOptionIds.some(id => !selectedOptionIds.includes(id));
                                
                                // Show "Also Correct" for multiple correct answers when user missed some
                                const shouldShowAlsoCorrect = totalCorrectCount > 1 && hasMissedCorrect;
                                // Show "Correct" for single correct answer when user got it wrong
                                const shouldShowSingleCorrect = totalCorrectCount === 1 && hasIncorrectAnswers && hasMissedCorrect;
                              
                                // Enhanced styling for quiz results - apply to OptionRow container
                                let rowClassName = `${isSubmitted ? 'cursor-default' : 'cursor-pointer'} transition-colors`;
                                
                                if (isSubmitted) {
                                  if (isSelected && isSelectedCorrect) {
                                    rowClassName += ' text-emerald-700 bg-emerald-50 border-emerald-200 rounded-md p-3 border';
                                  } else if (isSelected && !isSelectedCorrect) {
                                    rowClassName += ' text-red-700 bg-red-50 border-red-200 rounded-md p-3 border';
                                  } else if (!isSelected && isCorrect && (shouldShowAlsoCorrect || shouldShowSingleCorrect)) {
                                    rowClassName += ' text-emerald-700 bg-emerald-50 border-emerald-200 rounded-md p-3 border';
                                  }
                                }
                              
                              return (
                                <OptionRow key={option.id} className={rowClassName}>
                                  <Checkbox 
                                    id={option.id}
                                    checked={isSelected}
                                    disabled={isSubmitted}
                                    onCheckedChange={(checked) => {
                                       const currentSelections = responses[question.id]?.selected_option_ids || 
                                         (responses[question.id]?.selected_option_id ? [responses[question.id].selected_option_id!] : []);
                                      let newSelections: string[];
                                      
                                      if (checked) {
                                        newSelections = [...currentSelections, option.id];
                                      } else {
                                        newSelections = currentSelections.filter(id => id !== option.id);
                                      }
                                      
                                      handleResponseChange(question.id, { 
                                        selected_option_ids: newSelections,
                                        selected_option_id: undefined // Clear single selection
                                      });
                                    }}
                                  />
                                  <Label htmlFor={option.id} className="flex-1 flex items-center justify-between">
                                    <span className="flex-1">{option.option_text}</span>
                                    <div className="flex items-center gap-2">
                                      {isSubmitted && isSelected && isSelectedCorrect && (
                                        <Badge variant="default" className="bg-emerald-100 text-emerald-800 text-xs">
                                          Correct
                                        </Badge>
                                      )}
                                      {isSubmitted && isSelected && !isSelectedCorrect && (
                                        <Badge variant="destructive" className="text-xs">
                                          Incorrect
                                        </Badge>
                                      )}
                                      {isSubmitted && !isSelected && isCorrect && shouldShowAlsoCorrect && (
                                        <Badge variant="default" className="bg-emerald-100 text-emerald-800 text-xs">
                                          Also Correct
                                        </Badge>
                                      )}
                                      {isSubmitted && !isSelected && isCorrect && shouldShowSingleCorrect && (
                                        <Badge variant="default" className="bg-emerald-100 text-emerald-800 text-xs">
                                          Correct
                                        </Badge>
                                      )}
                                      {isSubmitted && isSelected && (
                                        isSelectedCorrect ? (
                                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                                        ) : (
                                          <XCircle className="w-5 h-5 text-red-600" />
                                        )
                                      )}
                                      {isSubmitted && !isSelected && isCorrect && (shouldShowAlsoCorrect || shouldShowSingleCorrect) && (
                                       <CheckCircle className="w-5 h-5 text-emerald-600" />
                                     )}
                                    </div>
                                  </Label>
                                </OptionRow>
                              );
                            })}
                        </OptionList>
                      ) : (
                        <div className="text-muted-foreground italic">
                          No answer options available for this question.
                        </div>
                      )}
                    </>
                  )}

                  {question.question_type === 'true_false' && (
                    <>
                      {question.options && question.options.length > 0 ? (
                        <RadioGroup
                          value={responses[question.id]?.selected_option_id || ""}
                          onValueChange={(value) => 
                            handleResponseChange(question.id, { selected_option_id: value })
                          }
                          disabled={isSubmitted}
                        >
                          <OptionList>
                            {question.options
                              .sort((a, b) => a.order_index - b.order_index)
                              .map((option) => {
                                const isSelected = responses[question.id]?.selected_option_id === option.id;
                                const questionResults = getQuestionResults(question.id);
                                const questionResult = questionResults.find(r => r.selected_option_id === option.id);
                                const isSelectedCorrect = questionResult?.is_correct || false;
                                const isCorrect = ('is_correct' in option) 
                                  ? option.is_correct 
                                  : !!correctOptions[question.id]?.includes(option.id);
                                
                                // Check if user got the question wrong (for single answer questions)
                                const userAnsweredIncorrectly = questionResults.length > 0 && questionResults.some(r => !r.is_correct);
                                
                                // Enhanced styling for quiz results - apply to OptionRow container
                                let rowClassName = `${isSubmitted ? 'cursor-default' : 'cursor-pointer'} transition-colors`;
                                
                                if (isSubmitted) {
                                  if (isSelected && isSelectedCorrect) {
                                    rowClassName += ' text-emerald-700 bg-emerald-50 border-emerald-200 rounded-md p-3 border';
                                  } else if (isSelected && !isSelectedCorrect) {
                                    rowClassName += ' text-red-700 bg-red-50 border-red-200 rounded-md p-3 border';
                                  } else if (!isSelected && isCorrect && userAnsweredIncorrectly) {
                                    rowClassName += ' text-emerald-700 bg-emerald-50 border-emerald-200 rounded-md p-3 border';
                                  }
                                }
                                
                                return (
                                  <OptionRow key={option.id} className={rowClassName}>
                                    <RadioGroupItem value={option.id} id={option.id} disabled={isSubmitted} />
                                    <Label htmlFor={option.id} className="flex-1 flex items-center justify-between">
                                      <span className="flex-1">{option.option_text}</span>
                                      <div className="flex items-center gap-2">
                                        {isSubmitted && isSelected && isSelectedCorrect && (
                                          <Badge variant="default" className="bg-emerald-100 text-emerald-800 text-xs">
                                            Correct
                                          </Badge>
                                        )}
                                        {isSubmitted && isSelected && !isSelectedCorrect && (
                                          <Badge variant="destructive" className="text-xs">
                                            Incorrect
                                          </Badge>
                                        )}
                                        {isSubmitted && !isSelected && isCorrect && userAnsweredIncorrectly && (
                                          <Badge variant="default" className="bg-emerald-100 text-emerald-800 text-xs">
                                            Correct
                                          </Badge>
                                        )}
                                        {isSubmitted && isSelected && (
                                          isSelectedCorrect ? (
                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                          ) : (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                          )
                                        )}
                                        {isSubmitted && !isSelected && isCorrect && userAnsweredIncorrectly && (
                                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                                        )}
                                      </div>
                                    </Label>
                                  </OptionRow>
                                );
                              })}
                          </OptionList>
                        </RadioGroup>
                      ) : (
                        <div className="text-muted-foreground italic">
                          No answer options available for this question.
                        </div>
                      )}
                     </>
                   )}

                   {question.question_type === 'single_answer' && question.options && (
                     <RadioGroup
                       value={responses[question.id]?.selected_option_id || ""}
                       onValueChange={(value) => 
                         handleResponseChange(question.id, { selected_option_id: value })
                       }
                       disabled={isSubmitted}
                     >
                       <OptionList>
                         {question.options
                           .sort((a, b) => a.order_index - b.order_index)
                           .map((option) => {
                             const isSelected = responses[question.id]?.selected_option_id === option.id;
                             const questionResults = getQuestionResults(question.id);
                             const questionResult = questionResults.find(r => r.selected_option_id === option.id);
                             const isSelectedCorrect = questionResult?.is_correct || false;
                             const isCorrect = ('is_correct' in option) 
                               ? option.is_correct 
                               : !!correctOptions[question.id]?.includes(option.id);
                             
                             // Check if user got the question wrong (for single answer questions)
                             const userAnsweredIncorrectly = questionResults.length > 0 && questionResults.some(r => !r.is_correct);
                             
                             // Enhanced styling for quiz results - apply to OptionRow container
                             let rowClassName = `${isSubmitted ? 'cursor-default' : 'cursor-pointer'} transition-colors`;
                             
                             if (isSubmitted) {
                               if (isSelected && isSelectedCorrect) {
                                 rowClassName += ' text-emerald-700 bg-emerald-50 border-emerald-200 rounded-md p-3 border';
                               } else if (isSelected && !isSelectedCorrect) {
                                 rowClassName += ' text-red-700 bg-red-50 border-red-200 rounded-md p-3 border';
                               } else if (!isSelected && isCorrect && userAnsweredIncorrectly) {
                                 rowClassName += ' text-emerald-700 bg-emerald-50 border-emerald-200 rounded-md p-3 border';
                               }
                             }
                             
                             return (
                               <OptionRow key={option.id} className={rowClassName}>
                                 <RadioGroupItem value={option.id} id={option.id} disabled={isSubmitted} />
                                 <Label htmlFor={option.id} className="flex-1 flex items-center justify-between">
                                   <span className="flex-1">{option.option_text}</span>
                                   <div className="flex items-center gap-2">
                                     {isSubmitted && isSelected && isSelectedCorrect && (
                                       <Badge variant="default" className="bg-emerald-100 text-emerald-800 text-xs">
                                         Correct
                                       </Badge>
                                     )}
                                     {isSubmitted && isSelected && !isSelectedCorrect && (
                                       <Badge variant="destructive" className="text-xs">
                                         Incorrect
                                       </Badge>
                                     )}
                                     {isSubmitted && !isSelected && isCorrect && userAnsweredIncorrectly && (
                                       <Badge variant="default" className="bg-emerald-100 text-emerald-800 text-xs">
                                         Correct
                                       </Badge>
                                     )}
                                     {isSubmitted && isSelected && (
                                       isSelectedCorrect ? (
                                         <CheckCircle className="w-5 h-5 text-emerald-600" />
                                       ) : (
                                         <XCircle className="w-5 h-5 text-red-600" />
                                       )
                                     )}
                                     {isSubmitted && !isSelected && isCorrect && userAnsweredIncorrectly && (
                                       <CheckCircle className="w-5 h-5 text-emerald-600" />
                                     )}
                                   </div>
                                 </Label>
                               </OptionRow>
                             );
                           })}
                       </OptionList>
                     </RadioGroup>
                   )}
                 </div>
               </CardContent>
             </Card>
           ))}

         </div>

         {!isSubmitted && (
           <div className="mt-6 flex justify-end">
             <Button 
               onClick={handleSubmit} 
               disabled={!allQuestionsAnswered || isSubmitting}
               className="min-w-[120px]"
             >
               {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
             </Button>
           </div>
         )}
       </div>
     </div>
   );
 }