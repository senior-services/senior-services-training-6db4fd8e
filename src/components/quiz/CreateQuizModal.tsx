import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogScrollArea, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Banner } from "@/components/ui/banner";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { QuizQuestion, QuizQuestionOption } from "@/types/quiz";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { OptionList, OptionRow } from "@/components/ui/option-list";

interface CreateQuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (quizData: QuizFormData) => void;
  videoId: string;
  isSubmitting: boolean;
}

export interface QuizFormData {
  title: string;
  description: string;
  video_id: string;
  questions: QuestionFormData[];
}

export interface QuestionFormData {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'single_answer';
  order_index: number;
  options: OptionFormData[];
}

export interface OptionFormData {
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export function CreateQuizModal({ open, onOpenChange, onSubmit, videoId, isSubmitting }: CreateQuizModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<QuizFormData>({
    title: "",  // Will be auto-populated from video title on submit
    description: "",
    video_id: videoId,
    questions: []
  });

  const addQuestion = () => {
    const newQuestion: QuestionFormData = {
      question_text: "",
      question_type: "multiple_choice",
      order_index: formData.questions.length,
      options: []
    };
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (index: number, updates: Partial<QuestionFormData>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, ...updates } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const addOption = (questionIndex: number) => {
    const question = formData.questions[questionIndex];
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
    const question = formData.questions[questionIndex];
    const updatedOptions = question.options.map((option, i) => 
      i === optionIndex ? { ...option, ...updates } : option
    );
    
    updateQuestion(questionIndex, { options: updatedOptions });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = formData.questions[questionIndex];
    
    // Safety guard: prevent deletion if only 2 or fewer options remain for single_answer and multiple_choice
    if ((question.question_type === 'single_answer' || question.question_type === 'multiple_choice') && 
        question.options.length <= 2) {
      return;
    }
    
    const updatedOptions = question.options.filter((_, i) => i !== optionIndex);
    
    updateQuestion(questionIndex, { options: updatedOptions });
  };

  const cleanupAndValidateQuestions = (questions: QuestionFormData[]) => {
    const errors: {[key: number]: string} = {};
    
    const cleanedQuestions = questions.map((question, index) => {
      // Check if question text is empty for all question types
      if (!question.question_text.trim()) {
        errors[index] = 'Question text is required.';
        return question;
      }
      
      if (question.question_type === 'multiple_choice') {
        // Remove empty options and reindex
        const nonEmptyOptions = question.options
          .filter(opt => opt.option_text.trim())
          .map((opt, i) => ({ ...opt, order_index: i }));
        
        // Validate minimum 2 options
        if (nonEmptyOptions.length < 2) {
          errors[index] = 'Multiple choice questions require a minimum of 2 answers.';
        }
        
        // Ensure at least one correct answer
        const hasCorrectAnswer = nonEmptyOptions.some(opt => opt.is_correct);
        if (nonEmptyOptions.length >= 2 && !hasCorrectAnswer) {
          errors[index] = 'Please select at least one correct answer for this multiple choice question.';
        }
        
        return { ...question, options: nonEmptyOptions };
      } else if (question.question_type === 'single_answer') {
        // Remove empty options and reindex
        const nonEmptyOptions = question.options
          .filter(opt => opt.option_text.trim())
          .map((opt, i) => ({ ...opt, order_index: i }));
        
        // Validate minimum 2 options
        if (nonEmptyOptions.length < 2) {
          errors[index] = 'Single answer questions require a minimum of 2 answers.';
        }
        
        // Ensure at least one correct answer
        const hasCorrectAnswer = nonEmptyOptions.some(opt => opt.is_correct);
        if (nonEmptyOptions.length >= 2 && !hasCorrectAnswer) {
          errors[index] = 'Please select one correct answer for this single answer question.';
        }
        
        return { ...question, options: nonEmptyOptions };
      } else if (question.question_type === 'true_false') {
        // For true/false questions, ensure exactly one correct answer
        const hasCorrectAnswer = question.options.some(opt => opt.is_correct);
        if (!hasCorrectAnswer) {
          errors[index] = 'Please select the correct answer (True or False).';
        }
        
        return question;
      }
      return question;
    });
    
    return { cleanedQuestions, errors };
  };

  const handleSubmit = () => {
    // Check if there are no questions
    if (formData.questions.length === 0) {
      toast({
        variant: "destructive",
        title: "No Questions Added",
        description: "Please add at least one question to create the quiz.",
      });
      return;
    }
    
    const { cleanedQuestions, errors } = cleanupAndValidateQuestions(formData.questions);
    
    if (Object.keys(errors).length > 0) {
      // Don't submit if there are validation errors
      return;
    }
    
    onSubmit({
      ...formData,
      questions: cleanedQuestions
    });
  };

  const { cleanedQuestions, errors: validationErrors } = cleanupAndValidateQuestions(formData.questions);
  const canSubmit = formData.questions.length > 0 &&
    formData.questions.every(q => q.question_text.trim()) &&
    Object.keys(validationErrors).length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Quiz</DialogTitle>
        </DialogHeader>

        <DialogScrollArea className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button onClick={addQuestion} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            {formData.questions.length === 0 && (
              <Banner 
                variant="error" 
                description="No questions have been added yet. Please add at least one question to create the quiz."
                actions={
                  <Button onClick={addQuestion} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                }
              />
            )}

            {formData.questions.map((question, questionIndex) => (
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
                      className={cn(
                        validationErrors[questionIndex]?.includes('Question text is required') 
                          ? "border-destructive focus-visible:ring-destructive" 
                          : ""
                      )}
                    />
                    {validationErrors[questionIndex]?.includes('Question text is required') && (
                      <div className="text-sm text-destructive mt-1">
                        Question text is required.
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Question Type</Label>
                    <Select
                      value={question.question_type}
                    onValueChange={(value: any) => {
                      const newOptions = value === 'true_false' ? [
                        { option_text: 'True', is_correct: false, order_index: 0 },
                        { option_text: 'False', is_correct: false, order_index: 1 }
                      ] : question.options;
                      updateQuestion(questionIndex, { 
                        question_type: value,
                        options: newOptions
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

                  {(question.question_type === 'multiple_choice' || question.question_type === 'single_answer') && (
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
                      
                      {question.question_type === 'single_answer' ? (
                        <div className="space-y-3">
                          <RadioGroup
                            value={question.options.find(opt => opt.is_correct)?.order_index?.toString() || ""}
                            onValueChange={(value) => {
                              const selectedIndex = parseInt(value);
                              const updatedOptions = question.options.map((opt, i) => ({
                                ...opt,
                                is_correct: i === selectedIndex
                              }));
                              updateQuestion(questionIndex, { options: updatedOptions });
                            }}
                          >
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2 p-3 border rounded">
                                <Input
                                  value={option.option_text}
                                  onChange={(e) => updateOption(questionIndex, optionIndex, { option_text: e.target.value })}
                                  placeholder={`Option ${optionIndex + 1}`}
                                  className="flex-1"
                                />
                                
                                <OptionRow>
                                  <RadioGroupItem 
                                    value={optionIndex.toString()}
                                    id={`question_${questionIndex}_option_${optionIndex}`} 
                                  />
                                  <Label 
                                    htmlFor={`question_${questionIndex}_option_${optionIndex}`} 
                                    className="whitespace-nowrap cursor-pointer"
                                  >
                                    Correct
                                  </Label>
                                </OptionRow>
                                
                                {question.options.length > 2 && (
                                  <Button
                                    onClick={() => removeOption(questionIndex, optionIndex)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </RadioGroup>
                          
                          {validationErrors[questionIndex] && (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                              {validationErrors[questionIndex]}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <OptionList>
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2 p-3 border rounded">
                                <Input
                                  value={option.option_text}
                                  onChange={(e) => updateOption(questionIndex, optionIndex, { option_text: e.target.value })}
                                  placeholder={`Option ${optionIndex + 1}`}
                                  className="flex-1"
                                />
                                
                                <OptionRow>
                                  <Checkbox
                                    id={`question_${questionIndex}_option_${optionIndex}`}
                                    checked={option.is_correct}
                                    onCheckedChange={(checked) => {
                                      updateOption(questionIndex, optionIndex, { is_correct: checked as boolean });
                                    }}
                                  />
                                  <Label 
                                    htmlFor={`question_${questionIndex}_option_${optionIndex}`} 
                                    className="whitespace-nowrap cursor-pointer"
                                  >
                                    Correct
                                  </Label>
                                </OptionRow>
                                
                                {question.options.length > 2 && (
                                  <Button
                                    onClick={() => removeOption(questionIndex, optionIndex)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </OptionList>
                          
                          {validationErrors[questionIndex] && (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                              {validationErrors[questionIndex]}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {question.question_type === 'true_false' && (
                    <div className="space-y-3">
                      <Label>Select Correct Answer</Label>
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground mb-2">
                          Choose which option is correct:
                        </div>
                        <RadioGroup
                          value={question.options.find(opt => opt.is_correct)?.option_text || ""}
                          onValueChange={(value) => {
                            const updatedOptions = question.options.map(opt => ({
                              ...opt,
                              is_correct: opt.option_text === value
                            }));
                            updateQuestion(questionIndex, { options: updatedOptions });
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="True" id={`question_${questionIndex}_true`} />
                            <Label htmlFor={`question_${questionIndex}_true`} className="cursor-pointer">
                              True
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="False" id={`question_${questionIndex}_false`} />
                            <Label htmlFor={`question_${questionIndex}_false`} className="cursor-pointer">
                              False
                            </Label>
                          </div>
                        </RadioGroup>
                        
                        {validationErrors[questionIndex] && (
                          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                            {validationErrors[questionIndex]}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Quiz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}