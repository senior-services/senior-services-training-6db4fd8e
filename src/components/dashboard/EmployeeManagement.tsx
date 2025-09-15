import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserPlus, Mail, Users, Archive, ArchiveRestore, Edit, Clock, CheckCircle, XCircle, HelpCircle, Play, ChevronDown, ChevronUp, ChevronRight, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { IconButtonWithTooltip } from '@/components/ui/icon-button-with-tooltip';
import { getTooltipText } from '@/utils/tooltipText';
import * as XLSX from 'xlsx';
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

export const EmployeeManagement: React.FC<{
  onCountChange?: (count: number) => void;
}> = ({
  onCountChange
}) => {
  const [employees, setEmployees] = useState<EmployeeWithAssignments[]>([]);
  const [archivedEmployees, setArchivedEmployees] = useState<{ id: string; email: string; full_name: string; archived_at: string }[]>([]);
  const [employeeVideos, setEmployeeVideos] = useState<Map<string, any[]>>(new Map());
  const [employeeQuizzes, setEmployeeQuizzes] = useState<Map<string, Map<string, any>>>(new Map());
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [archiveConfirmEmployee, setArchiveConfirmEmployee] = useState<Employee | null>(null);
  const [unarchiveConfirmEmployee, setUnarchiveConfirmEmployee] = useState<{ id: string; email: string; full_name: string } | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [sortColumn, setSortColumn] = useState<'employee' | 'status' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [videoSortState, setVideoSortState] = useState<Map<string, { column: 'title' | 'status'; direction: 'asc' | 'desc' }>>(new Map());
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleSort = (column: 'employee' | 'status') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleVideoSort = (employeeId: string, column: 'title' | 'status') => {
    const currentSort = videoSortState.get(employeeId);
    const newSort = {
      column,
      direction: (currentSort?.column === column && currentSort.direction === 'asc' ? 'desc' : 'asc') as 'asc' | 'desc'
    };
    setVideoSortState(prev => new Map(prev).set(employeeId, newSort));
  };

  const getSortedVideosForEmployee = (employeeId: string, videos: any[]) => {
    const sortState = videoSortState.get(employeeId);
    if (!sortState) return videos;

    return [...videos].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      if (sortState.column === 'title') {
        aValue = a.video_title || '';
        bValue = b.video_title || '';
      } else {
        // status sorting - get priority values based on getDeadlineBadge logic
        const getStatusPriority = (assignment: any) => {
          const employeeQuizData = employeeQuizzes.get(employeeId);
          const quizAttempt = employeeQuizData?.get(assignment.video_id);
          const isCompleted = assignment.progress_percent >= 100 || !!quizAttempt;
          
          if (isCompleted) return 7; // Completed - lowest priority
          if (!assignment.due_date) return 6; // No deadline
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const due = new Date(assignment.due_date);
          due.setHours(0, 0, 0, 0);
          const daysUntilDue = differenceInDays(due, today);
          
          if (isPast(due) && daysUntilDue < 0) return 1; // Overdue - highest priority
          if (daysUntilDue === 0) return 2; // Due Today
          if (daysUntilDue <= 7) return 3; // Due ≤ 7 days
          if (daysUntilDue <= 30) return 4; // Due ≤ 30 days
          return 5; // Due > 30 days
        };

        aValue = getStatusPriority(a).toString();
        bValue = getStatusPriority(b).toString();
      }

      const comparison = aValue.localeCompare(bValue);
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  };
  
  const getSortedEmployees = () => {
    if (!sortColumn) return employees;
    return [...employees].sort((a, b) => {
      let aValue: string;
      let bValue: string;
      if (sortColumn === 'employee') {
        aValue = a.full_name || a.email || '';
        bValue = b.full_name || b.email || '';
      } else {
        // status
        const aVideos = employeeVideos.get(a.id) || [];
        const bVideos = employeeVideos.get(b.id) || [];

        // Calculate status for employee A
        const aRequiredVideos = aVideos.filter(assignment => assignment.video_type === 'Required');
        const aCompletedRequired = aRequiredVideos.filter(assignment => assignment.progress_percent >= 100);
        const aOverdueRequired = aRequiredVideos.filter(assignment => {
          if (assignment.progress_percent >= 100) return false;
          if (!assignment.due_date) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const due = new Date(assignment.due_date);
          due.setHours(0, 0, 0, 0);
          const daysUntilDue = differenceInDays(due, today);
          return isPast(due) && daysUntilDue < 0;
        });

        // Calculate status for employee B
        const bRequiredVideos = bVideos.filter(assignment => assignment.video_type === 'Required');
        const bCompletedRequired = bRequiredVideos.filter(assignment => assignment.progress_percent >= 100);
        const bOverdueRequired = bRequiredVideos.filter(assignment => {
          if (assignment.progress_percent >= 100) return false;
          if (!assignment.due_date) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const due = new Date(assignment.due_date);
          due.setHours(0, 0, 0, 0);
          const daysUntilDue = differenceInDays(due, today);
          return isPast(due) && daysUntilDue < 0;
        });

        // Status priority: 4=overdue, 3=incomplete, 2=completed, 1=no required training
        let aPriority = 1; // No required training
        if (aRequiredVideos.length > 0) {
          if (aOverdueRequired.length > 0) {
            aPriority = 4; // Overdue
          } else if (aCompletedRequired.length === aRequiredVideos.length) {
            aPriority = 2; // All training complete
          } else {
            aPriority = 3; // Incomplete training
          }
        }
        let bPriority = 1; // No required training
        if (bRequiredVideos.length > 0) {
          if (bOverdueRequired.length > 0) {
            bPriority = 4; // Overdue
          } else if (bCompletedRequired.length === bRequiredVideos.length) {
            bPriority = 2; // All training complete
          } else {
            bPriority = 3; // Incomplete training
          }
        }
        aValue = aPriority.toString();
        bValue = bPriority.toString();
      }
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  useEffect(() => {
    loadEmployees();
    loadArchivedEmployees();

    // Smart refresh: Use separate channels for better performance
    let activeChannel: any = null;
    let archivedChannel: any = null;
    
    try {
      activeChannel = supabase.channel('active-employee-management')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'video_assignments' 
        }, () => {
          logger.info('Video assignment changed, refreshing active employees...');
          loadEmployees();
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'employees',
          filter: 'archived=eq.false'
        }, () => {
          logger.info('Active employee changed, refreshing data...');
          loadEmployees();
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'video_progress' 
        }, () => {
          logger.info('Video progress changed, refreshing active employees...');
          loadEmployees();
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'quiz_attempts' 
        }, () => {
          logger.info('Quiz attempt changed, refreshing active employees...');
          loadEmployees();
        })
        .subscribe();

      archivedChannel = supabase.channel('archived-employee-management')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'employees',
          filter: 'archived=eq.true'
        }, () => {
          logger.info('Archived employee changed, refreshing archived employees...');
          loadArchivedEmployees();
        })
        .subscribe();
        
    } catch (error) {
      logger.error('Failed to set up real-time subscription for employee data', error as Error);
    }
    
    return () => {
      if (activeChannel) {
        try {
          supabase.removeChannel(activeChannel);
        } catch (error) {
          logger.error('Failed to remove active channel', error as Error);
        }
      }
      if (archivedChannel) {
        try {
          supabase.removeChannel(archivedChannel);
        } catch (error) {
          logger.error('Failed to remove archived channel', error as Error);
        }
      }
    };
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeOperations.getAll();
      if (data.success && data.data) {
        // Transform API data to match local types
        const transformedEmployees: EmployeeWithAssignments[] = data.data.map(employee => ({
          id: employee.id,
          email: employee.email,
          full_name: employee.name, // API uses 'name', component expects 'full_name'
          created_at: employee.created_at || new Date().toISOString(),
          updated_at: employee.updated_at || new Date().toISOString(),
          assignments: employee.assignments || []
        }));
        setEmployees(transformedEmployees);
        onCountChange?.(transformedEmployees.length);

        // Load quizzes and map quiz attempts per employee
        const { data: quizzesData } = await supabase.from('quizzes').select('video_id');
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
                    if (existingAttempt) {
                      logger.info(`Replacing older quiz attempt for video ${attempt.quiz.video_id} with newer attempt from ${attempt.completed_at}`);
                    }
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
  };

  const loadArchivedEmployees = async () => {
    setLoadingArchived(true);
    try {
      const result = await employeeOperations.getArchived();
      
      if (!result.success) {
        logger.error('Error loading archived employees:', result.error);
        return;
      }

      setArchivedEmployees(result.data);
    } catch (error) {
      logger.error('Unexpected error loading archived employees:', error);
    } finally {
      setLoadingArchived(false);
    }
  };

  const handleAddEmployee = (employee: Employee) => {
    setEmployees(prev => {
      const transformedEmployee: EmployeeWithAssignments = {
        id: employee.id,
        email: employee.email,
        full_name: employee.full_name || employee.email?.split('@')[0] || 'Unknown',
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
  };

  const handleAssignVideos = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowAssignModal(true);
  };

  const handleArchiveEmployee = async () => {
    if (!archiveConfirmEmployee) return;
    setIsArchiving(true);
    try {
      const result = await employeeOperations.archive(archiveConfirmEmployee.id);
      if (result.success) {
        setEmployees(prev => {
          const updated = prev.filter(emp => emp.id !== archiveConfirmEmployee.id);
          onCountChange?.(updated.length);
          return updated;
        });
        setArchiveConfirmEmployee(null);
        await loadArchivedEmployees(); // Refresh archived list
        toast({
          title: "Success",
          description: "Employee archived successfully"
        });
      } else {
        throw new Error(result.error || 'Failed to archive employee');
      }
    } catch (error) {
      logger.error('Error archiving employee', error as Error);
      toast({
        title: "Error",
        description: "Failed to archive employee",
        variant: "destructive"
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchiveEmployee = async () => {
    if (!unarchiveConfirmEmployee) return;
    try {
      const result = await employeeOperations.unarchive(unarchiveConfirmEmployee.id);
      if (result.success) {
        setUnarchiveConfirmEmployee(null);
        await loadEmployees(); // Refresh active list
        await loadArchivedEmployees(); // Refresh archived list
        toast({
          title: "Success",
          description: "Employee unarchived successfully"
        });
      } else {
        throw new Error(result.error || 'Failed to unarchive employee');
      }
    } catch (error) {
      logger.error('Error unarchiving employee', error as Error);
      toast({
        title: "Error",
        description: "Failed to unarchive employee",
        variant: "destructive"
      });
    }
  };

  const toggleEmployeeExpanded = (employeeId: string) => {
    setExpandedEmployees(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(employeeId)) {
        newExpanded.delete(employeeId);
      } else {
        newExpanded.add(employeeId);
      }
      return newExpanded;
    });
  };

  // Helper function to get deadline badge props
  const getDeadlineBadge = (dueDate: string | null, progressPercent: number = 0, hasQuizAttempt: boolean = false, completedAt?: string | null) => {
    const isCompleted = progressPercent >= 100 || hasQuizAttempt;
    if (isCompleted) {
      const completionText = completedAt 
        ? `Completed (${format(new Date(completedAt), 'MMM dd, yyyy')})`
        : "Completed";
      return {
        variant: "ghost-success" as const,
        showIcon: true,
        text: completionText
      };
    }
    if (!dueDate) {
      return {
        variant: "ghost-tertiary" as const,
        showIcon: true,
        text: "No deadline"
      };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const daysUntilDue = differenceInDays(due, today);
    
    if (isPast(due) && daysUntilDue < 0) {
      return {
        variant: "ghost-destructive" as const,
        showIcon: true,
        text: "Overdue"
      };
    }
    if (daysUntilDue === 0) {
      return {
        variant: "ghost-warning" as const,
        showIcon: true,
        text: "Due Today"
      };
    }
    if (daysUntilDue <= 7) {
      return {
        variant: "ghost-tertiary" as const,
        showIcon: true,
        text: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`
      };
    }
    if (daysUntilDue <= 30) {
      return {
        variant: "ghost-tertiary" as const,
        showIcon: true,
        text: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`
      };
    }
    return {
      variant: "ghost-tertiary" as const,
      showIcon: true,
      text: "Due in over a month"
    };
  };

  // Helper function to format due date for Excel export
  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) {
      return "No deadline";
    }
    return format(new Date(dueDate), 'MMM dd, yyyy');
  };

  // Helper function to format completion date for Excel export
  const formatCompletionDate = (progressPercent: number = 0, hasQuizAttempt: boolean = false, completedAt?: string | null) => {
    const isCompleted = progressPercent >= 100 || hasQuizAttempt;
    if (isCompleted) {
      return completedAt ? format(new Date(completedAt), 'MMM dd, yyyy') : "Completed (no date)";
    }
    return "Not completed";
  };

  // Helper function to get assignment status for Excel export
  const getAssignmentStatus = (assignment: any, hasQuizAttempt: boolean = false) => {
    const isCompleted = assignment.progress_percent >= 100 || hasQuizAttempt;
    if (isCompleted) {
      return "Completed";
    }
    if (!assignment.due_date) {
      return "No deadline";
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(assignment.due_date);
    due.setHours(0, 0, 0, 0);
    const daysUntilDue = differenceInDays(due, today);
    
    if (isPast(due) && daysUntilDue < 0) {
      return "Overdue";
    }
    if (daysUntilDue === 0) {
      return "Due Today";
    }
    if (daysUntilDue <= 7) {
      return `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`;
    }
    if (daysUntilDue <= 30) {
      return `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`;
    }
    return "Due in over a month";
  };

  // Download employee data as Excel
  const handleDownloadData = async () => {
    setIsDownloading(true);
    try {
      const exportData: any[] = [];

      employees.forEach(employee => {
        const assignments = employeeVideos.get(employee.id) || [];
        const employeeQuizData = employeeQuizzes.get(employee.id) || new Map();

        if (assignments.length === 0) {
          // Employee with no assignments
          exportData.push({
            'Employee Name': employee.full_name || employee.email,
            'Employee Email': employee.email,
            'Video Title': 'No assignments',
            'Video Type': '',
            'Progress (%)': '',
            'Due Date': '',
            'Completion Date': '',
            'Status': 'No assignments',
            'Quiz Score': '',
            'Quiz Total Questions': '',
            'Quiz Completion Date': ''
          });
        } else {
          assignments.forEach(assignment => {
            const quizAttempt = employeeQuizData.get(assignment.video_id);
            const hasQuizAttempt = !!quizAttempt;

            exportData.push({
              'Employee Name': employee.full_name || employee.email,
              'Employee Email': employee.email,
              'Video Title': assignment.video_title,
              'Video Type': assignment.video_type,
              'Progress (%)': assignment.progress_percent,
              'Due Date': formatDueDate(assignment.due_date),
              'Completion Date': formatCompletionDate(assignment.progress_percent, hasQuizAttempt, assignment.completed_at),
              'Status': getAssignmentStatus(assignment, hasQuizAttempt),
              'Quiz Score': quizAttempt?.score || '',
              'Quiz Total Questions': quizAttempt?.total_questions || '',
              'Quiz Completion Date': quizAttempt?.completed_at ? format(new Date(quizAttempt.completed_at), 'MMM dd, yyyy') : ''
            });
          });
        }
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employee Training Data');

      const fileName = `employee_training_data_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Success",
        description: "Employee training data exported successfully"
      });
    } catch (error) {
      logger.error('Error downloading employee data:', error);
      toast({
        title: "Error",
        description: "Failed to export employee data",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingSkeleton />
        </CardContent>
      </Card>
    );
  }

  const sortedEmployees = getSortedEmployees();

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Employee Management</h2>
              <p className="text-sm text-muted-foreground">
                Manage employee accounts, assign training videos, and track progress
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownloadData}
              variant="outline"
              size="sm"
              disabled={isDownloading}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "Exporting..." : "Download Data"}
            </Button>
            <Button onClick={() => setShowAddModal(true)} size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* Active Employees Table */}
        {employees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No employees found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by adding your first employee to the system.
            </p>
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Your First Employee
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <span className="sr-only">Expand</span>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('employee')}
                      className="h-auto p-0 font-medium hover:bg-transparent justify-start"
                      aria-label="Sort by employee name"
                    >
                      Employee Name
                      {sortColumn === 'employee' ? (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('status')}
                      className="h-auto p-0 font-medium hover:bg-transparent justify-start"
                      aria-label="Sort by status"
                    >
                      Status
                      {sortColumn === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEmployees.map((employee) => {
                  const assignments = employeeVideos.get(employee.id) || [];
                  const employeeQuizData = employeeQuizzes.get(employee.id) || new Map();
                  const isExpanded = expandedEmployees.has(employee.id);

                  // Calculate status based on required videos
                  const requiredVideos = assignments.filter(assignment => assignment.video_type === 'Required');
                  const completedRequired = requiredVideos.filter(assignment => assignment.progress_percent >= 100);
                  const overdueRequired = requiredVideos.filter(assignment => {
                    if (assignment.progress_percent >= 100) return false;
                    if (!assignment.due_date) return false;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const due = new Date(assignment.due_date);
                    due.setHours(0, 0, 0, 0);
                    const daysUntilDue = differenceInDays(due, today);
                    return isPast(due) && daysUntilDue < 0;
                  });

                  let statusBadge;
                  if (requiredVideos.length === 0) {
                    statusBadge = (
                      <Badge variant="ghost-secondary" className="gap-1">
                        <HelpCircle className="h-3 w-3" />
                        No required training
                      </Badge>
                    );
                  } else if (overdueRequired.length > 0) {
                    statusBadge = (
                      <Badge variant="ghost-destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Overdue ({overdueRequired.length})
                      </Badge>
                    );
                  } else if (completedRequired.length === requiredVideos.length) {
                    statusBadge = (
                      <Badge variant="ghost-success" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        All training complete
                      </Badge>
                    );
                  } else {
                    statusBadge = (
                      <Badge variant="ghost-tertiary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Incomplete training ({completedRequired.length}/{requiredVideos.length})
                      </Badge>
                    );
                  }

                  return (
                    <React.Fragment key={employee.id}>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEmployeeExpanded(employee.id)}
                            className="h-8 w-8 p-0 hover:bg-muted"
                            aria-label={isExpanded ? "Collapse employee details" : "Expand employee details"}
                            aria-expanded={isExpanded}
                            aria-controls={`employee-${employee.id}-details`}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{employee.full_name || employee.email}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {employee.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <IconButtonWithTooltip
                              icon={<UserPlus className="h-4 w-4" />}
                              tooltip={getTooltipText('assign-videos')}
                              onClick={() => handleAssignVideos(employee)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            />
                            <IconButtonWithTooltip
                              icon={<Archive className="h-4 w-4" />}
                              tooltip={getTooltipText('archive-employee')}
                              onClick={() => setArchiveConfirmEmployee(employee)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={4} className="p-0">
                            <Collapsible open={true}>
                              <CollapsibleContent 
                                id={`employee-${employee.id}-details`}
                                className="border-t bg-muted/25 p-4"
                              >
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Video Assignments ({assignments.length})</h4>
                                    {assignments.length > 0 && (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>Sort by:</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleVideoSort(employee.id, 'title')}
                                          className="h-6 px-2 text-xs"
                                        >
                                          Title
                                          {videoSortState.get(employee.id)?.column === 'title' ? (
                                            videoSortState.get(employee.id)?.direction === 'asc' ? 
                                              <ArrowUp className="ml-1 h-3 w-3" /> : 
                                              <ArrowDown className="ml-1 h-3 w-3" />
                                          ) : (
                                            <ArrowUpDown className="ml-1 h-3 w-3" />
                                          )}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleVideoSort(employee.id, 'status')}
                                          className="h-6 px-2 text-xs"
                                        >
                                          Status
                                          {videoSortState.get(employee.id)?.column === 'status' ? (
                                            videoSortState.get(employee.id)?.direction === 'asc' ? 
                                              <ArrowUp className="ml-1 h-3 w-3" /> : 
                                              <ArrowDown className="ml-1 h-3 w-3" />
                                          ) : (
                                            <ArrowUpDown className="ml-1 h-3 w-3" />
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </div>

                                  {assignments.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                      <Play className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                      <p>No video assignments yet</p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAssignVideos(employee)}
                                        className="mt-2"
                                      >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Assign Videos
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {getSortedVideosForEmployee(employee.id, assignments).map((assignment) => {
                                        const quizAttempt = employeeQuizData.get(assignment.video_id);
                                        const hasQuizAttempt = !!quizAttempt;
                                        const badge = getDeadlineBadge(
                                          assignment.due_date, 
                                          assignment.progress_percent, 
                                          hasQuizAttempt,
                                          assignment.completed_at
                                        );

                                        return (
                                          <div
                                            key={assignment.assignment_id}
                                            className="flex items-center justify-between p-3 bg-card rounded-md border"
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-medium text-sm">{assignment.video_title}</span>
                                                  <Badge variant={assignment.video_type === 'Required' ? 'destructive' : 'secondary'} className="text-xs">
                                                    {assignment.video_type}
                                                  </Badge>
                                  {assignment.hasQuiz && (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                      <HelpCircle className="h-3 w-3" />
                                      Quiz
                                    </Badge>
                                  )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1">
                                                  <span className="text-xs text-muted-foreground">
                                                    Progress: {assignment.progress_percent}%
                                                  </span>
                                                  {assignment.due_date && (
                                                    <span className="text-xs text-muted-foreground">
                                                      Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                                                    </span>
                                                  )}
                                                  {quizAttempt && (
                                                    <span className="text-xs text-muted-foreground">
                                                      Quiz: {quizAttempt.score}/{quizAttempt.total_questions}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                            <Badge variant={badge.variant} className="gap-1">
                                              {badge.showIcon && (
                                                badge.variant === "ghost-success" ? <CheckCircle className="h-3 w-3" /> :
                                                badge.variant === "ghost-destructive" ? <XCircle className="h-3 w-3" /> :
                                                badge.variant === "ghost-warning" ? <Clock className="h-3 w-3" /> :
                                                <Clock className="h-3 w-3" />
                                              )}
                                              {badge.text}
                                            </Badge>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
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
          </div>
        )}
      </CardContent>

      {/* Archived Employees Section */}
      <CardContent className="pt-0">
        <Collapsible open={showArchived} onOpenChange={setShowArchived}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between p-4 h-auto border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50"
              aria-expanded={showArchived}
              aria-controls="archived-employees-section"
            >
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Archived Employees ({archivedEmployees.length})
                </span>
              </div>
              {showArchived ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent id="archived-employees-section" className="space-y-4 mt-4">
            {loadingArchived ? (
              <div className="text-center py-8 text-muted-foreground">
                <div role="status" aria-live="polite">Loading archived employees...</div>
              </div>
            ) : archivedEmployees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Archive className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No archived employees</p>
              </div>
            ) : (
              <div className="rounded-lg border border-muted bg-muted/30">
                <Table>
                  <TableHeader>
                    <TableRow className="border-muted">
                      <TableHead className="text-muted-foreground">Employee Name</TableHead>
                      <TableHead className="text-muted-foreground">Email</TableHead>
                      <TableHead className="text-muted-foreground">Archived Date</TableHead>
                      <TableHead className="text-muted-foreground w-[100px]">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {archivedEmployees.map((employee) => (
                      <TableRow key={employee.id} className="border-muted">
                        <TableCell className="font-medium text-muted-foreground">
                          {employee.full_name || employee.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {employee.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(employee.archived_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <IconButtonWithTooltip
                            icon={<ArchiveRestore className="h-4 w-4" />}
                            tooltip={getTooltipText('unarchive-employee')}
                            onClick={() => setUnarchiveConfirmEmployee(employee)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      <AddEmployeeModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddEmployee={handleAddEmployee}
      />
      
      <AssignVideosModal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        employeeId={selectedEmployee?.id || null}
        onAssignVideos={() => {
          setShowAssignModal(false);
          loadEmployees();
        }}
      />

      <AlertDialog open={!!archiveConfirmEmployee} onOpenChange={() => setArchiveConfirmEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this employee? They will be moved to the archived employees section and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleArchiveEmployee}
              disabled={isArchiving}
            >
              {isArchiving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!unarchiveConfirmEmployee} onOpenChange={() => setUnarchiveConfirmEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unarchive Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unarchive this employee? They will be restored to the active employees list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnarchiveEmployee}>
              Unarchive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
