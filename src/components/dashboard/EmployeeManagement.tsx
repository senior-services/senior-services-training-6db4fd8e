import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserPlus, Mail, Users, Clock, CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronUp, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Edit } from 'lucide-react';
import { IconButtonWithTooltip } from '@/components/ui/icon-button-with-tooltip';
import { getTooltipText } from '@/utils/tooltipText';
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
import { sanitizeText, createSafeDisplayName } from '@/utils/security';
import { createTableAriaProps, createButtonAriaProps, announceToScreenReader } from '@/utils/accessibility';
export const EmployeeManagement: React.FC<{
  onCountChange?: (count: number) => void;
}> = ({
  onCountChange
}) => {
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
  const [sortColumn, setSortColumn] = useState<'employee' | 'status' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [videoSortState, setVideoSortState] = useState<Map<string, {
    column: 'title' | 'status' | 'quiz';
    direction: 'asc' | 'desc';
  }>>(new Map());
  const {
    toast
  } = useToast();
  const handleSort = (column: 'employee' | 'status') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  const handleVideoSort = (employeeId: string, column: 'title' | 'status' | 'quiz') => {
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
      } else if (sortState.column === 'quiz') {
        // quiz sorting - sort by quiz score (completed first, then by score percentage)
        const aQuizAttempt = employeeQuizzes.get(employeeId)?.get(a.video_id);
        const bQuizAttempt = employeeQuizzes.get(employeeId)?.get(b.video_id);
        const aScore = aQuizAttempt ? aQuizAttempt.score / aQuizAttempt.total_questions * 100 : -1;
        const bScore = bQuizAttempt ? bQuizAttempt.score / bQuizAttempt.total_questions * 100 : -1;
        aValue = aScore.toString().padStart(6, '0');
        bValue = bScore.toString().padStart(6, '0');
      } else {
        // status sorting - get priority values based on getDeadlineBadge logic
        const getStatusPriority = (assignment: any) => {
          const employeeQuizData = employeeQuizzes.get(employeeId);
          const quizAttempt = employeeQuizData?.get(assignment.video_id);
          const isCompleted = !!quizAttempt;
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
  const getSortedEmployees = useMemo(() => {
    if (!sortColumn) return employees;
    return [...employees].sort((a, b) => {
      let aValue: string;
      let bValue: string;
      if (sortColumn === 'employee') {
        aValue = sanitizeText(a.full_name || a.email || '');
        bValue = sanitizeText(b.full_name || b.email || '');
      } else {
        // status
        const aVideos = employeeVideos.get(a.id) || [];
        const bVideos = employeeVideos.get(b.id) || [];

        // Calculate status for employee A
        const aRequiredVideos = aVideos.filter(assignment => assignment.video_type === 'Required');
        const aCompletedRequired = aRequiredVideos.filter(assignment => {
          const quizAttempt = employeeQuizzes.get(a.id)?.get(assignment.video_id);
          return !!quizAttempt;
        });
        const aOverdueRequired = aRequiredVideos.filter(assignment => {
          const quizAttempt = employeeQuizzes.get(a.id)?.get(assignment.video_id);
          if (!!quizAttempt) return false;
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
        const bCompletedRequired = bRequiredVideos.filter(assignment => {
          const quizAttempt = employeeQuizzes.get(b.id)?.get(assignment.video_id);
          return !!quizAttempt;
        });
        const bOverdueRequired = bRequiredVideos.filter(assignment => {
          const quizAttempt = employeeQuizzes.get(b.id)?.get(assignment.video_id);
          if (!!quizAttempt) return false;
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
  }, [employees, employeeVideos, employeeQuizzes, sortColumn, sortDirection]);
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
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeOperations.getAll();
      if (data.success && data.data) {
        // Transform API data to match local types
        const transformedEmployees: EmployeeWithAssignments[] = data.data.map(employee => ({
          id: employee.id,
          email: employee.email,
          full_name: employee.name,
          // API uses 'name', component expects 'full_name'
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
  const getDeadlineBadge = (assignment: any, employeeId: string) => {
    const employeeQuizData = employeeQuizzes.get(employeeId);
    const quizAttempt = employeeQuizData?.get(assignment.video_id);
    const isCompleted = !!quizAttempt;
    if (isCompleted) {
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
      return <Badge className="bg-destructive text-destructive-foreground">Overdue ({Math.abs(daysUntilDue)} days)</Badge>;
    }
    if (daysUntilDue === 0) {
      return <Badge className="bg-yellow-500 text-white">Due Today</Badge>;
    }
    if (daysUntilDue <= 7) {
      return <Badge className="bg-orange-500 text-white">Due in {daysUntilDue} days</Badge>;
    }
    return <Badge variant="secondary">Due in {daysUntilDue} days</Badge>;
  };
  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  const formatCompletionDate = (dateString: string | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  const getAssignmentStatus = (assignment: any, employeeId: string) => {
    const employeeQuizData = employeeQuizzes.get(employeeId);
    const quizAttempt = employeeQuizData?.get(assignment.video_id);
    if (quizAttempt) {
      const completionDate = quizAttempt?.completed_at;
      const completionText = completionDate ? formatCompletionDate(completionDate) : '';
      return <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-success" />
          <span className="text-success">Completed</span>
          {completionText && <span className="text-muted-foreground">({completionText})</span>}
        </div>;
    } else {
      return <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Not Started</span>
        </div>;
    }
  };
  const getEmployeeOverallStatus = useCallback((employeeId: string) => {
    const videos = employeeVideos.get(employeeId) || [];
    const requiredVideos = videos.filter(assignment => assignment.video_type === 'Required');
    if (requiredVideos.length === 0) {
      return <Badge variant="secondary">No Required Training</Badge>;
    }
    const completedRequired = requiredVideos.filter(assignment => {
      const quizAttempt = employeeQuizzes.get(employeeId)?.get(assignment.video_id);
      return !!quizAttempt;
    });
    return <Badge variant="soft-secondary">
        {completedRequired.length}/{requiredVideos.length} Complete
      </Badge>;
  }, [employeeVideos, employeeQuizzes]);
  if (loading) {
    return <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Employee Management</h2>
            <p className="text-muted-foreground">Manage employees and their video assignments</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <LoadingSkeleton />
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Employee Management</h2>
          <p className="text-muted-foreground">Manage employees and their video assignments</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} {...createButtonAriaProps('Add new employee')}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table {...createTableAriaProps(sortColumn || undefined, sortDirection)}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('employee')} className="h-auto p-0 font-semibold uppercase tracking-wider" {...createButtonAriaProps(`Sort by employee ${sortColumn === 'employee' ? sortDirection === 'asc' ? 'descending' : 'ascending' : 'ascending'}`)}>
                    EMPLOYEE
                    {sortColumn === 'employee' && (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />)}
                    {sortColumn !== 'employee' && <ArrowUpDown className="w-4 h-4 ml-1" />}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('status')} className="h-auto p-0 font-semibold uppercase tracking-wider" {...createButtonAriaProps(`Sort by status ${sortColumn === 'status' ? sortDirection === 'asc' ? 'descending' : 'ascending' : 'ascending'}`)}>
                    STATUS
                    {sortColumn === 'status' && (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />)}
                    {sortColumn !== 'status' && <ArrowUpDown className="w-4 h-4 ml-1" />}
                  </Button>
                </TableHead>
                <TableHead className="uppercase tracking-wider font-semibold">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSortedEmployees.map(employee => {
              const isExpanded = expandedEmployees.has(employee.id);
              const videos = employeeVideos.get(employee.id) || [];
              const hasVideos = videos.length > 0;
              const displayName = createSafeDisplayName(employee.full_name || '', employee.email || '');
              return <React.Fragment key={employee.id}>
                    <TableRow>
                      <TableCell>
                        {hasVideos && <Button variant="ghost" size="sm" onClick={() => toggleEmployeeExpanded(employee.id)} className="p-1" {...createButtonAriaProps(`${isExpanded ? 'Collapse' : 'Expand'} video assignments for ${displayName}`, isExpanded)}>
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </Button>}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {displayName}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {sanitizeText(employee.email || '')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getEmployeeOverallStatus(employee.id)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleAssignVideos(employee)} {...createButtonAriaProps(`Assign videos to ${displayName}`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Assign Videos
                          </Button>
                          <IconButtonWithTooltip icon={Trash2} onClick={() => setDeleteConfirmEmployee(employee)} tooltip={getTooltipText('delete-item', {
                        name: displayName
                      })} variant="destructive" ariaLabel={`Delete employee ${displayName}`} />
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && hasVideos && <TableRow>
                        <TableCell colSpan={4} className="p-0">
                          <div className="bg-muted/50 p-4">
                            
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>
                                    <Button variant="ghost" onClick={() => handleVideoSort(employee.id, 'title')} className="h-auto p-0 font-semibold">
                                      Video Title
                                      {videoSortState.get(employee.id)?.column === 'title' && (videoSortState.get(employee.id)?.direction === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />)}
                                      {videoSortState.get(employee.id)?.column !== 'title' && <ArrowUpDown className="w-4 h-4 ml-1" />}
                                    </Button>
                                  </TableHead>
                                   <TableHead>
                                     <Button variant="ghost" onClick={() => handleVideoSort(employee.id, 'status')} className="h-auto p-0 font-semibold">
                                       Status
                                       {videoSortState.get(employee.id)?.column === 'status' && (videoSortState.get(employee.id)?.direction === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />)}
                                       {videoSortState.get(employee.id)?.column !== 'status' && <ArrowUpDown className="w-4 h-4 ml-1" />}
                                     </Button>
                                   </TableHead>
                                   <TableHead>
                                     <Button variant="ghost" onClick={() => handleVideoSort(employee.id, 'quiz')} className="h-auto p-0 font-semibold">
                                       Quiz Results
                                       {videoSortState.get(employee.id)?.column === 'quiz' && (videoSortState.get(employee.id)?.direction === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />)}
                                       {videoSortState.get(employee.id)?.column !== 'quiz' && <ArrowUpDown className="w-4 h-4 ml-1" />}
                                     </Button>
                                   </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getSortedVideosForEmployee(employee.id, videos).map(assignment => <TableRow key={assignment.assignment_id}>
                                    <TableCell>
                                      <div className="font-medium">{assignment.video_title}</div>
                                      {assignment.video_description}
                                    </TableCell>
                                     <TableCell>
                                       {getAssignmentStatus(assignment, employee.id)}
                                     </TableCell>
                                     <TableCell>
                                       {(() => {
                                const employeeQuizData = employeeQuizzes.get(employee.id);
                                const quizAttempt = employeeQuizData?.get(assignment.video_id);
                                if (!assignment.hasQuiz) {
                                  return <span className="text-muted-foreground">No Quiz</span>;
                                }
                                if (!quizAttempt) {
                                  return <Badge variant="soft-secondary">Not Taken</Badge>;
                                }
                                const scorePercentage = Math.round(quizAttempt.score / quizAttempt.total_questions * 100);
                                const scoreDisplay = `${quizAttempt.score}/${quizAttempt.total_questions}`;
                                let badgeVariant: string;
                                if (scorePercentage >= 80) {
                                  badgeVariant = "success";
                                } else if (scorePercentage >= 60) {
                                  badgeVariant = "warning";
                                } else {
                                  badgeVariant = "destructive";
                                }
                                return <div className="flex items-center space-x-2">
                                             <Badge variant={badgeVariant as any}>
                                               {scoreDisplay}
                                             </Badge>
                                             <span className="text-sm text-muted-foreground">
                                               ({scorePercentage}%)
                                             </span>
                                           </div>;
                              })()}
                                     </TableCell>
                                  </TableRow>)}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>}
                  </React.Fragment>;
            })}
            </TableBody>
          </Table>

          {employees.length === 0 && <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No employees found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first employee.
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </div>}
        </CardContent>
      </Card>

      <AddEmployeeModal open={showAddModal} onOpenChange={setShowAddModal} onEmployeeAdded={handleAddEmployee} />

      <AssignVideosModal open={showAssignModal} onOpenChange={setShowAssignModal} employee={selectedEmployee} onAssignmentComplete={() => {
      setShowAssignModal(false);
      loadEmployees();
    }} />

      <AlertDialog open={!!deleteConfirmEmployee} onOpenChange={() => setDeleteConfirmEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};