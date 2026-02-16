/**
 * PeopleManagement - Unified People tab replacing separate Employees + Admins tabs.
 * Shows all users (employees and admins) in one table with admin badge indicator.
 */

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
import { UserPlus, Download, EyeOff, Eye, ChevronDown, Settings } from 'lucide-react';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { employeeOperations } from '@/services/api';
import { IconButtonWithTooltip } from '@/components/ui/icon-button-with-tooltip';
import type { EmployeeWithAssignments, Employee, EmployeeAssignmentWithProgress } from '@/types/employee';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AddEmployeeModal } from './AddEmployeeModal';
import { AssignVideosModal } from './AssignVideosModal';
import { DownloadDataModal } from './DownloadDataModal';
import { PersonSettingsModal } from './PersonSettingsModal';
import { logger } from '@/utils/logger';
import { format, differenceInDays, isPast } from 'date-fns';
import { formatShort } from '@/utils/date-formatter';
import { quizOperations } from '@/services/quizService';
import { createSafeDisplayName } from '@/utils/security';
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

interface PeopleManagementProps {
  userEmail?: string;
}

export const PeopleManagement: React.FC<PeopleManagementProps> = ({ userEmail }) => {
  const [people, setPeople] = useState<(EmployeeWithAssignments & { is_admin?: boolean })[]>([]);
  const [hiddenPeople, setHiddenPeople] = useState<(EmployeeWithAssignments & { is_admin?: boolean })[]>([]);
  const [employeeVideos, setEmployeeVideos] = useState<Map<string, any[]>>(new Map());
  const [employeeQuizzes, setEmployeeQuizzes] = useState<Map<string, Map<string, any>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [settingsEmployee, setSettingsEmployee] = useState<(EmployeeWithAssignments & { is_admin?: boolean }) | null>(null);
  const [sortColumn, setSortColumn] = useState<'name' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pendingShowPerson, setPendingShowPerson] = useState<EmployeeWithAssignments | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadPeople();
    loadHiddenPeople();

    let channel: any = null;
    try {
      channel = supabase.channel('people-management')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'video_assignments' }, () => { loadPeople(); loadHiddenPeople(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => { loadPeople(); loadHiddenPeople(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'video_progress' }, () => { loadPeople(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_attempts' }, () => { loadPeople(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => { loadPeople(); loadHiddenPeople(); })
        .subscribe();
    } catch (error) {
      logger.error('Failed to set up real-time subscription', error as Error);
    }
    return () => {
      if (channel) {
        try { supabase.removeChannel(channel); } catch (e) { /* silent */ }
      }
    };
  }, []);


  const loadPeople = useCallback(async (silentRefresh = false) => {
    try {
      if (!silentRefresh) setLoading(true);
      const data = await employeeOperations.getAll();
      
      if (data.success && data.data) {
        const transformed = data.data.map(employee => ({
          id: employee.id,
          email: employee.email,
          full_name: createSafeDisplayName(employee.name || '', employee.email || ''),
          is_admin: (employee as any).is_admin || false,
          created_at: employee.created_at || new Date().toISOString(),
          updated_at: employee.updated_at || new Date().toISOString(),
          assignments: employee.assignments || []
        }));
        setPeople(transformed);

        // Load quiz info
        const { data: quizzesData } = await supabase.from('quizzes').select('video_id, created_at, version').is('archived_at', null);
        const quizCreationDates = new Map<string, string>();
        quizzesData?.forEach(quiz => { quizCreationDates.set(quiz.video_id, quiz.created_at); });

        const videoMap = new Map();
        const quizMap = new Map();
        for (const person of transformed) {
          if (person.assignments && Array.isArray(person.assignments)) {
            const assignmentsWithQuizInfo = person.assignments.map((assignment: any) => ({
              ...assignment,
              hasQuiz: hasActiveQuizRequirement(quizCreationDates.get(assignment.video_id), assignment.completed_at)
            }));
            videoMap.set(person.id, assignmentsWithQuizInfo);
          } else {
            videoMap.set(person.id, []);
          }

          if (person.email) {
            try {
              const quizAttempts = await quizOperations.getUserAttempts(person.email);
              const videoQuizMap = new Map();
              for (const attempt of quizAttempts) {
                if (attempt.quiz?.video_id) {
                  const existing = videoQuizMap.get(attempt.quiz.video_id);
                  if (!existing || new Date(existing.completed_at) < new Date(attempt.completed_at)) {
                    videoQuizMap.set(attempt.quiz.video_id, {
                      score: attempt.score,
                      total_questions: attempt.total_questions,
                      completed_at: attempt.completed_at,
                      quiz_version: attempt.quiz?.version || 1
                    });
                  }
                }
              }
              quizMap.set(person.id, videoQuizMap);
            } catch (error) {
              quizMap.set(person.id, new Map());
            }
          } else {
            quizMap.set(person.id, new Map());
          }
        }
        setEmployeeVideos(videoMap);
        setEmployeeQuizzes(quizMap);
      }
    } catch (error) {
      logger.error('Error loading people', error as Error);
      toast({ title: "Error", description: "Failed to load people", variant: "destructive" });
    } finally {
      if (!silentRefresh) setLoading(false);
    }
  }, [toast]);

  // Failsafe: refresh data when window regains focus (covers missed real-time events)
  useEffect(() => {
    const handleFocus = () => { loadPeople(true); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadPeople]);

  const loadHiddenPeople = useCallback(async () => {
    try {
      const result = await employeeOperations.getHidden();
      if (result.success && result.data) {
        const transformed = result.data.map((p: any) => ({
          id: p.id,
          email: p.email,
          full_name: createSafeDisplayName(p.name || '', p.email || ''),
          is_admin: p.is_admin || false,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
          assignments: p.assignments || []
        }));
        setHiddenPeople(transformed);
      }
    } catch (error) {
      logger.error('Error loading hidden people', error as Error);
    }
  }, []);

  const handleAddPerson = useCallback((employee: Employee) => {
    setPeople(prev => {
      const transformed = {
        id: employee.id,
        email: employee.email,
        full_name: createSafeDisplayName(employee.full_name || '', employee.email || ''),
        is_admin: false,
        created_at: employee.created_at,
        updated_at: employee.updated_at,
        assignments: []
      };
      return [...prev, transformed];
    });
    setShowAddModal(false);
    toast({ title: "Success", description: "Person added successfully" });
  }, [toast]);

  const handleAssignVideos = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setShowAssignModal(true);
  }, []);

  const handleHidePerson = useCallback(async (person: EmployeeWithAssignments) => {
    try {
      const result = await employeeOperations.hide(person.id);
      if (result.success) {
        toast({ title: "Success", description: `${person.full_name || person.email} has been hidden` });
        loadPeople();
        loadHiddenPeople();
      } else {
        throw new Error(result.error || 'Failed to hide person');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to hide person", variant: "destructive" });
    }
  }, [toast, loadPeople, loadHiddenPeople]);

  const handleShowPerson = useCallback(async (person: EmployeeWithAssignments) => {
    try {
      const result = await employeeOperations.show(person.id);
      if (result.success) {
        toast({ title: "Success", description: `${person.full_name || person.email} is now visible` });
        loadPeople();
        loadHiddenPeople();
      } else {
        throw new Error(result.error || 'Failed to show person');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to show person", variant: "destructive" });
    }
  }, [toast, loadPeople, loadHiddenPeople]);

  const handleSort = useCallback((column: 'name') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const sortedPeople = useMemo(() => {
    if (!sortColumn) return people;
    return [...people].sort((a, b) => {
      const aName = a.full_name || a.email?.split('@')[0] || '';
      const bName = b.full_name || b.email?.split('@')[0] || '';
      const comparison = aName.localeCompare(bName);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [people, sortColumn, sortDirection]);

  const getPersonStatus = (personId: string) => {
    const videos = employeeVideos.get(personId) || [];
    const requiredVideos = videos.filter((a: any) => a.video_type === 'Required');
    if (requiredVideos.length === 0) {
      return <span className="text-muted-foreground">No Required Training</span>;
    }

    const isAssignmentCompleted = (assignment: EmployeeAssignmentWithProgress) => {
      const quizAttempt = employeeQuizzes.get(personId)?.get(assignment.video_id);
      const videoCompleted = assignment.progress_percent === 100 || assignment.completed_at;
      if (assignment.hasQuiz) return videoCompleted && quizAttempt;
      return videoCompleted;
    };

    const completedRequired = requiredVideos.filter((a: any) => isAssignmentCompleted(a));
    const overdueRequired = requiredVideos.filter((assignment: any) => {
      if (isAssignmentCompleted(assignment)) return false;
      if (!assignment.due_date) return false;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const due = new Date(assignment.due_date); due.setHours(0, 0, 0, 0);
      return isPast(due) && differenceInDays(due, today) < 0;
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

  // === Export pipeline (ported from EmployeeManagement) ===

  const loadHiddenPeopleQuizData = useCallback(async (): Promise<{
    videos: Map<string, any[]>;
    quizzes: Map<string, Map<string, any>>;
  }> => {
    const { data: quizzesData } = await supabase.from('quizzes').select('video_id, created_at, version').is('archived_at', null);
    const quizCreationDates = new Map<string, string>();
    quizzesData?.forEach(quiz => { quizCreationDates.set(quiz.video_id, quiz.created_at); });

    const videoMap = new Map<string, any[]>();
    const quizMap = new Map<string, Map<string, any>>();

    for (const person of hiddenPeople) {
      if (person.assignments && Array.isArray(person.assignments)) {
        const assignmentsWithQuizInfo = person.assignments.map((assignment: any) => ({
          ...assignment,
          hasQuiz: hasActiveQuizRequirement(quizCreationDates.get(assignment.video_id), assignment.completed_at)
        }));
        videoMap.set(person.id, assignmentsWithQuizInfo);
      } else {
        videoMap.set(person.id, []);
      }

      if (person.email) {
        try {
          const quizAttempts = await quizOperations.getUserAttempts(person.email);
          const videoQuizMap = new Map();
          for (const attempt of quizAttempts) {
            if (attempt.quiz?.video_id) {
              const existing = videoQuizMap.get(attempt.quiz.video_id);
              if (!existing || new Date(existing.completed_at) < new Date(attempt.completed_at)) {
                videoQuizMap.set(attempt.quiz.video_id, {
                  score: attempt.score,
                  total_questions: attempt.total_questions,
                  completed_at: attempt.completed_at,
                  quiz_version: attempt.quiz?.version || 1
                });
              }
            }
          }
          quizMap.set(person.id, videoQuizMap);
        } catch (error) {
          quizMap.set(person.id, new Map());
        }
      } else {
        quizMap.set(person.id, new Map());
      }
    }

    return { videos: videoMap, quizzes: quizMap };
  }, [hiddenPeople]);

  const processEmployeesForExport = useCallback((
    employeesToExport: (EmployeeWithAssignments & { is_admin?: boolean })[],
    videosMap: Map<string, any[]>,
    quizzesMap: Map<string, Map<string, any>>,
    hiddenEmployeeIds: Set<string>,
    includeVisibility: boolean,
    quizCreationDates: Map<string, string>,
    quizVersions: Map<string, number>
  ): any[] => {
    const exportData: any[] = [];

    employeesToExport.forEach(person => {
      const videos = videosMap.get(person.id) || [];
      const personName = person.full_name || person.email?.split('@')[0] || 'Unknown';
      const personEmail = person.email || '';

      if (videos.length === 0) {
        exportData.push({
          Name: personName,
          Email: personEmail,
          Admin: person.is_admin ? 'Yes' : 'No',
          'Training': 'No assignments',
          'Status': STATUS_LABELS.unassigned,
          'Due Date': '--',
          'Completion Date': '--',
          'Quiz Results': '--',
          'Quiz Version': '--',
          ...(includeVisibility && { 'Visibility': hiddenEmployeeIds.has(person.id) ? 'Hidden' : 'Active' })
        });
      } else {
        videos.forEach(assignment => {
          const quizData = quizzesMap.get(person.id);
          const quizAttempt = quizData?.get(assignment.video_id) as QuizAttemptData | undefined;
          const quizCreatedAt = quizCreationDates.get(assignment.video_id);
          const exempt = sharedIsLegacyExempt(assignment.completed_at, quizCreatedAt);
          const videoCompleted = !!(assignment.progress_percent === 100 || assignment.completed_at);
          const completed = isTrainingCompleted(videoCompleted, assignment.hasQuiz, !!quizAttempt, exempt);

          let status: string = STATUS_LABELS.pending;
          if (completed) {
            status = STATUS_LABELS.completed;
          } else if (assignment.due_date) {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const due = new Date(assignment.due_date); due.setHours(0, 0, 0, 0);
            status = isPast(due) ? STATUS_LABELS.overdue : STATUS_LABELS.pending;
          }

          const quizResults = getDisplayQuizResults(quizAttempt ?? null, assignment.hasQuiz, exempt);
          const quizVersion = getDisplayQuizVersion(quizAttempt ?? null, quizVersions.get(assignment.video_id), assignment.hasQuiz, exempt);

          let dueDate = 'N/A';
          if (assignment.due_date) {
            dueDate = formatShort(assignment.due_date);
          }

          const completionDateStr = completed
            ? sharedGetCompletionDate(quizAttempt ?? null, assignment.completed_at)
            : null;
          const completionDate = completionDateStr
            ? formatShort(completionDateStr)
            : '--';

          exportData.push({
            Name: personName,
            Email: personEmail,
            Admin: person.is_admin ? 'Yes' : 'No',
            'Training': assignment.video_title || '',
            'Status': status,
            'Due Date': dueDate,
            'Completion Date': completionDate,
            'Quiz Results': quizResults,
            'Quiz Version': quizVersion,
            ...(includeVisibility && { 'Visibility': hiddenEmployeeIds.has(person.id) ? 'Hidden' : 'Active' })
          });
        });
      }
    });

    return exportData;
  }, []);

  const exportToExcel = useCallback(async (includeHidden: boolean = false) => {
    setIsExporting(true);
    try {
      let allPeople = [...people];
      let allVideos = new Map(employeeVideos);
      let allQuizzes = new Map(employeeQuizzes);

      if (includeHidden && hiddenPeople.length > 0) {
        const hiddenData = await loadHiddenPeopleQuizData();
        const existingIds = new Set(people.map(p => p.id));
        const uniqueHidden = hiddenPeople.filter(p => !existingIds.has(p.id));
        allPeople = [...people, ...uniqueHidden];
        hiddenData.videos.forEach((value, key) => allVideos.set(key, value));
        hiddenData.quizzes.forEach((value, key) => allQuizzes.set(key, value));
      }

      const hiddenIds = new Set(hiddenPeople.map(p => p.id));

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

      const exportData = processEmployeesForExport(allPeople, allVideos, allQuizzes, hiddenIds, includeHidden, quizCreationDates, quizVersions);

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Training Data');

      const now = new Date();
      const filename = `training_data_${format(now, 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, filename);

      toast({ title: "Success", description: "Training data exported successfully" });
      setShowDownloadModal(false);
    } catch (error) {
      logger.error('Error exporting to Excel', error as Error);
      toast({ title: "Error", description: "Failed to export data", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [people, hiddenPeople, employeeVideos, employeeQuizzes, loadHiddenPeopleQuizData, processEmployeesForExport, toast]);

  const handleDownloadClick = useCallback(() => {
    if (hiddenPeople.length === 0) {
      exportToExcel(false);
    } else {
      setShowDownloadModal(true);
    }
  }, [hiddenPeople.length, exportToExcel]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">People Management</h3>
          <p className="text-muted-foreground">Manage people, assignments, and administrative privileges</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadClick}>
            <Download className="w-4 h-4 mr-2" />
            Download Data
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Person
          </Button>
        </div>
      </div>

      {/* People Table */}
      <Card className="shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <LoadingSkeleton lines={1} className="h-12" />
              <LoadingSkeleton lines={1} className="h-12" />
              <LoadingSkeleton lines={1} className="h-12" />
            </div>
          ) : people.length === 0 ? (
            <div className="text-center py-12">
              <div className="space-y-3">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h4 className="font-medium text-foreground">No people found</h4>
                  <p className="text-body-sm text-muted-foreground">Add people to manage training assignments.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Person
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort}>
                    Name
                  </SortableTableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPeople.map(person => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{person.full_name || 'Unknown'}</span>
                          {person.is_admin && (
                            <Badge variant="soft-attention" showIcon>Admin</Badge>
                          )}
                        </div>
                        <div className="text-body-sm text-muted-foreground">{person.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getPersonStatus(person.id)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleAssignVideos({
                          id: person.id,
                          email: person.email,
                          full_name: person.full_name,
                          created_at: person.created_at,
                          updated_at: person.updated_at,
                        })}>
                          Edit Assignments
                        </Button>
                        <IconButtonWithTooltip
                          icon={Settings}
                          tooltip="Person settings"
                          onClick={() => setSettingsEmployee(person)}
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          ariaLabel={`Settings for ${person.full_name || person.email}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Hidden People Section */}
      {hiddenPeople.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="hidden" className="border-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 [&>svg]:hidden group">
              <div className="flex items-center gap-3 w-full">
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
                <EyeOff className="w-5 h-5 text-muted-foreground" />
                <span className="text-h4 font-semibold">Hidden People</span>
                <Badge variant="soft-destructive" className="ml-2">{hiddenPeople.length}</Badge>
                <div className="ml-auto">
                  <span className="text-body-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                    Hidden people retain all assignments and progress
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <Card className="shadow-md">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-32 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hiddenPeople.map(person => (
                        <TableRow key={person.id}>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{person.full_name || 'Unknown'}</span>
                                {person.is_admin && <Badge variant="soft-attention" showIcon>Admin</Badge>}
                              </div>
                              <div className="text-body-sm text-muted-foreground">{person.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <IconButtonWithTooltip
                                icon={Eye}
                                tooltip="Show person in main list"
                                onClick={() => setPendingShowPerson(person)}
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground"
                                ariaLabel={`Show ${person.full_name || person.email}`}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Modals */}
      <AddEmployeeModal open={showAddModal} onOpenChange={setShowAddModal} onEmployeeAdded={handleAddPerson} />
      
      {selectedEmployee && (
        <AssignVideosModal
          open={showAssignModal}
          onOpenChange={setShowAssignModal}
          employee={selectedEmployee}
          onAssignmentComplete={() => { loadPeople(); setShowAssignModal(false); }}
        />
      )}

      <DownloadDataModal
        open={showDownloadModal}
        onOpenChange={setShowDownloadModal}
        onConfirm={exportToExcel}
        hiddenCount={hiddenPeople.length}
        isLoading={isExporting}
      />

      {/* Person Settings Modal */}
      <PersonSettingsModal
        open={!!settingsEmployee}
        onOpenChange={(open) => { if (!open) setSettingsEmployee(null); }}
        person={settingsEmployee}
        onHide={(person) => handleHidePerson(person)}
        onAdminToggled={async () => {
          await loadPeople();
        }}
        currentUserEmail={userEmail}
      />

      {/* Show Person Confirmation */}
      <AlertDialog open={!!pendingShowPerson} onOpenChange={(open) => !open && setPendingShowPerson(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Show this person?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingShowPerson?.full_name || pendingShowPerson?.email}" will be restored to the main people list without affecting their assignments or progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingShowPerson(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingShowPerson) { handleShowPerson(pendingShowPerson); setPendingShowPerson(null); }
            }}>
              Show Person
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
