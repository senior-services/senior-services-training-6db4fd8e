import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserPlus, Trash2, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { employeeOperations } from '@/services/api';
import { IconButtonWithTooltip } from '@/components/ui/icon-button-with-tooltip';
import { getTooltipText } from '@/utils/tooltipText';
import type { EmployeeWithAssignments, Employee, EmployeeAssignmentWithProgress } from '@/types/employee';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AddEmployeeModal } from './AddEmployeeModal';
import { AssignVideosModal } from './AssignVideosModal';
import { logger } from '@/utils/logger';
import { format, differenceInDays, isPast } from 'date-fns';
import { quizOperations } from '@/services/quizService';
import { sanitizeText, createSafeDisplayName, validateUserRole } from '@/utils/security';
import * as XLSX from 'xlsx';
export const EmployeeManagement: React.FC<{
  onCountChange?: (count: number) => void;
}> = ({
  onCountChange
}) => {
  const [employees, setEmployees] = useState<EmployeeWithAssignments[]>([]);
  const [employeeVideos, setEmployeeVideos] = useState<Map<string, any[]>>(new Map());
  const [employeeQuizzes, setEmployeeQuizzes] = useState<Map<string, Map<string, any>>>(new Map());
  
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortColumn, setSortColumn] = useState<'name' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const {
    toast
  } = useToast();
  useEffect(() => {
    loadEmployees();

    // Set up real-time subscription for employee data changes
    let channel: any = null;
    try {
      channel = supabase.channel('employee-management').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'video_assignments'
      }, () => {
        logger.info('Video assignment changed, refreshing employees...');
        loadEmployees();
      }).on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employees'
      }, () => {
        logger.info('Employee changed, refreshing data...');
        loadEmployees();
      }).on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'video_progress'
      }, () => {
        logger.info('Video progress changed, refreshing employees...');
        loadEmployees();
      }).on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'quiz_attempts'
      }, () => {
        logger.info('Quiz attempt changed, refreshing employees...');
        loadEmployees();
      }).subscribe();
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
  const loadEmployees = useCallback(async (silentRefresh = false) => {
    try {
      if (!silentRefresh) {
        setLoading(true);
      }
      const data = await employeeOperations.getAll();
      if (data.success && data.data) {
        // Transform API data to match local types with sanitization
        const transformedEmployees: EmployeeWithAssignments[] = data.data.map(employee => ({
          id: employee.id,
          email: employee.email,
          full_name: createSafeDisplayName(employee.name || '', employee.email || ''),
          // Sanitized display name
          created_at: employee.created_at || new Date().toISOString(),
          updated_at: employee.updated_at || new Date().toISOString(),
          assignments: employee.assignments || []
        }));
        setEmployees(transformedEmployees);
        onCountChange?.(transformedEmployees.length);

        // Load quizzes and map quiz attempts per employee
        const {
          data: quizzesData
        } = await supabase.from('quizzes').select('video_id');
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
      if (!silentRefresh) {
        setLoading(false);
      }
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
  const handleSort = useCallback(() => {
    if (sortColumn === 'name') {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn('name');
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);
  const getSortedEmployees = useMemo(() => {
    if (!sortColumn) return employees;
    return [...employees].sort((a, b) => {
      const aName = a.full_name || a.email?.split('@')[0] || '';
      const bName = b.full_name || b.email?.split('@')[0] || '';
      const comparison = aName.localeCompare(bName);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [employees, sortColumn, sortDirection]);
  const getEmployeeStatus = (employeeId: string) => {
    const videos = employeeVideos.get(employeeId) || [];
    const requiredVideos = videos.filter(assignment => assignment.video_type === 'Required');
    if (requiredVideos.length === 0) {
      return <Badge variant="secondary">No Required Training</Badge>;
    }

    // Helper function to check if assignment is completed (same logic as getVideoStatus)
    const isAssignmentCompleted = (assignment: EmployeeAssignmentWithProgress) => {
      const quizAttempt = employeeQuizzes.get(employeeId)?.get(assignment.video_id);
      const videoCompleted = assignment.progress_percent === 100 || assignment.completed_at;
      if (assignment.hasQuiz) {
        // For videos with quiz: require both video and quiz completion
        return videoCompleted && quizAttempt;
      } else {
        // For videos without quiz: only require video completion
        return videoCompleted;
      }
    };
    const completedRequired = requiredVideos.filter(assignment => {
      return isAssignmentCompleted(assignment);
    });
    const overdueRequired = requiredVideos.filter(assignment => {
      if (isAssignmentCompleted(assignment)) return false;
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
      return <Badge variant="success">All Training Complete</Badge>;
    }
    return <Badge variant="secondary">{completedRequired.length}/{requiredVideos.length} Complete</Badge>;
  };
  const exportToExcel = useCallback(() => {
    const exportData: any[] = [];
    employees.forEach(employee => {
      const videos = employeeVideos.get(employee.id) || [];
      const employeeName = employee.full_name || employee.email?.split('@')[0] || 'Unknown';
      const employeeEmail = employee.email || '';
      if (videos.length === 0) {
        // Employee with no assignments
        exportData.push({
          Name: employeeName,
          Email: employeeEmail,
          'Video Title': 'No assignments',
          Status: 'No Required Training',
          'Date': '--',
          'Quiz Results': '--'
        });
      } else {
        // Employee with video assignments
        videos.forEach(assignment => {
          const employeeQuizData = employeeQuizzes.get(employee.id);
          const quizAttempt = employeeQuizData?.get(assignment.video_id);

          // Get status
          let status = 'Pending';
          if (quizAttempt) {
            status = 'Completed';
          } else if (assignment.due_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(assignment.due_date);
            due.setHours(0, 0, 0, 0);
            const daysUntilDue = differenceInDays(due, today);
            if (isPast(due) && daysUntilDue < 0) {
              status = 'Overdue';
            } else if (daysUntilDue === 0) {
              status = 'Due Today';
            } else if (daysUntilDue <= 7) {
              status = 'Due';
            } else {
              status = 'Due';
            }
          } else {
            status = 'No Deadline';
          }

          // Get quiz results
          let quizResults = '--';
          if (!assignment.hasQuiz) {
            quizResults = '--';
          } else if (!quizAttempt) {
            quizResults = 'Not Completed';
          } else {
            const percentage = Math.round(quizAttempt.score / quizAttempt.total_questions * 100);
            quizResults = `${percentage}% (${quizAttempt.score}/${quizAttempt.total_questions} Correct)`;
          }

          // Get completion date - show due date for non-completed, completion date for completed
          let completionDate = '--';
          const isCompleted = assignment.completed_at || quizAttempt && quizAttempt.completed_at;
          if (isCompleted) {
            // Show completion date for completed items
            if (quizAttempt && quizAttempt.completed_at) {
              completionDate = format(new Date(quizAttempt.completed_at), 'MMM dd, yyyy');
            } else if (assignment.completed_at) {
              completionDate = format(new Date(assignment.completed_at), 'MMM dd, yyyy');
            }
          } else if (assignment.due_date) {
            // Show due date for non-completed items
            completionDate = format(new Date(assignment.due_date), 'MMM dd, yyyy');
          }
          exportData.push({
            Name: employeeName,
            Email: employeeEmail,
            'Video Title': assignment.video_title || '',
            Status: status,
            'Date': completionDate,
            'Quiz Results': quizResults
          });
        });
      }
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Training Data');

    // Generate filename with current date
    const now = new Date();
    const filename = `employee_training_data_${format(now, 'yyyy-MM-dd')}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, filename);
    toast({
      title: "Success",
      description: "Employee training data exported successfully"
    });
  }, [employees, employeeVideos, employeeQuizzes, toast]);
  if (loading) {
    return <LoadingSkeleton />;
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Employee Management</h3>
          <p className="text-muted-foreground">Manage employees and track their training progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Download Data
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {employees.length === 0 ? <Card className="shadow-md">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">No employees found.</p>
            <Button onClick={() => setShowAddModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </CardContent>
        </Card> : <Card className="shadow-md">
          <CardContent className="p-0">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead aria-sort={sortColumn === 'name' ? sortDirection === 'asc' ? 'ascending' : 'descending' : undefined}>
                    <Button variant="ghost" onClick={handleSort} className="text-xs uppercase text-muted-foreground p-0 h-auto hover:bg-transparent hover:text-primary hover:shadow-none group" aria-label={`Sort by name ${sortColumn === 'name' ? sortDirection === 'asc' ? 'descending' : 'ascending' : 'ascending'}`}>
                      Name
                      {sortColumn === 'name' ? sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:text-primary group-hover:opacity-100" />}
                    </Button>
                  </TableHead>
                  
                  <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">STATUS</TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedEmployees.map(employee => (
                  <TableRow key={employee.id}>
                    <TableCell className="py-3 font-medium">
                      <div className="flex flex-col">
                        <span>{sanitizeText(employee.full_name || employee.email?.split('@')[0] || 'Unknown')}</span>
                        {employee.email && (
                          <span 
                            className="text-xs text-muted-foreground font-normal truncate max-w-[200px]" 
                            title={employee.email}
                          >
                            {sanitizeText(employee.email)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {getEmployeeStatus(employee.id)}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleAssignVideos(employee)} 
                          aria-label={`Edit assignments for ${sanitizeText(employee.full_name || employee.email?.split('@')[0] || 'Unknown')}`}
                        >
                          Edit Assignments
                        </Button>
                        <IconButtonWithTooltip 
                          icon={Trash2} 
                          tooltip={getTooltipText('delete-item', {
                            name: sanitizeText(employee.full_name || employee.email?.split('@')[0] || 'Unknown')
                          })} 
                          onClick={() => setDeleteConfirmEmployee(employee)} 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive" 
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>}

      <AddEmployeeModal open={showAddModal} onOpenChange={setShowAddModal} onEmployeeAdded={handleAddEmployee} />

      <AssignVideosModal open={showAssignModal} onOpenChange={setShowAssignModal} employee={selectedEmployee} onAssignmentComplete={loadEmployees} />

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
    </div>;
};