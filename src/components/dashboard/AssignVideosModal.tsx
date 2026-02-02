import React, { useState, useEffect } from 'react';
import {
  Dialog,
  FullscreenDialogContent,
  DialogHeader,
  DialogTitle,
  DialogScrollArea,
  DialogFooter,
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Video, CalendarIcon, EyeOff } from 'lucide-react';
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
  const [calendarOpen, setCalendarOpen] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [hiddenVideoIds, setHiddenVideoIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'unassigned' | 'assigned' | 'completed' | 'all'>('unassigned');
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
        setSelectedVideoIds(new Set(currentlyAssigned));

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
    
    // Auto-close calendar after date selection
    if (date) {
      setCalendarOpen(prev => {
        const newOpen = new Map(prev);
        newOpen.set(videoId, false);
        return newOpen;
      });
    }
  };

  const handleSubmit = async () => {
    if (!employee) return;

    setIsSubmitting(true);
    try {
      // Get current user to set as assigned_by
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Create a map of existing assignments for quick lookup
      const existingAssignmentsResult = await assignmentOperations.getByEmployee(employee.id);
      const existingAssignments = new Map<string, VideoAssignment>();
      
      if (existingAssignmentsResult.success && existingAssignmentsResult.data) {
        existingAssignmentsResult.data.forEach(assignment => {
          existingAssignments.set(assignment.video_id, assignment);
        });
      }

      // Process assignments: create new ones, update existing ones, delete unselected ones
      const promises: Promise<any>[] = [];

      // Handle selected videos
      for (const videoId of selectedVideoIds) {
        const existingAssignment = existingAssignments.get(videoId);
        const dueDate = videoDeadlines.get(videoId);

        if (existingAssignment) {
          // Update existing assignment if due date changed
          const existingDueDate = existingAssignment.due_date ? new Date(existingAssignment.due_date) : null;
          const newDueDate = dueDate || null;
          
          // Compare dates by converting to ISO date strings (YYYY-MM-DD)
          const existingDateStr = existingDueDate?.toISOString().split('T')[0] || null;
          const newDateStr = newDueDate?.toISOString().split('T')[0] || null;
          
          if (existingDateStr !== newDateStr) {
            promises.push(
              assignmentOperations.update(existingAssignment.id, { due_date: dueDate })
            );
          }
        } else {
          // Create new assignment
          promises.push(
            assignmentOperations.create(videoId, employee.id, user.id, dueDate)
          );
        }
      }

      // Delete assignments for unselected videos
      for (const [videoId, assignment] of existingAssignments) {
        if (!selectedVideoIds.has(videoId)) {
          promises.push(
            assignmentOperations.delete(assignment.id)
          );
        }
      }

      // Execute all operations
      await Promise.all(promises);

      toast({
        title: "Success",
        description: `Video assignments updated for ${employee.full_name || employee.email}`,
      });

      onAssignmentComplete();
      onOpenChange(false);
    } catch (error) {
      logger.error('Error updating assignments', error as Error);
      toast({
        title: "Error",
        description: "Failed to update video assignments",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    const hasSelectionChanges = !areSetEqual(selectedVideoIds, assignedVideoIds);
    const hasDeadlineChanges = !areDeadlineMapsEqual(videoDeadlines, initialVideoDeadlines);
    const hasChanges = hasSelectionChanges || hasDeadlineChanges;
    
    if (hasChanges) {
      setShowDiscardDialog(true);
    } else {
      closeModal();
    }
  };

  const closeModal = () => {
    setSelectedVideoIds(new Set(assignedVideoIds));
    setVideoDeadlines(new Map(initialVideoDeadlines));
    setCalendarOpen(new Map());
    setShowDiscardDialog(false);
    setFilterMode('unassigned');
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

  const hasSelectionChanges = !areSetEqual(selectedVideoIds, assignedVideoIds);
  const hasDeadlineChanges = !areDeadlineMapsEqual(videoDeadlines, initialVideoDeadlines);
  const hasChanges = hasSelectionChanges || hasDeadlineChanges;
  const selectedCount = selectedVideoIds.size;
  const filteredVideos = getFilteredVideos();
  const filteredVideosCount = filteredVideos.length;
  const selectableVideosCount = filteredVideos.filter(v => !completedVideoIds.has(v.id)).length;
  const selectedFilteredCount = filteredVideos.filter(v => selectedVideoIds.has(v.id) && !completedVideoIds.has(v.id)).length;

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
              <div className="space-y-3 pb-3 border-b">
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

                <div className="flex items-center gap-3">
                   <Checkbox
                     id="select-all"
                     checked={selectedFilteredCount === filteredVideos.filter(v => !completedVideoIds.has(v.id)).length && filteredVideos.filter(v => !completedVideoIds.has(v.id)).length > 0}
                     onCheckedChange={(checked) => {
                       const selectableVideos = filteredVideos.filter(v => !completedVideoIds.has(v.id));
                       if (checked) {
                         setSelectedVideoIds(new Set([
                           ...Array.from(selectedVideoIds).filter(id => completedVideoIds.has(id) || !selectableVideos.some(v => v.id === id)),
                           ...selectableVideos.map(v => v.id)
                         ]));
                       } else {
                         setSelectedVideoIds(new Set(Array.from(selectedVideoIds).filter(id => 
                           completedVideoIds.has(id) || !selectableVideos.some(v => v.id === id)
                         )));
                       }
                     }}
                     disabled={filteredVideos.filter(v => !completedVideoIds.has(v.id)).length === 0}
                   />
                   <div className="w-px h-4 bg-border"></div>
                   <Label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
                     {selectedFilteredCount} of {selectableVideosCount} video{selectableVideosCount !== 1 ? 's' : ''} selected
                   </Label>
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
                               {isSelected && !isCompleted ? (
                                 <Popover 
                                   open={calendarOpen.get(video.id) || false}
                                   onOpenChange={(open) => {
                                     setCalendarOpen(prev => {
                                       const newOpen = new Map(prev);
                                       newOpen.set(video.id, open);
                                       return newOpen;
                                     });
                                   }}
                                 >
                                   <PopoverTrigger asChild>
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       className={cn(
                                         "h-8 justify-start text-left font-normal px-2",
                                         !videoDeadlines.get(video.id) && "text-muted-foreground"
                                       )}
                                     >
                                       <CalendarIcon className="mr-2 h-3 w-3" />
                                       {formatDueDate(video.id)}
                                     </Button>
                                   </PopoverTrigger>
                                   <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                                     <Calendar
                                       mode="single"
                                       selected={videoDeadlines.get(video.id)}
                                       onSelect={(date) => handleDeadlineChange(video.id, date)}
                                       disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                       initialFocus
                                     />
                                   </PopoverContent>
                                 </Popover>
                               ) : (
                                 <span className="text-sm text-muted-foreground">
                                   {formatDueDate(video.id)}
                                 </span>
                               )}
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

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!hasChanges || isSubmitting}
          >
            {isSubmitting ? 'Assigning...' : 'Assign Videos'}
          </Button>
        </DialogFooter>
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
    </Dialog>
  );
};
