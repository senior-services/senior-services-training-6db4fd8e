import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { QuizQuestion, QuizQuestionOption } from "@/types/quiz";

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
  const [formData, setFormData] = useState<QuizFormData>({
    title: "",
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
    const updatedOptions = question.options.filter((_, i) => i !== optionIndex);
    
    updateQuestion(questionIndex, { options: updatedOptions });
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const canSubmit = formData.title.trim() && formData.questions.length > 0 &&
    formData.questions.every(q => q.question_text.trim() && 
      ((q.question_type === 'multiple_choice' || q.question_type === 'single_answer') ? q.options.length >= 2 : true));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Quiz</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter quiz title"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter quiz description"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Questions</h3>
              <Button onClick={addQuestion} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

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
                    />
                  </div>

                  <div>
                    <Label>Question Type</Label>
                    <Select
                      value={question.question_type}
                      onValueChange={(value: any) => {
                        updateQuestion(questionIndex, { 
                          question_type: value,
                          options: value === 'true_false' ? [] : question.options
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
                      
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2 p-3 border rounded">
                          <Input
                            value={option.option_text}
                            onChange={(e) => updateOption(questionIndex, optionIndex, { option_text: e.target.value })}
                            placeholder={`Option ${optionIndex + 1}`}
                            className="flex-1"
                          />
                          <label className="flex items-center gap-2 whitespace-nowrap">
                            <input
                              type={question.question_type === 'single_answer' ? 'radio' : 'checkbox'}
                              name={question.question_type === 'single_answer' ? `question_${questionIndex}` : undefined}
                              checked={option.is_correct}
                              onChange={(e) => {
                                if (question.question_type === 'single_answer') {
                                  // For single answer, uncheck all other options first
                                  const updatedOptions = question.options.map((opt, i) => ({
                                    ...opt,
                                    is_correct: i === optionIndex ? e.target.checked : false
                                  }));
                                  updateQuestion(questionIndex, { options: updatedOptions });
                                } else {
                                  updateOption(questionIndex, optionIndex, { is_correct: e.target.checked });
                                }
                              }}
                              className="rounded"
                            />
                            Correct
                          </label>
                          <Button
                            onClick={() => removeOption(questionIndex, optionIndex)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.question_type === 'true_false' && (
                    <div className="text-sm text-muted-foreground">
                      True/False questions will be automatically generated with "True" and "False" options.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

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
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Quiz"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}