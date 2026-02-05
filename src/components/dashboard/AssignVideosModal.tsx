import React, { useState, useEffect, useCallback } from "react";
import { Dialog, FullscreenDialogContent, DialogHeader, DialogTitle, DialogScrollArea } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead, type SortDirection } from "@/components/ui/sortable-table-head";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Video, EyeOff } from "lucide-react";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { videoOperations, assignmentOperations, progressOperations } from "@/services/api";
import { quizOperations } from "@/services/quizService";
import { supabase } from "@/integrations/supabase/client";
import type { Employee, VideoAssignment } from "@/types/employee";
import type { Video as VideoType } from "@/types";
import { STATUS_LABELS } from "@/constants";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton, LoadingSpinner } from "@/components/ui/loading-spinner";
import { TOOLTIP_CONFIG } from "@/constants/tooltip-config";
import { logger } from "@/utils/logger";

interface AssignVideosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onAssignmentComplete: (silentRefresh?: boolean) => void;
}

// Utility function to compare sets
function areSetEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
  if (set1.size !== set2.size) return false;
  for (const item of set1) {
    if (!set2.has(item)) return false;
  }
  return true;
}

// Utility to compare deadline maps by YYYY-MM-DD
function areDeadlineMapsEqual(a: Map<string, Date>, b: Map<string, Date>): boolean {
  if (a.size !== b.size) return false;
  const toKey = (d: Date) => d.toISOString().slice(0, 10);
  for (const [key, value] of a.entries()) {
    const other = b.get(key);
    if (!other) return false;
    if (toKey(value) !== toKey(other)) return false;
  }
  return true;
}

export const AssignVideosModal: React.FC<AssignVideosModalProps> = ({
  open,
  onOpenChange,
  employee,
  onAssignmentComplete,
}) => {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [assignedVideoIds, setAssignedVideoIds] = useState<Set<string>>(new Set());
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [completedVideoIds, setCompletedVideoIds] = useState<Set<string>>(new Set());
  const [videoProgressData, setVideoProgressData] = useState<
    Map<string, { progress_percent: number; completed_at: string | null }>
  >(new Map());
  const [videoDeadlines, setVideoDeadlines] = useState<Map<string, Date>>(new Map());
  const [initialVideoDeadlines, setInitialVideoDeadlines] = useState<Map<string, Date>>(new Map());
  const [assignmentData, setAssignmentData] = useState<Map<string, VideoAssignment>>(new Map());
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  const [hiddenVideoIds, setHiddenVideoIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<"unassigned" | "assigned" | "completed" | "all">("assigned");
  const [videoIdsWithQuizzes, setVideoIdsWithQuizzes] = useState<Set<string>>(new Set());
  const [employeeQuizResults, setEmployeeQuizResults] = useState<
    Map<string, { score: number; total_questions: number; completed_at: string }>
  >(new Map());
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<'course' | 'status' | null>('course');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Due date dialog state
  const [showDueDateDialog, setShowDueDateDialog] = useState(false);
  const [dueDateOption, setDueDateOption] = useState<"1week" | "2weeks" | "1month" | null>("1week");
  const [noDueDateRequired, setNoDueDateRequired] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (open && employee) {
      loadVideosAndAssignments();
    }
  }, [open, employee]);

  const loadVideosAndAssignments = async (isRefresh = false) => {
    if (!employee) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      // Load videos, assignments, progress data, and quiz data in parallel
      const [videosResult, assignmentsResult, progressResult, quizzesResult, userAttemptsResult] = await Promise.all([
        videoOperations.getAll(true), // Include hidden videos
        employee
          ? assignmentOperations.getByEmployee(employee.id)
          : Promise.resolve({ success: true, data: [] as VideoAssignment[], error: null }),
        employee
          ? progressOperations.getByEmployee(employee.id)
          : Promise.resolve({ success: true, data: [], error: null }),
        supabase.from("quizzes").select("video_id"),
        employee?.email
          ? quizOperations.getUserAttempts(employee.email).catch((err) => {
              logger.warn("Failed to load quiz attempts:", err);
              return [];
            })
          : Promise.resolve([]),
      ]);

      if (videosResult.success && videosResult.data) {
        setVideos(videosResult.data);

        // Track hidden videos (videos with archived_at)
        const hidden = new Set<string>(videosResult.data.filter((video) => video.archived_at).map((video) => video.id));
        setHiddenVideoIds(hidden);
      } else {
        throw new Error(videosResult.error || "Failed to load videos");
      }

      // Process progress data and store progress info (completion determined after quiz data is loaded)
      const progressMap = new Map<string, { progress_percent: number; completed_at: string | null }>();
      if (progressResult.success && progressResult.data) {
        progressResult.data.forEach((progress) => {
          progressMap.set(progress.video_id, {
            progress_percent: progress.progress_percent,
            completed_at: progress.completed_at,
          });
        });
        setVideoProgressData(progressMap);
      }

      // Process quiz data to find which videos have quizzes
      if (quizzesResult.data) {
        const quizVideoIds = new Set<string>(quizzesResult.data.map((quiz) => quiz.video_id));
        setVideoIdsWithQuizzes(quizVideoIds);
      } else {
        setVideoIdsWithQuizzes(new Set());
      }

      // Process employee quiz attempts - keep most recent per video
      const quizResultsMap = new Map<string, { score: number; total_questions: number; completed_at: string }>();
      if (userAttemptsResult && Array.isArray(userAttemptsResult)) {
        for (const attempt of userAttemptsResult) {
          if (attempt.quiz?.video_id) {
            const existingAttempt = quizResultsMap.get(attempt.quiz.video_id);
            const currentAttemptDate = new Date(attempt.completed_at);
            if (!existingAttempt || new Date(existingAttempt.completed_at) < currentAttemptDate) {
              quizResultsMap.set(attempt.quiz.video_id, {
                score: attempt.score,
                total_questions: attempt.total_questions,
                completed_at: attempt.completed_at,
              });
            }
          }
        }
      }
      setEmployeeQuizResults(quizResultsMap);

      // Determine completed videos with full context (video progress + quiz completion)
      const quizVideoIds = new Set<string>(quizzesResult.data?.map((quiz) => quiz.video_id) || []);
      const completed = new Set<string>();

      progressMap.forEach((progress, videoId) => {
        const videoCompleted = progress.progress_percent === 100 || progress.completed_at;

        if (quizVideoIds.has(videoId)) {
          // Video has quiz - require both video AND quiz completion
          if (videoCompleted && quizResultsMap.has(videoId)) {
            completed.add(videoId);
          }
        } else {
          // No quiz - video completion is enough
          if (videoCompleted) {
            completed.add(videoId);
          }
        }
      });
      setCompletedVideoIds(completed);

      if (assignmentsResult.success && assignmentsResult.data) {
        const currentlyAssigned = new Set(assignmentsResult.data.map((a) => a.video_id));
        setAssignedVideoIds(currentlyAssigned);
        setSelectedVideoIds(new Set());

        // Store assignment data for tooltip information
        const assignments = new Map<string, VideoAssignment>();
        assignmentsResult.data.forEach((a) => {
          assignments.set(a.video_id, a);
        });
        setAssignmentData(assignments);

        // Load existing deadlines for assigned videos
        const deadlines = new Map<string, Date>();
        assignmentsResult.data.forEach((a) => {
          if (a.due_date) {
            try {
              deadlines.set(a.video_id, new Date(a.due_date));
            } catch {}
          }
        });
        setInitialVideoDeadlines(deadlines);
        setVideoDeadlines(new Map(deadlines));
      } else if (assignmentsResult.error) {
        logger.warn("Failed to load assignments", { error: assignmentsResult.error });
      }
    } catch (error) {
      logger.error("Error loading videos and assignments", error as Error);
      toast({
        title: "Error",
        description: "Failed to load video assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleVideoToggle = (videoId: string, checked: boolean) => {
    // Prevent toggling completed videos
    if (completedVideoIds.has(videoId)) return;

    setSelectedVideoIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(videoId);
        // When a video is selected for assignment, automatically mark it as Required
        setVideos((prevVideos) => prevVideos.map((v) => (v.id === videoId ? { ...v, type: "Required" } : v)));
      } else {
        newSet.delete(videoId);
        // Remove deadline when video is unselected and mark as Optional
        setVideoDeadlines((prev) => {
          const newDeadlines = new Map(prev);
          newDeadlines.delete(videoId);
          return newDeadlines;
        });
        setVideos((prevVideos) => prevVideos.map((v) => (v.id === videoId ? { ...v, type: "Optional" } : v)));
      }
      return newSet;
    });
  };

  const handleDeadlineChange = (videoId: string, date: Date | undefined) => {
    setVideoDeadlines((prev) => {
      const newDeadlines = new Map(prev);
      if (date) {
        newDeadlines.set(videoId, date);
      } else {
        newDeadlines.delete(videoId);
      }
      return newDeadlines;
    });
  };

  // Get IDs of selected unassigned videos (for assigning)
  const getSelectedUnassignedIds = (): Set<string> => {
    const result = new Set<string>();
    for (const videoId of selectedVideoIds) {
      if (!assignedVideoIds.has(videoId) && !completedVideoIds.has(videoId)) {
        result.add(videoId);
      }
    }
    return result;
  };

  // Get IDs of selected assigned videos that can be unassigned (pending/overdue, not completed)
  const getSelectedAssignedIds = (): Set<string> => {
    const result = new Set<string>();
    for (const videoId of selectedVideoIds) {
      if (assignedVideoIds.has(videoId) && !completedVideoIds.has(videoId)) {
        result.add(videoId);
      }
    }
    return result;
  };

  // Calculate due date based on selected option
  const calculateDueDate = (): Date | undefined => {
    if (noDueDateRequired) return undefined;

    const today = new Date();
    switch (dueDateOption) {
      case "1week": {
        const date = new Date(today);
        date.setDate(date.getDate() + 7);
        return date;
      }
      case "2weeks": {
        const date = new Date(today);
        date.setDate(date.getDate() + 14);
        return date;
      }
      case "1month": {
        const date = new Date(today);
        date.setMonth(date.getMonth() + 1);
        return date;
      }
      default:
        return undefined;
    }
  };

  // Handle radio selection for due date
  const handleDueDateSelection = (value: string) => {
    if (value === "none") {
      setDueDateOption(null);
      setNoDueDateRequired(true);
    } else {
      setDueDateOption(value as "1week" | "2weeks" | "1month");
      setNoDueDateRequired(false);
    }
  };

  // Reset dialog state when closing
  const resetDueDateDialog = () => {
    setDueDateOption("1week");
    setNoDueDateRequired(false);
    setShowDueDateDialog(false);
  };

  // Handle assigning new videos (additive only - cannot delete existing)
  const handleAssign = async () => {
    if (!employee) return;

    const videosToAssign = getSelectedUnassignedIds();
    if (videosToAssign.size === 0) return;

    const dueDate = calculateDueDate();

    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const promises: Promise<any>[] = [];
      for (const videoId of videosToAssign) {
        promises.push(assignmentOperations.create(videoId, employee.id, user.id, dueDate));
      }

      await Promise.all(promises);

      toast({
        title: "Success",
        description: `${videosToAssign.size} training${videosToAssign.size !== 1 ? "s" : ""} assigned to ${employee.full_name || employee.email}`,
      });

      onAssignmentComplete(true);
      await loadVideosAndAssignments(true);
    } catch (error) {
      logger.error("Error assigning videos", error as Error);
      toast({
        title: "Error",
        description: "Failed to assign trainings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      resetDueDateDialog();
    }
  };

  // Handle unassigning videos (called after confirmation)
  const handleUnassign = async () => {
    if (!employee) return;

    const videosToUnassign = getSelectedAssignedIds();
    if (videosToUnassign.size === 0) return;

    setIsSubmitting(true);
    try {
      const promises: Promise<any>[] = [];
      for (const videoId of videosToUnassign) {
        const assignment = assignmentData.get(videoId);
        if (assignment) {
          promises.push(assignmentOperations.delete(assignment.id));
        }
      }

      await Promise.all(promises);

      toast({
        title: "Success",
        description: `${videosToUnassign.size} training${videosToUnassign.size !== 1 ? "s" : ""} unassigned from ${employee.full_name || employee.email}`,
      });

      onAssignmentComplete(true);
      await loadVideosAndAssignments(true);
    } catch (error) {
      logger.error("Error unassigning videos", error as Error);
      toast({
        title: "Error",
        description: "Failed to unassign trainings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowUnassignDialog(false);
    }
  };

  const handleClose = () => {
    // Only show discard dialog if user has made selections
    if (selectedVideoIds.size > 0) {
      setShowDiscardDialog(true);
    } else {
      closeModal();
    }
  };

  const closeModal = () => {
    setSelectedVideoIds(new Set());
    setVideoDeadlines(new Map(initialVideoDeadlines));
    setShowDiscardDialog(false);
    setShowUnassignDialog(false);
    setFilterMode("assigned");
    resetDueDateDialog();
    // Reset quiz state
    setVideoIdsWithQuizzes(new Set());
    setEmployeeQuizResults(new Map());
    // Reset sort state to default
    setSortColumn('course');
    setSortDirection('asc');
    onOpenChange(false);
  };

  // Get completion status for a video
  const getCompletionStatus = (videoId: string): "overdue" | "pending" | "completed" | "unassigned" => {
    if (completedVideoIds.has(videoId)) return "completed";
    if (!assignedVideoIds.has(videoId)) return "unassigned";

    const deadline = videoDeadlines.get(videoId) || assignmentData.get(videoId)?.due_date;
    if (deadline) {
      const dueDate = typeof deadline === "string" ? new Date(deadline) : deadline;
      if (isPast(dueDate) && !completedVideoIds.has(videoId)) {
        return "overdue";
      }
    }
    return "pending";
  };

  // Format due date for display
  const formatDueDate = (videoId: string): string => {
    if (!assignedVideoIds.has(videoId) && !selectedVideoIds.has(videoId)) return "--";

    if (completedVideoIds.has(videoId)) {
      const progressData = videoProgressData.get(videoId);
      if (progressData?.completed_at) {
        return format(new Date(progressData.completed_at), "MMM dd, yyyy");
      }
    }

    const deadline = videoDeadlines.get(videoId);
    const existingDueDate = assignmentData.get(videoId)?.due_date;
    const status = getCompletionStatus(videoId);

    if (deadline) {
      const formattedDate = format(deadline, "MMM dd, yyyy");
      return status === "pending" || status === "overdue" ? `Due ${formattedDate}` : formattedDate;
    } else if (existingDueDate) {
      const formattedDate = format(new Date(existingDueDate), "MMM dd, yyyy");
      return status === "pending" || status === "overdue" ? `Due ${formattedDate}` : formattedDate;
    }
    return "N/A";
  };

  // Get badge variant for completion status (using soft variants for visibility)
  const getStatusBadgeVariant = (status: "overdue" | "pending" | "completed" | "unassigned") => {
    switch (status) {
      case "completed":
        return "soft-success";
      case "overdue":
        return "soft-destructive";
      case "pending":
        return "soft-primary";
      case "unassigned":
        return "ghost-tertiary";
    }
  };

  // Sort handler for table columns
  const handleSort = useCallback((column: 'course' | 'status') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  // Get status priority for sorting (lower = more urgent)
  const getStatusPriority = (videoId: string): number => {
    const status = getCompletionStatus(videoId);
    switch (status) {
      case "overdue": return 0;
      case "pending": return 1;
      case "unassigned": return 2;
      case "completed": return 3;
      default: return 4;
    }
  };

  // Sort videos based on current sort column and direction
  const sortVideos = (videosToSort: VideoType[]): VideoType[] => {
    return [...videosToSort].sort((a, b) => {
      let comparison = 0;
      
      if (sortColumn === 'course') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortColumn === 'status') {
        comparison = getStatusPriority(a.id) - getStatusPriority(b.id);
        // Secondary sort: alphabetical by title when status is the same
        if (comparison === 0) {
          comparison = a.title.localeCompare(b.title);
        }
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Filter videos based on current filter mode
  const getFilteredVideos = () => {
    let filtered: VideoType[];
    
    switch (filterMode) {
      case "unassigned":
        // Show videos that are not assigned and not completed
        filtered = videos.filter((v) => !assignedVideoIds.has(v.id) && !completedVideoIds.has(v.id));
        break;
      case "assigned":
        // Show videos currently assigned to employee (excluding completed)
        filtered = videos.filter((v) => assignedVideoIds.has(v.id) && !completedVideoIds.has(v.id));
        break;
      case "completed":
        // Show only completed videos
        filtered = videos.filter((v) => completedVideoIds.has(v.id));
        break;
      case "all":
        // Show all videos
        filtered = videos;
        break;
      default:
        filtered = videos;
    }
    
    return sortVideos(filtered);
  };

  // Get quiz results display for a video
  const getQuizResults = (videoId: string): React.ReactNode => {
    const hasQuiz = videoIdsWithQuizzes.has(videoId);
    const quizAttempt = employeeQuizResults.get(videoId);
    const isAssigned = assignedVideoIds.has(videoId);
    const isCompleted = completedVideoIds.has(videoId);

    if (!hasQuiz) {
      // Show "N/A" for assigned courses without quiz, "--" for unassigned
      return isAssigned 
        ? <span aria-label="No quiz for this course">N/A</span>
        : <span aria-label="No quiz available">--</span>;
    }

    // Unassigned videos show "--" instead of "Not Completed"
    if (!isAssigned) {
      return <span aria-label="Not assigned">--</span>;
    }

    if (!quizAttempt) {
      return <span>Not Completed</span>;
    }

    const percentage = Math.round((quizAttempt.score / quizAttempt.total_questions) * 100);
    return (
      <span>
        {percentage}% ({quizAttempt.score}/{quizAttempt.total_questions} Correct)
      </span>
    );
  };

  if (!employee) return null;

  const selectedUnassignedCount = getSelectedUnassignedIds().size;
  const selectedAssignedCount = getSelectedAssignedIds().size;
  const canAssign = selectedUnassignedCount > 0;
  const canUnassign = selectedAssignedCount > 0;
  const filteredVideos = getFilteredVideos();
  const filteredVideosCount = filteredVideos.length;
  const hasCompetingSelections = canAssign && canUnassign;
  const competingTooltip = "Clear conflicting selections first";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <FullscreenDialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Assign Videos to {employee.full_name || employee.email}
          </DialogTitle>
        </DialogHeader>

        <DialogScrollArea className="relative">
          {isRefreshing && (
            <div
              className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"
              role="status"
              aria-live="polite"
            >
              <LoadingSpinner size="lg" label="Updating assignments" />
            </div>
          )}
          {loading ? (
            <div className="space-y-4 py-4">
              <LoadingSkeleton lines={1} className="h-16" />
              <LoadingSkeleton lines={1} className="h-16" />
              <LoadingSkeleton lines={1} className="h-16" />
            </div>
          ) : (
            <>
              <div className="pb-3 border-b flex items-center justify-between gap-4 flex-wrap">
                <ToggleGroup
                  type="single"
                  value={filterMode}
                  onValueChange={(value) => setFilterMode((value as typeof filterMode) || "unassigned")}
                  variant="pill"
                  className="justify-start flex-wrap"
                >
                  <ToggleGroupItem
                    value="assigned"
                    className="text-xs px-3 py-1"
                    aria-label="Filter by assigned videos"
                  >
                    Assigned
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="unassigned"
                    className="text-xs px-3 py-1"
                    aria-label="Filter by unassigned videos"
                  >
                    Unassigned
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="completed"
                    className="text-xs px-3 py-1"
                    aria-label="Filter by completed videos"
                  >
                    Completed
                  </ToggleGroupItem>
                  <ToggleGroupItem value="all" className="text-xs px-3 py-1" aria-label="Show all videos">
                    All
                  </ToggleGroupItem>
                </ToggleGroup>

                {/* Action buttons moved to header */}
                <div className="flex items-center gap-2">
                  {selectedUnassignedCount > 0 && (
                    <ButtonWithTooltip
                      onClick={() => setShowDueDateDialog(true)}
                      disabled={isSubmitting || hasCompetingSelections}
                      size="sm"
                      tooltip={
                        hasCompetingSelections
                          ? competingTooltip
                          : `Assign ${selectedUnassignedCount} training${selectedUnassignedCount !== 1 ? "s" : ""}`
                      }
                    >
                      Assign ({selectedUnassignedCount})
                    </ButtonWithTooltip>
                  )}
                  {selectedAssignedCount > 0 && (
                    <ButtonWithTooltip
                      variant="destructive"
                      onClick={() => setShowUnassignDialog(true)}
                      disabled={isSubmitting || hasCompetingSelections}
                      size="sm"
                      tooltip={
                        hasCompetingSelections
                          ? competingTooltip
                          : `Unassign ${selectedAssignedCount} training${selectedAssignedCount !== 1 ? "s" : ""}`
                      }
                    >
                      Unassign ({selectedAssignedCount})
                    </ButtonWithTooltip>
                  )}
                </div>
              </div>

              {filteredVideosCount === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>
                    {filterMode === "unassigned" && "No unassigned videos available"}
                    {filterMode === "assigned" && "No assigned videos found"}
                    {filterMode === "completed" && "No completed videos found"}
                    {filterMode === "all" && "No videos available"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table flush>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        <SortableTableHead
                          column="course"
                          sortColumn={sortColumn}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        >
                          Course
                        </SortableTableHead>
                        <SortableTableHead
                          column="status"
                          sortColumn={sortColumn}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        >
                          Status
                        </SortableTableHead>
                        <TableHead className="whitespace-nowrap">Date</TableHead>
                        <TableHead className="whitespace-nowrap">Quiz Results</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVideos.map((video) => {
                        const isSelected = selectedVideoIds.has(video.id);
                        const isCompleted = completedVideoIds.has(video.id);
                        const status = getCompletionStatus(video.id);

                        return (
                          <TableRow key={video.id}>
                            <TableCell className="w-[40px]">
                              {!isCompleted && (
                                <Checkbox
                                  id={`video-${video.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleVideoToggle(video.id, checked as boolean)}
                                />
                              )}
                            </TableCell>

                            <TableCell>
                              <Label
                                htmlFor={`video-${video.id}`}
                                className={cn("flex items-center gap-2", !isCompleted && "cursor-pointer")}
                              >
                                <span className="font-medium text-sm">{video.title}</span>
                                {hiddenVideoIds.has(video.id) && (
                                  <Tooltip delayDuration={TOOLTIP_CONFIG.delayDuration}>
                                    <TooltipTrigger asChild>
                                      <span className="text-warning">
                                        <EyeOff className="h-4 w-4" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>This video is hidden from view on videos tab</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </Label>
                            </TableCell>

                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(status)}>
                                {STATUS_LABELS[status]}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <span className="text-sm whitespace-nowrap">{formatDueDate(video.id)}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm whitespace-nowrap">{getQuizResults(video.id)}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </DialogScrollArea>
      </FullscreenDialogContent>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost if you close this dialog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={closeModal}>Discard changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUnassignDialog} onOpenChange={setShowUnassignDialog}>
        <AlertDialogContent disableClose={isSubmitting}>
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign trainings?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unassign {selectedAssignedCount} training{selectedAssignedCount !== 1 ? "s" : ""}
              ? Any user progress will be lost and cannot be retrieved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnassign}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Unassigning..." : "Unassign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Due Date Selection Dialog */}
      <AlertDialog open={showDueDateDialog} onOpenChange={(open) => !open && resetDueDateDialog()}>
        <AlertDialogContent className="sm:max-w-md" disableClose={isSubmitting}>
          <AlertDialogHeader>
            <AlertDialogTitle>Select due date to assign trainings</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUnassignedCount} training{selectedUnassignedCount !== 1 ? "s" : ""} selected
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className={cn("space-y-4 py-4", isSubmitting && "opacity-50 pointer-events-none")}>
            <Label className="text-sm font-medium">Select due date</Label>
            <RadioGroup
              value={noDueDateRequired ? "none" : dueDateOption || ""}
              onValueChange={handleDueDateSelection}
              disabled={isSubmitting}
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="1week" id="due-1week" />
                <Label htmlFor="due-1week" className="text-base font-normal cursor-pointer">
                  1 week
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="2weeks" id="due-2weeks" />
                <Label htmlFor="due-2weeks" className="text-base font-normal cursor-pointer">
                  2 weeks
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="1month" id="due-1month" />
                <Label htmlFor="due-1month" className="text-base font-normal cursor-pointer">
                  1 month
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="none" id="due-none" />
                <Label htmlFor="due-none" className="text-base font-normal cursor-pointer">
                  No due date required
                </Label>
              </div>
            </RadioGroup>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} onClick={resetDueDateDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAssign} disabled={isSubmitting}>
              {isSubmitting ? "Assigning..." : "Assign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
