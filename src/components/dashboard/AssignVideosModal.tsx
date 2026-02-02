import React, { useState, useEffect } from 'react';
import {
  Dialog,
  FullscreenDialogContent,
  DialogHeader,
  DialogTitle,
  DialogScrollArea,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ButtonWithTooltip } from '@/components/ui/button-with-tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Video, EyeOff } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { videoOperations, assignmentOperations, progressOperations } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import type { Employee, VideoAssignment } from '@/types/employee';
import type { Video as VideoType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
import { TOOLTIP_CONFIG } from '@/constants/tooltip-config';
import { logger } from '@/utils/logger';

interface AssignVideosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onAssignmentComplete: () => void;
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
  const [videoProgressData, setVideoProgressData] = useState<Map<string, { progress_percent: number; completed_at: string | null }>>(new Map());
  const [videoDeadlines, setVideoDeadlines] = useState<Map<string, Date>>(new Map());
  const [initialVideoDeadlines, setInitialVideoDeadlines] = useState<Map<string, Date>>(new Map());
  const [assignmentData, setAssignmentData] = useState<Map<string, VideoAssignment>>(new Map());
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  const [hiddenVideoIds, setHiddenVideoIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'unassigned' | 'assigned' | 'completed' | 'all'>('unassigned');
  
  // Due date dialog state
  const [showDueDateDialog, setShowDueDateDialog] = useState(false);
  const [dueDateOption, setDueDateOption] = useState<'1week' | '2weeks' | '1month' | null>('1week');
  const [noDueDateRequired, setNoDueDateRequired] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (open && employee) {
      loadVideosAndAssignments();
    }
  }, [open, employee]);

  const loadVideosAndAssignments = async () => {
    if (!employee) return;

    setLoading(true);
    try {
      // Load videos, assignments, and progress data in parallel
      const [videosResult, assignmentsResult, progressResult] = await Promise.all([
        videoOperations.getAll(true), // Include hidden videos
        employee ? assignmentOperations.getByEmployee(employee.id) : Promise.resolve({ success: true, data: [] as VideoAssignment[], error: null }),
        employee ? progressOperations.getByEmployee(employee.id) : Promise.resolve({ success: true, data: [], error: null })
      ]);

      if (videosResult.success && videosResult.data) {
        setVideos(videosResult.data);
        
        // Track hidden videos (videos with archived_at)
        const hidden = new Set<string>(
          videosResult.data
            .filter(video => video.archived_at)
            .map(video => video.id)
        );
        setHiddenVideoIds(hidden);
      } else {
        throw new Error(videosResult.error || 'Failed to load videos');
      }

      // Process progress data to find completed videos and store progress info
      if (progressResult.success && progressResult.data) {
        const completed = new Set<string>();
        const progressMap = new Map<string, { progress_percent: number; completed_at: string | null }>();
        
        progressResult.data.forEach(progress => {
          progressMap.set(progress.video_id, {
            progress_percent: progress.progress_percent,
            completed_at: progress.completed_at
          });
          
          if (progress.progress_percent === 100 || progress.completed_at) {
            completed.add(progress.video_id);
          }
        });
        
        setCompletedVideoIds(completed);
        setVideoProgressData(progressMap);
      }

      if (assignmentsResult.success && assignmentsResult.data) {
        const currentlyAssigned = new Set(assignmentsResult.data.map(a => a.video_id));
        setAssignedVideoIds(currentlyAssigned);
        setSelectedVideoIds(new Set());

        // Store assignment data for tooltip information
        const assignments = new Map<string, VideoAssignment>();
        assignmentsResult.data.forEach(a => {
          assignments.set(a.video_id, a);
        });
        setAssignmentData(assignments);

        // Load existing deadlines for assigned videos
        const deadlines = new Map<string, Date>();
        assignmentsResult.data.forEach(a => {
          if (a.due_date) {
            try {
              deadlines.set(a.video_id, new Date(a.due_date));
            } catch {}
          }
        });
        setInitialVideoDeadlines(deadlines);
        setVideoDeadlines(new Map(deadlines));
      } else if (assignmentsResult.error) {
        logger.warn('Failed to load assignments', { error: assignmentsResult.error });
      }
    } catch (error) {
      logger.error('Error loading videos and assignments', error as Error);
      toast({
        title: "Error",
        description: "Failed to load video assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoToggle = (videoId: string, checked: boolean) => {
    // Prevent toggling completed videos
    if (completedVideoIds.has(videoId)) return;
    
    setSelectedVideoIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(videoId);
        // When a video is selected for assignment, automatically mark it as Required
        setVideos(prevVideos => prevVideos.map(v => 
          v.id === videoId ? { ...v, type: 'Required' } : v
        ));
      } else {
        newSet.delete(videoId);
        // Remove deadline when video is unselected and mark as Optional
        setVideoDeadlines(prev => {
          const newDeadlines = new Map(prev);
          newDeadlines.delete(videoId);
          return newDeadlines;
        });
        setVideos(prevVideos => prevVideos.map(v => 
          v.id === videoId ? { ...v, type: 'Optional' } : v
        ));
      }
      return newSet;
    });
  };

  const handleDeadlineChange = (videoId: string, date: Date | undefined) => {
    setVideoDeadlines(prev => {
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
      case '1week': {
        const date = new Date(today);
        date.setDate(date.getDate() + 7);
        return date;
      }
      case '2weeks': {
        const date = new Date(today);
        date.setDate(date.getDate() + 14);
        return date;
      }
      case '1month': {
        const date = new Date(today);
        date.setMonth(date.getMonth() + 1);
        return date;
      }
      default:
        return undefined;
    }
  };

  // Handle toggle selection - uncheck "no due date" when selecting a preset
  const handleDueDateOptionChange = (value: string) => {
    if (value) {
      setDueDateOption(value as '1week' | '2weeks' | '1month');
      setNoDueDateRequired(false);
    }
  };

  // Handle checkbox - deselect toggles when checking "no due date"
  const handleNoDueDateChange = (checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    setNoDueDateRequired(isChecked);
    if (isChecked) {
      setDueDateOption(null);
    } else {
      setDueDateOption('1week');
    }
  };

  // Reset dialog state when closing
  const resetDueDateDialog = () => {
    setDueDateOption('1week');
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const promises: Promise<any>[] = [];
      for (const videoId of videosToAssign) {
        promises.push(assignmentOperations.create(videoId, employee.id, user.id, dueDate));
      }

      await Promise.all(promises);

      toast({
        title: "Success",
        description: `${videosToAssign.size} training${videosToAssign.size !== 1 ? 's' : ''} assigned to ${employee.full_name || employee.email}`,
      });

      onAssignmentComplete();
      await loadVideosAndAssignments();
    } catch (error) {
      logger.error('Error assigning videos', error as Error);
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
        description: `${videosToUnassign.size} training${videosToUnassign.size !== 1 ? 's' : ''} unassigned from ${employee.full_name || employee.email}`,
      });

      onAssignmentComplete();
      await loadVideosAndAssignments();
    } catch (error) {
      logger.error('Error unassigning videos', error as Error);
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
    setFilterMode('unassigned');
    resetDueDateDialog();
    onOpenChange(false);
  };

  // Get completion status for a video
  const getCompletionStatus = (videoId: string): 'overdue' | 'pending' | 'completed' | 'unassigned' => {
    if (completedVideoIds.has(videoId)) return 'completed';
    if (!assignedVideoIds.has(videoId)) return 'unassigned';
    
    const deadline = videoDeadlines.get(videoId) || assignmentData.get(videoId)?.due_date;
    if (deadline) {
      const dueDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
      if (isPast(dueDate) && !completedVideoIds.has(videoId)) {
        return 'overdue';
      }
    }
    return 'pending';
  };

  // Format due date for display
  const formatDueDate = (videoId: string): string => {
    if (!assignedVideoIds.has(videoId) && !selectedVideoIds.has(videoId)) return '--';
    
    if (completedVideoIds.has(videoId)) {
      const progressData = videoProgressData.get(videoId);
      if (progressData?.completed_at) {
        return format(new Date(progressData.completed_at), 'MMM dd, yyyy');
      }
    }
    
    const deadline = videoDeadlines.get(videoId);
    const existingDueDate = assignmentData.get(videoId)?.due_date;
    
    if (deadline) {
      return format(deadline, 'MMM dd, yyyy');
    } else if (existingDueDate) {
      return format(new Date(existingDueDate), 'MMM dd, yyyy');
    }
    return 'N/A';
  };

  // Get badge variant for completion status (using soft variants for visibility)
  const getStatusBadgeVariant = (status: 'overdue' | 'pending' | 'completed' | 'unassigned') => {
    switch (status) {
      case 'completed': return 'soft-success';
      case 'overdue': return 'soft-destructive';
      case 'pending': return 'secondary';
      case 'unassigned': return 'soft-tertiary';
    }
  };

  // Filter videos based on current filter mode
  const getFilteredVideos = () => {    
    switch (filterMode) {
      case 'unassigned':
        // Show videos that are not assigned and not completed
        return videos
          .filter(v => !assignedVideoIds.has(v.id) && !completedVideoIds.has(v.id))
          .sort((a, b) => a.title.localeCompare(b.title));
      case 'assigned':
        // Show videos currently assigned to employee (excluding completed)
        return videos
          .filter(v => assignedVideoIds.has(v.id) && !completedVideoIds.has(v.id))
          .sort((a, b) => a.title.localeCompare(b.title));
      case 'completed':
        // Show only completed videos
        return videos
          .filter(v => completedVideoIds.has(v.id))
          .sort((a, b) => a.title.localeCompare(b.title));
      case 'all':
        // Show all videos
        return videos
          .sort((a, b) => a.title.localeCompare(b.title));
      default:
        return videos;
    }
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

        <DialogScrollArea>
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
                  onValueChange={(value) => setFilterMode(value as typeof filterMode || 'unassigned')}
                  variant="pill"
                  className="justify-start flex-wrap"
                >
                  <ToggleGroupItem value="unassigned" className="text-xs px-3 py-1" aria-label="Filter by unassigned videos">
                    Unassigned
                  </ToggleGroupItem>
                  <ToggleGroupItem value="assigned" className="text-xs px-3 py-1" aria-label="Filter by assigned videos">
                    Assigned
                  </ToggleGroupItem>
                  <ToggleGroupItem value="completed" className="text-xs px-3 py-1" aria-label="Filter by completed videos">
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
                      tooltip={hasCompetingSelections ? competingTooltip : `Assign ${selectedUnassignedCount} training${selectedUnassignedCount !== 1 ? 's' : ''}`}
                    >
                      Assign ({selectedUnassignedCount})
                    </ButtonWithTooltip>
                  )}
                  {selectedAssignedCount > 0 && (
                    <ButtonWithTooltip
                      variant="outline"
                      onClick={() => setShowUnassignDialog(true)}
                      disabled={isSubmitting || hasCompetingSelections}
                      size="sm"
                      tooltip={hasCompetingSelections ? competingTooltip : `Unassign ${selectedAssignedCount} training${selectedAssignedCount !== 1 ? 's' : ''}`}
                      className="border-destructive text-destructive hover:bg-destructive/10"
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
                      {filterMode === 'unassigned' && 'No unassigned videos available'}
                      {filterMode === 'assigned' && 'No assigned videos found'}
                      {filterMode === 'completed' && 'No completed videos found'}
                      {filterMode === 'all' && 'No videos available'}
                    </p>
                 </div>
              ) : (
                 <div className="overflow-x-auto">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead className="w-[40px]"></TableHead>
                         <TableHead>Course</TableHead>
                         <TableHead>Completion Status</TableHead>
                         <TableHead>Due Date</TableHead>
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
                               <Checkbox
                                 id={`video-${video.id}`}
                                 checked={isSelected}
                                 disabled={isCompleted}
                                 onCheckedChange={(checked) => 
                                   handleVideoToggle(video.id, checked as boolean)
                                 }
                               />
                             </TableCell>
                             
                             <TableCell>
                               <Label 
                                 htmlFor={`video-${video.id}`}
                                 className={cn(
                                   "flex items-center gap-2",
                                   !isCompleted && "cursor-pointer"
                                 )}
                               >
                                 <span className={cn(
                                   "font-medium text-sm",
                                   isCompleted && "text-muted-foreground"
                                 )}>
                                   {video.title}
                                 </span>
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
                                 {status.charAt(0).toUpperCase() + status.slice(1)}
                               </Badge>
                             </TableCell>
                             
                             <TableCell>
                               <span className="text-sm text-muted-foreground">
                                 {formatDueDate(video.id)}
                               </span>
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
              Are you sure you want to unassign {selectedAssignedCount} training{selectedAssignedCount !== 1 ? 's' : ''}? 
              Any user progress will be lost and cannot be retrieved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnassign}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Unassigning...' : 'Unassign'}
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
              {selectedUnassignedCount} training{selectedUnassignedCount !== 1 ? 's' : ''} selected
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className={cn("space-y-6 py-4", isSubmitting && "opacity-50 pointer-events-none")}>
            {/* Date preset toggles */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium text-foreground">Training due in</span>
              <ToggleGroup 
                type="single" 
                value={noDueDateRequired ? '' : (dueDateOption || '')}
                onValueChange={handleDueDateOptionChange}
                disabled={isSubmitting}
                className="gap-2"
              >
                <ToggleGroupItem 
                  value="1week" 
                  className="border rounded-md px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  aria-label="Due in 1 week"
                >
                  1 week
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="2weeks" 
                  className="border rounded-md px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  aria-label="Due in 2 weeks"
                >
                  2 weeks
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="1month" 
                  className="border rounded-md px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  aria-label="Due in 1 month"
                >
                  1 month
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            {/* No due date checkbox with enhanced accessibility */}
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="no-due-date" 
                checked={noDueDateRequired}
                onCheckedChange={handleNoDueDateChange}
                disabled={isSubmitting}
                aria-describedby="no-due-date-desc"
              />
              <div className="grid gap-1.5 leading-none">
                <Label 
                  htmlFor="no-due-date" 
                  className="text-sm font-normal cursor-pointer"
                >
                  No due date required
                </Label>
                <p id="no-due-date-desc" className="text-xs text-muted-foreground">
                  Training will be assigned without a deadline
                </p>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} onClick={resetDueDateDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAssign}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Assigning...' : 'Assign'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
