import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserPlus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { employeeOperations } from '@/services/api';
import type { EmployeeWithAssignments, Employee } from '@/types/employee';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AddEmployeeModal } from './AddEmployeeModal';
import { AssignVideosModal } from './AssignVideosModal';
import { logger } from '@/utils/logger';
import { format, differenceInDays, isPast } from 'date-fns';
import { quizOperations } from '@/services/quizService';
import { sanitizeText, createSafeDisplayName, validateUserRole } from '@/utils/security';

export const EmployeeManagement: React.FC<{
  onCountChange?: (count: number) => void;
}> = ({ onCountChange }) => {
  const [employees, setEmployees] = useState<EmployeeWithAssignments[]>([]);
  const [employeeVideos, setEmployeeVideos] = useState<Map<string, any[]>>(new Map());
  const [employeeQuizzes, setEmployeeQuizzes] = useState<Map<string, Map<string, any>>>(new Map());
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();

    // Set up real-time subscription for employee data changes
    let channel: any = null;
    try {
      channel = supabase
        .channel('employee-management')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'video_assignments'
        }, () => {
          logger.info('Video assignment changed, refreshing employees...');
          loadEmployees();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'employees'
        }, () => {
          logger.info('Employee changed, refreshing data...');
          loadEmployees();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'video_progress'
        }, () => {
          logger.info('Video progress changed, refreshing employees...');
          loadEmployees();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'quiz_attempts'
        }, () => {
          logger.info('Quiz attempt changed, refreshing employees...');
          loadEmployees();
        })
        .subscribe();
    } catch (error) {
      logger.error('Failed to set up real-time subscription for employee data', error as Error);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          logger.error('Failed to remove channel', error as Error);
        }
      }
    };
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await employeeOperations.getAll();
      
      if (data.success && data.data) {
        // Transform API data to match local types with sanitization
        const transformedEmployees: EmployeeWithAssignments[] = data.data.map(employee => ({
          id: employee.id,
          email: employee.email,
          full_name: createSafeDisplayName(employee.name || '', employee.email || ''), // Sanitized display name
          created_at: employee.created_at || new Date().toISOString(),
          updated_at: employee.updated_at || new Date().toISOString(),
          assignments: employee.assignments || []
        }));

        setEmployees(transformedEmployees);
        onCountChange?.(transformedEmployees.length);

        // Load quizzes and map quiz attempts per employee
        const { data: quizzesData } = await supabase
          .from('quizzes')
          .select('video_id');
        
        const videoIdsWithQuizzes = new Set(quizzesData?.map(quiz => quiz.video_id) || []);
        const videoMap = new Map();
        const quizMap = new Map();

        for (const employee of transformedEmployees) {
          if (employee.assignments && Array.isArray(employee.assignments)) {
            const assignmentsWithQuizInfo = employee.assignments.map(assignment => ({
              ...assignment,
              hasQuiz: videoIdsWithQuizzes.has(assignment.video_id)
            }));
            videoMap.set(employee.id, assignmentsWithQuizInfo);
          } else {
            videoMap.set(employee.id, []);
          }

          if (employee.email) {
            try {
              const quizAttempts = await quizOperations.getUserAttempts(employee.email);
              const videoQuizMap = new Map();
              
              for (const attempt of quizAttempts) {
                if (attempt.quiz?.video_id) {
                  const existingAttempt = videoQuizMap.get(attempt.quiz.video_id);
                  const currentAttemptDate = new Date(attempt.completed_at);
                  
                  if (!existingAttempt || new Date(existingAttempt.completed_at) < currentAttemptDate) {
                    videoQuizMap.set(attempt.quiz.video_id, {
                      score: attempt.score,
                      total_questions: attempt.total_questions,
                      completed_at: attempt.completed_at
                    });
                  }
                }
              }
              quizMap.set(employee.id, videoQuizMap);
            } catch (error) {
              logger.error(`Error loading quiz attempts for employee ${employee.email}:`, error);
              quizMap.set(employee.id, new Map());
            }
          } else {
            quizMap.set(employee.id, new Map());
          }
        }

        setEmployeeVideos(videoMap);
        setEmployeeQuizzes(quizMap);
      } else {
        throw new Error(data.error || 'Failed to load employees');
      }
    } catch (error) {
      logger.error('Error loading employees', error as Error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [onCountChange, toast]);

  const handleAddEmployee = useCallback((employee: Employee) => {
    setEmployees(prev => {
      const transformedEmployee: EmployeeWithAssignments = {
        id: employee.id,
        email: employee.email,
        full_name: createSafeDisplayName(employee.full_name || '', employee.email || ''),
        created_at: employee.created_at,
        updated_at: employee.updated_at,
        assignments: []
      };
      const updated = [...prev, transformedEmployee];
      onCountChange?.(updated.length);
      return updated;
    });
    setShowAddModal(false);
    toast({
      title: "Success",
      description: "Employee added successfully"
    });
  }, [onCountChange, toast]);

  const handleAssignVideos = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setShowAssignModal(true);
  }, []);

  const handleDeleteEmployee = async () => {
    if (!deleteConfirmEmployee) return;
    
    setIsDeleting(true);
    try {
      const result = await employeeOperations.delete(deleteConfirmEmployee.id);
      if (result.success) {
        setEmployees(prev => {
          const updated = prev.filter(emp => emp.id !== deleteConfirmEmployee.id);
          onCountChange?.(updated.length);
          return updated;
        });
        setDeleteConfirmEmployee(null);
        toast({
          title: "Success",
          description: "Employee deleted successfully"
        });
      } else {
        throw new Error(result.error || 'Failed to delete employee');
      }
    } catch (error) {
      logger.error('Error deleting employee', error as Error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleEmployeeExpanded = useCallback((employeeId: string) => {
    setExpandedEmployees(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(employeeId)) {
        newExpanded.delete(employeeId);
      } else {
        newExpanded.add(employeeId);
      }
      return newExpanded;
    });
  }, []);

  const getEmployeeStatus = (employeeId: string) => {
    const videos = employeeVideos.get(employeeId) || [];
    const requiredVideos = videos.filter(assignment => assignment.video_type === 'Required');
    
    if (requiredVideos.length === 0) {
      return <Badge variant="secondary">No Required Training</Badge>;
    }

    const completedRequired = requiredVideos.filter(assignment => {
      const quizAttempt = employeeQuizzes.get(employeeId)?.get(assignment.video_id);
      return !!quizAttempt;
    });

    const overdueRequired = requiredVideos.filter(assignment => {
      const quizAttempt = employeeQuizzes.get(employeeId)?.get(assignment.video_id);
      if (!!quizAttempt) return false;
      if (!assignment.due_date) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(assignment.due_date);
      due.setHours(0, 0, 0, 0);
      const daysUntilDue = differenceInDays(due, today);
      return isPast(due) && daysUntilDue < 0;
    });

    if (overdueRequired.length > 0) {
      return <Badge variant="destructive">{overdueRequired.length} Overdue</Badge>;
    }

    if (completedRequired.length === requiredVideos.length) {
      return <Badge className="bg-success text-success-foreground">All Training Complete</Badge>;
    }

    return <Badge variant="secondary">{completedRequired.length}/{requiredVideos.length} Complete</Badge>;
  };

  const getVideoStatus = (assignment: any, employeeId: string) => {
    const employeeQuizData = employeeQuizzes.get(employeeId);
    const quizAttempt = employeeQuizData?.get(assignment.video_id);
    
    if (quizAttempt) {
      return <Badge className="bg-success text-success-foreground">Completed</Badge>;
    }

    if (!assignment.due_date) {
      return <Badge variant="secondary">No Deadline</Badge>;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(assignment.due_date);
    due.setHours(0, 0, 0, 0);
    const daysUntilDue = differenceInDays(due, today);

    if (isPast(due) && daysUntilDue < 0) {
      return <Badge variant="destructive">Overdue ({Math.abs(daysUntilDue)} days)</Badge>;
    }

    if (daysUntilDue === 0) {
      return <Badge className="bg-warning text-warning-foreground">Due Today</Badge>;
    }

    if (daysUntilDue <= 7) {
      return <Badge className="bg-orange-500 text-white">Due in {daysUntilDue} days</Badge>;
    }

    return <Badge variant="secondary">Due in {daysUntilDue} days</Badge>;
  };

  const getQuizResults = (assignment: any, employeeId: string) => {
    const employeeQuizData = employeeQuizzes.get(employeeId);
    const quizAttempt = employeeQuizData?.get(assignment.video_id);
    
    if (!assignment.hasQuiz) {
      return <span className="text-muted-foreground">--</span>;
    }

    if (!quizAttempt) {
      return <span className="text-muted-foreground">Not Completed</span>;
    }

    const percentage = Math.round((quizAttempt.score / quizAttempt.total_questions) * 100);
    return <span>{percentage}% ({quizAttempt.score}/{quizAttempt.total_questions} Correct)</span>;
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employee Management</h2>
        <Button onClick={() => setShowAddModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">No employees found.</p>
            <Button onClick={() => setShowAddModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">NAME</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">EMAIL</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">STATUS</TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const isExpanded = expandedEmployees.has(employee.id);
                  return (
                    <React.Fragment key={employee.id}>
                      <TableRow className={`group transition-colors ${isExpanded ? 'border-b-0 bg-muted/50' : 'hover:bg-slate-100'}`}>
                        <TableCell className="py-3 font-medium">
                          <Collapsible
                            open={isExpanded}
                            onOpenChange={() => toggleEmployeeExpanded(employee.id)}
                          >
                            <CollapsibleTrigger asChild>
                               <div className="flex items-center gap-3 cursor-pointer" 
                                    role="button"
                                    tabIndex={0}
                                    aria-expanded={isExpanded}
                                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${sanitizeText(employee.full_name || employee.email?.split('@')[0] || 'Unknown')}`}
                                    onKeyDown={(e) => e.key === 'Enter' && toggleEmployeeExpanded(employee.id)}>
                                 <div className="flex items-center gap-2">
                                   {isExpanded ? (
                                     <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                   ) : (
                                     <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                   )}
                                   <span>{sanitizeText(employee.full_name || employee.email?.split('@')[0] || 'Unknown')}</span>
                                 </div>
                               </div>
                            </CollapsibleTrigger>
                          </Collapsible>
                        </TableCell>
                        <TableCell className="py-3">{sanitizeText(employee.email || '')}</TableCell>
                        <TableCell className="py-3">
                          {getEmployeeStatus(employee.id)}
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <div className="flex gap-2 justify-end">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleAssignVideos(employee)}
                               aria-label={`Assign videos to ${sanitizeText(employee.full_name || employee.email?.split('@')[0] || 'Unknown')}`}
                             >
                               Assign Videos
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => setDeleteConfirmEmployee(employee)}
                               aria-label={`Delete ${sanitizeText(employee.full_name || employee.email?.split('@')[0] || 'Unknown')}`}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {isExpanded && (
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={4} className="py-0">
                            <Collapsible open={isExpanded}>
                              <CollapsibleContent>
                                <div className="px-4 pb-4 ml-6">
                                  <div className="border-l-2 border-muted pl-4">
                                    {employeeVideos.get(employee.id)?.length === 0 ? (
                                      <p className="text-muted-foreground text-center py-4">
                                        No video assignments found for this employee.
                                      </p>
                                    ) : (
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="border-b">
                                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">VIDEO TITLE</TableHead>
                                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">QUIZ RESULTS</TableHead>
                                            <TableHead className="text-xs font-medium uppercase text-muted-foreground">STATUS</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {employeeVideos.get(employee.id)?.map((assignment: any) => (
                                            <TableRow key={assignment.video_id}>
                                              <TableCell>{sanitizeText(assignment.video_title || '')}</TableCell>
                                              <TableCell>{getQuizResults(assignment, employee.id)}</TableCell>
                                              <TableCell>{getVideoStatus(assignment, employee.id)}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    )}
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AddEmployeeModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onEmployeeAdded={handleAddEmployee}
      />

      <AssignVideosModal
        open={showAssignModal}
        onOpenChange={setShowAssignModal}
        employee={selectedEmployee}
        onAssignmentComplete={() => {
          setShowAssignModal(false);
          loadEmployees();
        }}
      />

      <AlertDialog open={!!deleteConfirmEmployee} onOpenChange={() => setDeleteConfirmEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteConfirmEmployee?.full_name || deleteConfirmEmployee?.email}? 
              This will also remove all their video assignments and progress. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Employee'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};