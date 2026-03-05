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
import { CheckCircle, XCircle, X } from "lucide-react"; // CheckCircle/XCircle kept for true/false inline icons only
import { OptionList, OptionRow } from "@/components/ui/option-list";
import { Banner } from "@/components/ui/banner";

interface QuizModalProps {
  quiz: QuizWithQuestions;
  onSubmit: (responses: QuizSubmissionData[]) => void;
  onCancel: () => void;
  onResponsesChange?: (responses: QuizSubmissionData[], allAnswered: boolean, attestationChecked: boolean) => void;
  quizResults?: QuizResponse[];
  isSubmitted?: boolean;
  correctOptions?: Record<string, string[]>;
  /** Stored score from the quiz attempt record — used instead of recounting from current quiz definition */
  storedScore?: number;
  /** Stored total questions from the quiz attempt record */
  storedTotalQuestions?: number;
}

// Extended response type for internal state management
interface ExtendedQuizResponse {
  question_id: string;
  selected_option_id?: string;
  selected_option_ids?: string[]; // For multiple choice questions
  text_answer?: string;
}

export function QuizModal({
  quiz,
  onSubmit,
  onCancel,
  onResponsesChange,
  quizResults,
  isSubmitted,
  correctOptions = {},
  storedScore,
  storedTotalQuestions,
}: QuizModalProps) {
  // Initialize responses with saved quiz results when viewing completed quiz
  const initializeResponses = () => {
    if (isSubmitted && quizResults) {
      const initialResponses: Record<string, ExtendedQuizResponse> = {};

      // Group quiz results by question_id to handle multiple selections
      const responsesByQuestion = quizResults.reduce(
        (acc, result) => {
          if (!acc[result.question_id]) {
            acc[result.question_id] = [];
          }
          acc[result.question_id].push(result);
          return acc;
        },
        {} as Record<string, QuizResponse[]>,
      );

      Object.entries(responsesByQuestion).forEach(([questionId, results]) => {
        const question = quiz.questions.find((q) => q.id === questionId);
        if (question?.question_type === "multiple_choice") {
          // Always use array format for multiple choice questions
          initialResponses[questionId] = {
            question_id: questionId,
            selected_option_ids: results.map((r) => r.selected_option_id).filter(Boolean) as string[],
          };
        } else {
          // Single selection or text answer for other question types
          const result = results[0];
          initialResponses[questionId] = {
            question_id: questionId,
            selected_option_id: result.selected_option_id,
            text_answer: result.text_answer,
          };
        }
      });

      return initialResponses;
    }
    return {};
  };

  const [responses, setResponses] = useState<Record<string, ExtendedQuizResponse>>(initializeResponses);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attestationChecked, setAttestationChecked] = useState(isSubmitted ? true : false);

  const handleResponseChange = (questionId: string, response: Partial<ExtendedQuizResponse>) => {
    // Don't allow changes if quiz is submitted
    if (isSubmitted) return;

    const newResponses = {
      ...responses,
      [questionId]: {
        question_id: questionId,
        ...responses[questionId],
        ...response,
      },
    };
    setResponses(newResponses);

    // Convert to QuizSubmissionData format for parent callback
    const responseArray: QuizSubmissionData[] = [];
    quiz.questions.forEach((question) => {
      const response = newResponses[question.id];
      if (response) {
        if (question.question_type === "multiple_choice" && response.selected_option_ids) {
          // Create multiple entries for multiple choice selections
          response.selected_option_ids.forEach((optionId) => {
            responseArray.push({
              question_id: question.id,
              selected_option_id: optionId,
            });
          });
        } else {
          // Single entry for other question types
          responseArray.push({
            question_id: question.id,
            selected_option_id: response.selected_option_id,
            text_answer: response.text_answer,
          });
        }
      } else {
        responseArray.push({ question_id: question.id });
      }
    });

    // Check if all questions are answered
    const allAnswered = quiz.questions.every((question) => {
      const response = newResponses[question.id];
      if (question.question_type === "multiple_choice") {
        return response && response.selected_option_ids && response.selected_option_ids.length > 0;
      } else if (question.question_type === "single_answer" || question.question_type === "true_false") {
        return response && response.selected_option_id;
      }
      return response && response.text_answer?.trim();
    });

    onResponsesChange?.(responseArray, allAnswered, attestationChecked);
  };

  // Get quiz results for a specific question (handle multiple results for multiple choice)
  const getQuestionResults = (questionId: string): QuizResponse[] => {
    return quizResults?.filter((result) => result.question_id === questionId) || [];
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    setIsSubmitting(true);

    // Convert responses to QuizSubmissionData format
    const responseArray: QuizSubmissionData[] = [];
    quiz.questions.forEach((question) => {
      const response = responses[question.id];
      if (response) {
        if (question.question_type === "multiple_choice" && response.selected_option_ids) {
          // Create multiple entries for multiple choice selections
          response.selected_option_ids.forEach((optionId) => {
            responseArray.push({
              question_id: question.id,
              selected_option_id: optionId,
            });
          });
        } else {
          // Single entry for other question types
          responseArray.push({
            question_id: question.id,
            selected_option_id: response.selected_option_id,
            text_answer: response.text_answer,
          });
        }
      } else {
        responseArray.push({ question_id: question.id });
      }
    });

    await onSubmit(responseArray);
    setIsSubmitting(false);
  };

  const allQuestionsAnswered =
    quiz?.questions.every((question) => {
      const response = responses[question.id];
      if (question.question_type === "multiple_choice") {
        return response && response.selected_option_ids && response.selected_option_ids.length > 0;
      } else if (question.question_type === "single_answer" || question.question_type === "true_false") {
        return response && response.selected_option_id;
      }
      return response && response.text_answer?.trim();
    }) || false;

  if (!quiz) return null;

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-h3">
            Quiz Questions ({isSubmitted && storedTotalQuestions ? storedTotalQuestions : quiz.questions.length})
          </h2>
          {isSubmitted &&
            quizResults &&
            (() => {
              // Use stored attempt data when available (ensures accuracy across quiz versions)
              const useStored = storedScore !== undefined && storedTotalQuestions !== undefined;
              const correctAnswers = useStored
                ? storedScore
                : (() => {
                    const questionCorrectness = new Map<string, boolean>();
                    quizResults.forEach((r) => {
                      const prev = questionCorrectness.get(r.question_id);
                      questionCorrectness.set(r.question_id, prev === undefined ? r.is_correct : prev && r.is_correct);
                    });
                    return [...questionCorrectness.values()].filter(Boolean).length;
                  })();
              const totalQuestions = useStored ? storedTotalQuestions : quiz.questions.length;
              const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
              return (
                <Badge
                  variant={percentage >= 70 ? "soft-success" : "soft-destructive"}
                  role="status"
                  aria-label={`${percentage}% — ${correctAnswers} of ${totalQuestions} correct`}
                >
                  {percentage}% ({correctAnswers}/{totalQuestions} correct)
                </Badge>
              );
            })()}
        </div>

        <div className="space-y-6">
          {(() => {
            // When reviewing a submitted quiz, only show questions the employee actually answered
            const questionsToShow =
              isSubmitted && quizResults
                ? quiz.questions.filter((q) => quizResults.some((r) => r.question_id === q.id))
                : quiz.questions;
            return questionsToShow.map((question, index) => (
              <Card key={question.id} className="border-border">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-h4">
                        {index + 1}. {question.question_text}
                      </h3>
                      {question.question_type === "multiple_choice" && (
                        <p className="form-helper-text">Select all correct options for full credit.</p>
                      )}
                    </div>

                    {question.question_type === "multiple_choice" &&
                      (() => {
                        // Hoist question-level correctness calculations for banner + per-option badges
                        const mcCorrectOptionIds =
                          question.options
                            ?.filter((opt) => {
                              return "is_correct" in opt
                                ? opt.is_correct
                                : !!correctOptions[question.id]?.includes(opt.id);
                            })
                            .map((opt) => opt.id) || [];
                        const mcTotalCorrectCount = mcCorrectOptionIds.length;
                        const mcSelectedOptionIds = responses[question.id]?.selected_option_ids || [];
                        const mcHasMissedCorrect = mcCorrectOptionIds.some((id) => !mcSelectedOptionIds.includes(id));
                        const mcHasAnyCorrectSelected = mcSelectedOptionIds.some((id) =>
                          mcCorrectOptionIds.includes(id),
                        );
                        const mcShouldShowAlsoCorrect =
                          mcTotalCorrectCount > 1 && mcHasMissedCorrect && mcHasAnyCorrectSelected;
                        const mcQuestionResults = getQuestionResults(question.id);
                        const mcHasIncorrectAnswers = mcQuestionResults.some((r) => !r.is_correct);
                        const mcShouldShowSingleCorrect =
                          mcTotalCorrectCount === 1 && mcHasIncorrectAnswers && mcHasMissedCorrect;

                        return (
                          <>
                            {question.options && question.options.length > 0 ? (
                              <div className="space-y-3">
                                {question.options
                                  .sort((a, b) => a.order_index - b.order_index)
                                  .map((option) => {
                                    const currentSelections =
                                      responses[question.id]?.selected_option_ids ||
                                      (responses[question.id]?.selected_option_id
                                        ? [responses[question.id].selected_option_id!]
                                        : []);
                                    const isSelected = currentSelections.includes(option.id);
                                    const selectedResults = mcQuestionResults.filter(
                                      (r) => r.selected_option_id === option.id,
                                    );
                                    const isSelectedCorrect = selectedResults.some((r) => r.is_correct);
                                    const isCorrect =
                                      "is_correct" in option
                                        ? option.is_correct
                                        : !!correctOptions[question.id]?.includes(option.id);

                                    // Enhanced styling for quiz results
                                    let optionClassName = `flex-1 ${isSubmitted ? "cursor-default" : "cursor-pointer"} flex items-center justify-between transition-colors`;

                                    const shouldShowAlsoCorrect = mcShouldShowAlsoCorrect;
                                    const shouldShowSingleCorrect = mcShouldShowSingleCorrect;

                                    if (isSubmitted) {
                                      if (isSelected && isSelectedCorrect) {
                                        optionClassName +=
                                          " text-success bg-success/10 border-success/20 rounded-md p-3 border";
                                      } else if (isSelected && !isSelectedCorrect) {
                                        optionClassName +=
                                          " text-destructive bg-destructive/10 border-destructive/20 rounded-md p-3 border";
                                      } else if (!isSelected && isCorrect) {
                                        optionClassName +=
                                          " text-success bg-success/10 border-success/20 rounded-md p-3 border";
                                      }
                                    }

                                    return (
                                      <OptionRow key={option.id} className={isSubmitted ? "mb-2" : ""}>
                                        <Checkbox
                                          id={option.id}
                                          checked={isSelected}
                                          disabled={isSubmitted}
                                          onCheckedChange={(checked) => {
                                            const currentSelections =
                                              responses[question.id]?.selected_option_ids ||
                                              (responses[question.id]?.selected_option_id
                                                ? [responses[question.id].selected_option_id!]
                                                : []);
                                            let newSelections: string[];

                                            if (checked) {
                                              newSelections = [...currentSelections, option.id];
                                            } else {
                                              newSelections = currentSelections.filter((id) => id !== option.id);
                                            }

                                            handleResponseChange(question.id, {
                                              selected_option_ids: newSelections,
                                              selected_option_id: undefined, // Clear single selection
                                            });
                                          }}
                                        />
                                        <Label htmlFor={option.id} className={optionClassName} mutedOnDisabled={false}>
                                          <span className="flex-1">{option.option_text}</span>
                                          <div className="flex items-center gap-2">
                                            {isSubmitted && isSelected && isSelectedCorrect && (
                                              <Badge variant="success" showIcon>
                                                Correct
                                              </Badge>
                                            )}
                                            {isSubmitted && isSelected && !isSelectedCorrect && (
                                              <Badge variant="destructive">
                                                <X className="w-3 h-3 mr-1" />
                                                Your Answer
                                              </Badge>
                                            )}
                                            {isSubmitted && !isSelected && isCorrect && (
                                              <Badge variant="hollow-success" showIcon>
                                                Correct Answer
                                              </Badge>
                                            )}
                                          </div>
                                        </Label>
                                      </OptionRow>
                                    );
                                  })}
                              </div>
                            ) : (
                              <div className="text-muted-foreground italic">
                                No answer options available for this question.
                              </div>
                            )}
                          </>
                        );
                      })()}

                    {question.question_type === "true_false" && (
                      <>
                        {question.options && question.options.length > 0 ? (
                          <RadioGroup
                            value={responses[question.id]?.selected_option_id || ""}
                            onValueChange={(value) => handleResponseChange(question.id, { selected_option_id: value })}
                            disabled={isSubmitted}
                          >
                            {question.options
                              .sort((a, b) => a.order_index - b.order_index)
                              .map((option) => {
                                const isSelected = responses[question.id]?.selected_option_id === option.id;
                                const questionResults = getQuestionResults(question.id);
                                const questionResult = questionResults.find((r) => r.selected_option_id === option.id);
                                const isSelectedCorrect = questionResult?.is_correct || false;
                                const isCorrect =
                                  "is_correct" in option
                                    ? option.is_correct
                                    : !!correctOptions[question.id]?.includes(option.id);

                                // Enhanced styling for quiz results
                                let optionClassName = `flex-1 ${isSubmitted ? "cursor-default" : "cursor-pointer"} flex items-center justify-between transition-colors`;

                                // Check if user got the question wrong (for single answer questions)
                                const userAnsweredIncorrectly =
                                  questionResults.length > 0 && questionResults.some((r) => !r.is_correct);

                                if (isSubmitted) {
                                  if (isSelected && isSelectedCorrect) {
                                    optionClassName +=
                                      " text-success bg-success/10 border-success/20 rounded-md p-3 border";
                                  } else if (isSelected && !isSelectedCorrect) {
                                    optionClassName +=
                                      " text-destructive bg-destructive/10 border-destructive/20 rounded-md p-3 border";
                                  } else if (!isSelected && isCorrect) {
                                    optionClassName +=
                                      " text-success bg-success/10 border-success/20 rounded-md p-3 border";
                                  }
                                }

                                return (
                                  <OptionRow key={option.id} className={isSubmitted ? "mb-2" : ""}>
                                    <RadioGroupItem value={option.id} id={option.id} disabled={isSubmitted} />
                                    <Label htmlFor={option.id} className={optionClassName} mutedOnDisabled={false}>
                                      <span className="flex items-center">
                                        {option.option_text === "True" ? (
                                          <CheckCircle className="inline w-4 h-4 mr-2 text-success" />
                                        ) : (
                                          <XCircle className="inline w-4 h-4 mr-2 text-destructive" />
                                        )}
                                        {option.option_text}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {isSubmitted && isSelected && isSelectedCorrect && (
                                          <Badge variant="success" showIcon>
                                            Correct
                                          </Badge>
                                        )}
                                        {isSubmitted && isSelected && !isSelectedCorrect && (
                                          <Badge variant="destructive">
                                            <X className="w-3 h-3 mr-1" />
                                            Your Answer
                                          </Badge>
                                        )}
                                        {isSubmitted && !isSelected && isCorrect && userAnsweredIncorrectly && (
                                          <Badge variant="hollow-success" showIcon>
                                            Correct Answer
                                          </Badge>
                                        )}
                                      </div>
                                    </Label>
                                  </OptionRow>
                                );
                              })}
                          </RadioGroup>
                        ) : (
                          <div className="text-muted-foreground italic">
                            No answer options available for this question.
                          </div>
                        )}
                      </>
                    )}

                    {question.question_type === "single_answer" && (
                      <>
                        {question.options && question.options.length > 0 ? (
                          <RadioGroup
                            value={responses[question.id]?.selected_option_id || ""}
                            onValueChange={(value) => handleResponseChange(question.id, { selected_option_id: value })}
                            disabled={isSubmitted}
                          >
                            {question.options
                              .sort((a, b) => a.order_index - b.order_index)
                              .map((option) => {
                                const isSelected = responses[question.id]?.selected_option_id === option.id;
                                const questionResults = getQuestionResults(question.id);
                                const questionResult = questionResults.find((r) => r.selected_option_id === option.id);
                                const isSelectedCorrect = questionResult?.is_correct || false;
                                const isCorrect =
                                  "is_correct" in option
                                    ? option.is_correct
                                    : !!correctOptions[question.id]?.includes(option.id);

                                // Enhanced styling for quiz results
                                let optionClassName = `flex-1 ${isSubmitted ? "cursor-default" : "cursor-pointer"} flex items-center justify-between transition-colors`;

                                // Check if user got the question wrong (for single answer questions)
                                const userAnsweredIncorrectly =
                                  questionResults.length > 0 && questionResults.some((r) => !r.is_correct);

                                if (isSubmitted) {
                                  if (isSelected && isSelectedCorrect) {
                                    optionClassName +=
                                      " text-success bg-success/10 border-success/20 rounded-md p-3 border";
                                  } else if (isSelected && !isSelectedCorrect) {
                                    optionClassName +=
                                      " text-destructive bg-destructive/10 border-destructive/20 rounded-md p-3 border";
                                  } else if (!isSelected && isCorrect) {
                                    optionClassName +=
                                      " text-success bg-success/10 border-success/20 rounded-md p-3 border";
                                  }
                                }

                                return (
                                  <OptionRow key={option.id} className={isSubmitted ? "mb-2" : ""}>
                                    <RadioGroupItem value={option.id} id={option.id} disabled={isSubmitted} />
                                    <Label htmlFor={option.id} className={optionClassName} mutedOnDisabled={false}>
                                      <span className="flex-1">{option.option_text}</span>
                                      <div className="flex items-center gap-2">
                                        {isSubmitted && isSelected && isSelectedCorrect && (
                                          <Badge variant="success" showIcon>
                                            Correct
                                          </Badge>
                                        )}
                                        {isSubmitted && isSelected && !isSelectedCorrect && (
                                          <Badge variant="destructive">
                                            <X className="w-3 h-3 mr-1" />
                                            Your Answer
                                          </Badge>
                                        )}
                                        {isSubmitted && !isSelected && isCorrect && userAnsweredIncorrectly && (
                                          <Badge variant="hollow-success" showIcon>
                                            Correct Answer
                                          </Badge>
                                        )}
                                      </div>
                                    </Label>
                                  </OptionRow>
                                );
                              })}
                          </RadioGroup>
                        ) : (
                          <div className="text-muted-foreground italic">
                            No answer options available for this question.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
