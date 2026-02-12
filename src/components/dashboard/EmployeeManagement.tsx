import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { UserPlus, Download, EyeOff, Eye, ChevronDown } from 'lucide-react';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { employeeOperations } from '@/services/api';
import { IconButtonWithTooltip } from '@/components/ui/icon-button-with-tooltip';
import { getTooltipText } from '@/utils/tooltipText';
import type { EmployeeWithAssignments, Employee, EmployeeAssignmentWithProgress } from '@/types/employee';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AddEmployeeModal } from './AddEmployeeModal';
import { AssignVideosModal } from './AssignVideosModal';
import { DownloadDataModal } from './DownloadDataModal';
import { logger } from '@/utils/logger';
import { format, differenceInDays, isPast } from 'date-fns';
import { quizOperations } from '@/services/quizService';
import { sanitizeText, createSafeDisplayName } from '@/utils/security';
import * as XLSX from 'xlsx';
import { STATUS_LABELS } from '@/constants';
import {
  isLegacyExempt as sharedIsLegacyExempt,
  hasActiveQuizRequirement,
  getDisplayQuizResults,
  getDisplayQuizVersion,
  getCompletionDate as sharedGetCompletionDate,
  isTrainingCompleted,
  type QuizAttemptData,
} from '@/utils/quizHelpers';
export const EmployeeManagement: React.FC<{
  onCountChange?: (count: number) => void;
}> = ({
  onCountChange
}) => {
  const [employees, setEmployees] = useState<EmployeeWithAssignments[]>([]);
  const [hiddenEmployees, setHiddenEmployees] = useState<EmployeeWithAssignments[]>([]);
  const [employeeVideos, setEmployeeVideos] = useState<Map<string, any[]>>(new Map());
  const [employeeQuizzes, setEmployeeQuizzes] = useState<Map<string, Map<string, any>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [sortColumn, setSortColumn] = useState<'name' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pendingHideEmployee, setPendingHideEmployee] = useState<EmployeeWithAssignments | null>(null);
  const [pendingShowEmployee, setPendingShowEmployee] = useState<EmployeeWithAssignments | null>(null);
  const {
    toast
  } = useToast();
  useEffect(() => {
    loadEmployees();
    loadHiddenEmployees();

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
        loadHiddenEmployees();
      }).on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employees'
      }, () => {
        logger.info('Employee changed, refreshing data...');
        loadEmployees();
        loadHiddenEmployees();
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
        } = await supabase.from('quizzes').select('video_id, created_at, version').is('archived_at', null);
        const quizCreationDates = new Map<string, string>();
        const quizVersionsMap = new Map<string, number>();
        quizzesData?.forEach(quiz => {
          quizCreationDates.set(quiz.video_id, quiz.created_at);
          const existing = quizVersionsMap.get(quiz.video_id);
          if (!existing || quiz.version > existing) {
            quizVersionsMap.set(quiz.video_id, quiz.version);
          }
        });
        const videoMap = new Map();
        const quizMap = new Map();
        for (const employee of transformedEmployees) {
          if (employee.assignments && Array.isArray(employee.assignments)) {
            const assignmentsWithQuizInfo = employee.assignments.map((assignment: any) => {
              const quizCreatedAt = quizCreationDates.get(assignment.video_id);
              return {
                ...assignment,
                hasQuiz: hasActiveQuizRequirement(quizCreatedAt, assignment.completed_at)
              };
            });
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
                      completed_at: attempt.completed_at,
                      quiz_version: attempt.quiz?.version || 1
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

  const loadHiddenEmployees = useCallback(async () => {
    try {
      const result = await employeeOperations.getHidden();
      if (result.success && result.data) {
        const transformedEmployees: EmployeeWithAssignments[] = result.data.map((employee: any) => ({
          id: employee.id,
          email: employee.email,
          full_name: createSafeDisplayName(employee.name || '', employee.email || ''),
          created_at: employee.created_at || new Date().toISOString(),
          updated_at: employee.updated_at || new Date().toISOString(),
          assignments: employee.assignments || []
        }));
        setHiddenEmployees(transformedEmployees);
      }
    } catch (error) {
      logger.error('Error loading hidden employees', error as Error);
    }
  }, []);

  const handleHideEmployee = useCallback(async (employee: EmployeeWithAssignments) => {
    try {
      const result = await employeeOperations.hide(employee.id);
      if (result.success) {
        toast({
          title: "Success",
          description: `${employee.full_name || employee.email} has been hidden`
        });
        loadEmployees();
        loadHiddenEmployees();
      } else {
        throw new Error(result.error || 'Failed to hide employee');
      }
    } catch (error) {
      logger.error('Error hiding employee', error as Error);
      toast({
        title: "Error",
        description: "Failed to hide employee",
        variant: "destructive"
      });
    }
  }, [toast, loadEmployees, loadHiddenEmployees]);

  const handleShowEmployee = useCallback(async (employee: EmployeeWithAssignments) => {
    try {
      const result = await employeeOperations.show(employee.id);
      if (result.success) {
        toast({
          title: "Success",
          description: `${employee.full_name || employee.email} is now visible`
        });
        loadEmployees();
        loadHiddenEmployees();
      } else {
        throw new Error(result.error || 'Failed to show employee');
      }
    } catch (error) {
      logger.error('Error showing employee', error as Error);
      toast({
        title: "Error",
        description: "Failed to show employee",
        variant: "destructive"
      });
    }
  }, [toast, loadEmployees, loadHiddenEmployees]);
  const handleSort = useCallback((column: 'name') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
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
      return <span className="text-muted-foreground">No Required Training</span>;
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

    const pendingCount = requiredVideos.length - completedRequired.length;

    if (completedRequired.length === requiredVideos.length) {
      return <span className="text-muted-foreground">All Training Complete</span>;
    }

    if (overdueRequired.length > 0) {
      return (
        <div className="flex items-center gap-2">
          <span>{pendingCount} {STATUS_LABELS.pending}</span>
          <Badge variant="soft-destructive">{overdueRequired.length} Overdue</Badge>
        </div>
      );
    }

    return <span>{pendingCount} {STATUS_LABELS.pending}</span>;
  };
  const loadHiddenEmployeeQuizData = useCallback(async (): Promise<{
    videos: Map<string, any[]>;
    quizzes: Map<string, Map<string, any>>;
  }> => {
    const { data: quizzesData } = await supabase.from('quizzes').select('video_id, created_at, version').is('archived_at', null);
    const quizCreationDates = new Map<string, string>();
    const quizVersionsMap = new Map<string, number>();
    quizzesData?.forEach(quiz => {
      quizCreationDates.set(quiz.video_id, quiz.created_at);
      const existing = quizVersionsMap.get(quiz.video_id);
      if (!existing || quiz.version > existing) {
        quizVersionsMap.set(quiz.video_id, quiz.version);
      }
    });

    const videoMap = new Map<string, any[]>();
    const quizMap = new Map<string, Map<string, any>>();

    for (const employee of hiddenEmployees) {
      if (employee.assignments && Array.isArray(employee.assignments)) {
        const assignmentsWithQuizInfo = employee.assignments.map((assignment: any) => {
          const quizCreatedAt = quizCreationDates.get(assignment.video_id);
          return {
            ...assignment,
            hasQuiz: hasActiveQuizRequirement(quizCreatedAt, assignment.completed_at)
          };
        });
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
                  completed_at: attempt.completed_at,
                  quiz_version: attempt.quiz?.version || 1
                });
              }
            }
          }
          quizMap.set(employee.id, videoQuizMap);
        } catch (error) {
          logger.error(`Error loading quiz attempts for hidden employee ${employee.email}:`, error);
          quizMap.set(employee.id, new Map());
        }
      } else {
        quizMap.set(employee.id, new Map());
      }
    }

    return { videos: videoMap, quizzes: quizMap };
  }, [hiddenEmployees]);

  const processEmployeesForExport = useCallback((
    employeesToExport: EmployeeWithAssignments[],
    videosMap: Map<string, any[]>,
    quizzesMap: Map<string, Map<string, any>>,
    hiddenEmployeeIds: Set<string>,
    includeVisibility: boolean,
    quizCreationDates: Map<string, string>,
    quizVersions: Map<string, number>
  ): any[] => {
    const exportData: any[] = [];

    employeesToExport.forEach(employee => {
      const videos = videosMap.get(employee.id) || [];
      const employeeName = employee.full_name || employee.email?.split('@')[0] || 'Unknown';
      const employeeEmail = employee.email || '';

      if (videos.length === 0) {
        exportData.push({
          Name: employeeName,
          Email: employeeEmail,
          'Training': 'No assignments',
          'Status': STATUS_LABELS.unassigned,
          'Due Date': '--',
          'Completion Date': '--',
          'Quiz Results': '--',
          'Quiz Version': '--',
          ...(includeVisibility && { 'Visibility': hiddenEmployeeIds.has(employee.id) ? 'Hidden' : 'Active' })
        });
      } else {
        videos.forEach(assignment => {
          const employeeQuizData = quizzesMap.get(employee.id);
          const quizAttempt = employeeQuizData?.get(assignment.video_id) as QuizAttemptData | undefined;
          const quizCreatedAt = quizCreationDates.get(assignment.video_id);
          const exempt = sharedIsLegacyExempt(assignment.completed_at, quizCreatedAt);
          const videoCompleted = !!(assignment.progress_percent === 100 || assignment.completed_at);
          const completed = isTrainingCompleted(videoCompleted, assignment.hasQuiz, !!quizAttempt, exempt);

          let status: string = STATUS_LABELS.pending;
          if (completed) {
            status = STATUS_LABELS.completed;
          } else if (assignment.due_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(assignment.due_date);
            due.setHours(0, 0, 0, 0);
            status = isPast(due) ? STATUS_LABELS.overdue : STATUS_LABELS.pending;
          }

          const quizResults = getDisplayQuizResults(quizAttempt ?? null, assignment.hasQuiz, exempt);
          const quizVersion = getDisplayQuizVersion(quizAttempt ?? null, quizVersions.get(assignment.video_id), assignment.hasQuiz, exempt);

          let dueDate = 'N/A';
          if (assignment.due_date) {
            dueDate = format(new Date(assignment.due_date), 'MMM dd, yyyy');
          }

          const completionDateStr = completed
            ? sharedGetCompletionDate(quizAttempt ?? null, assignment.completed_at)
            : null;
          const completionDate = completionDateStr
            ? format(new Date(completionDateStr), 'MMM dd, yyyy')
            : '--';

          exportData.push({
            Name: employeeName,
            Email: employeeEmail,
            'Training': assignment.video_title || '',
            'Status': status,
            'Due Date': dueDate,
            'Completion Date': completionDate,
            'Quiz Results': quizResults,
            'Quiz Version': quizVersion,
            ...(includeVisibility && { 'Visibility': hiddenEmployeeIds.has(employee.id) ? 'Hidden' : 'Active' })
          });
        });
      }
    });

    return exportData;
  }, []);

  const exportToExcel = useCallback(async (includeHidden: boolean = false) => {
    setIsExporting(true);
    try {
      let allEmployees = [...employees];
      let allVideos = new Map(employeeVideos);
      let allQuizzes = new Map(employeeQuizzes);

      if (includeHidden && hiddenEmployees.length > 0) {
        const hiddenData = await loadHiddenEmployeeQuizData();
        
        // Merge hidden employees (deduplicate by ID)
        const existingIds = new Set(employees.map(e => e.id));
        const uniqueHidden = hiddenEmployees.filter(e => !existingIds.has(e.id));
        allEmployees = [...employees, ...uniqueHidden];
        
        // Merge video and quiz maps
        hiddenData.videos.forEach((value, key) => allVideos.set(key, value));
        hiddenData.quizzes.forEach((value, key) => allQuizzes.set(key, value));
      }

      const hiddenEmployeeIds = new Set(hiddenEmployees.map(e => e.id));

      // Fetch quiz creation dates for export
      const { data: quizzesData } = await supabase.from('quizzes').select('video_id, created_at, version').is('archived_at', null);
      const quizCreationDates = new Map<string, string>();
      const quizVersions = new Map<string, number>();
      quizzesData?.forEach(quiz => {
        const existing = quizCreationDates.get(quiz.video_id);
        if (!existing || new Date(quiz.created_at) < new Date(existing)) {
          quizCreationDates.set(quiz.video_id, quiz.created_at);
        }
        const existingVersion = quizVersions.get(quiz.video_id);
        if (!existingVersion || quiz.version > existingVersion) {
          quizVersions.set(quiz.video_id, quiz.version);
        }
      });

      const exportData = processEmployeesForExport(allEmployees, allVideos, allQuizzes, hiddenEmployeeIds, includeHidden, quizCreationDates, quizVersions);

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Training Data');

      const now = new Date();
      const filename = `employee_training_data_${format(now, 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Success",
        description: "Employee training data exported successfully"
      });
      setShowDownloadModal(false);
    } catch (error) {
      logger.error('Error exporting to Excel', error as Error);
      toast({
        title: "Error",
        description: "Failed to export employee data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  }, [employees, hiddenEmployees, employeeVideos, employeeQuizzes, loadHiddenEmployeeQuizData, processEmployeesForExport, toast]);

  const handleDownloadClick = useCallback(() => {
    if (hiddenEmployees.length === 0) {
      exportToExcel(false);
    } else {
      setShowDownloadModal(true);
    }
  }, [hiddenEmployees.length, exportToExcel]);
  if (loading) {
    return <LoadingSkeleton />;
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Employee Assignments</h3>
          <p className="text-muted-foreground">Manage employees and track their training progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadClick}>
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
                  <SortableTableHead
                    column="name"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Name
                  </SortableTableHead>
                  
                  <TableHead className="table-head-cell">STATUS</TableHead>
                  <TableHead className="table-head-cell text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedEmployees.map(employee => <TableRow key={employee.id}>
                    <TableCell className="table-body-cell font-medium">
                      <div className="flex flex-col">
                        <span>{sanitizeText(employee.full_name || employee.email?.split('@')[0] || 'Unknown')}</span>
                        {employee.email && <span className="text-small text-muted-foreground font-normal truncate max-w-[400px]" title={employee.email}>
                            {sanitizeText(employee.email)}
                          </span>}
                      </div>
                    </TableCell>
                    <TableCell className="table-body-cell">
                      {getEmployeeStatus(employee.id)}
                    </TableCell>
                    <TableCell className="table-body-cell text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleAssignVideos(employee)} aria-label={`Edit assignments for ${sanitizeText(employee.full_name || employee.email?.split('@')[0] || 'Unknown')}`}>
                          Edit Assignments
                        </Button>
                        <IconButtonWithTooltip 
                          icon={EyeOff} 
                          tooltip={getTooltipText('hide-employee')} 
                          onClick={() => setPendingHideEmployee(employee)} 
                          variant="ghost" 
                          className="text-muted-foreground hover:text-foreground" 
                          ariaLabel={`Hide ${sanitizeText(employee.full_name || employee.email?.split('@')[0] || 'Unknown')}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>}

      {/* Hidden Employees Section */}
      {hiddenEmployees.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="hidden" className="border-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 [&>svg]:hidden group">
              <div className="flex items-center gap-3 w-full">
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
                <EyeOff className="w-5 h-5 text-muted-foreground" />
                <span className="text-h4">Hidden Employees</span>
                <Badge variant="soft-destructive" className="ml-2">
                  {hiddenEmployees.length}
                </Badge>
                <div className="ml-auto">
                  <span className="text-small text-muted-foreground bg-muted px-2 py-1 rounded">
                    Hidden employees remain functional with active assignments
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <Card className="shadow-md">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="w-32 text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hiddenEmployees.map(employee => (
                          <TableRow key={employee.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {sanitizeText(employee.full_name || employee.email?.split('@')[0] || 'Unknown')}
                                </div>
                                {employee.email && (
                                  <div className="text-small text-muted-foreground">
                                    {sanitizeText(employee.email)}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center">
                                <IconButtonWithTooltip 
                                  icon={Eye} 
                                  tooltip={getTooltipText('show-employee')} 
                                  onClick={() => setPendingShowEmployee(employee)} 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-muted-foreground hover:text-foreground" 
                                  ariaLabel={`Show ${sanitizeText(employee.full_name || employee.email?.split('@')[0] || 'Unknown')} in main list`} 
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <AddEmployeeModal open={showAddModal} onOpenChange={setShowAddModal} onEmployeeAdded={handleAddEmployee} />

      <AssignVideosModal open={showAssignModal} onOpenChange={setShowAssignModal} employee={selectedEmployee} onAssignmentComplete={loadEmployees} />

      <DownloadDataModal
        open={showDownloadModal}
        onOpenChange={setShowDownloadModal}
        onConfirm={exportToExcel}
        hiddenCount={hiddenEmployees.length}
        isLoading={isExporting}
      />

      {/* Confirmation Dialog for Hide Employee */}
      <AlertDialog open={!!pendingHideEmployee} onOpenChange={(open) => !open && setPendingHideEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide this employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This moves {pendingHideEmployee?.full_name || pendingHideEmployee?.email} to the Hidden section without affecting assignments or progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingHideEmployee(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingHideEmployee) {
                handleHideEmployee(pendingHideEmployee);
                setPendingHideEmployee(null);
              }
            }}>
              Hide Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Show Employee */}
      <AlertDialog open={!!pendingShowEmployee} onOpenChange={(open) => !open && setPendingShowEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Show this employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This restores {pendingShowEmployee?.full_name || pendingShowEmployee?.email} to the main employee list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingShowEmployee(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingShowEmployee) {
                handleShowEmployee(pendingShowEmployee);
                setPendingShowEmployee(null);
              }
            }}>
              Show Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};