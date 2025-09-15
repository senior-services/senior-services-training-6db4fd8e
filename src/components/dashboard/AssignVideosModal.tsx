import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
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
import { Video, Play, Check, X, CalendarIcon } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { videoOperations, assignmentOperations, progressOperations } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import type { Employee, VideoAssignment } from '@/types/employee';
import type { Video as VideoType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';
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
  const [calendarOpen, setCalendarOpen] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unassigned'>('all');
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
        videoOperations.getAll(),
        employee ? assignmentOperations.getByEmployee(employee.id) : Promise.resolve({ success: true, data: [] as VideoAssignment[], error: null }),
        employee ? progressOperations.getByEmployee(employee.id) : Promise.resolve({ success: true, data: [], error: null })
      ]);

      if (videosResult.success && videosResult.data) {
        setVideos(videosResult.data);
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
    setFilterMode('all');
    onOpenChange(false);
  };

  // Helper function to get completion badge (similar to EmployeeManagement)
  const getCompletionBadge = (progressData: { progress_percent: number; completed_at: string | null }) => {
    const completionText = progressData.completed_at 
      ? `Completed (${format(new Date(progressData.completed_at), 'MMM dd, yyyy')})`
      : "Completed";
    return {
      variant: "ghost-success" as const,
      showIcon: true,
      text: completionText
    };
  };

  // Filter videos based on current filter mode
  const getFilteredVideos = () => {    
    switch (filterMode) {
      case 'unassigned':
        // Show videos that are not assigned and not completed
        return videos.filter(v => !assignedVideoIds.has(v.id) && !completedVideoIds.has(v.id));
      default: // 'all'
        // Show ALL videos including completed ones
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
      <DialogContent className="sm:max-w-2xl">
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
              <div className="space-y-3 py-3 border-b">
                <ToggleGroup 
                  type="single" 
                  value={filterMode} 
                  onValueChange={(value) => setFilterMode(value as typeof filterMode || 'all')}
                  variant="pill"
                  className="justify-start"
                >
                  <ToggleGroupItem value="all" className="text-xs px-3 py-1">
                    Show All
                  </ToggleGroupItem>
                  <ToggleGroupItem value="unassigned" className="text-xs px-3 py-1">
                    Unassigned
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
                     {filterMode === 'all' && 'No training videos available'}
                   </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredVideos
                    .sort((a, b) => {
                      if (filterMode === 'all') {
                        // In "Show All" mode, sort by completion status first, then alphabetically
                        const aCompleted = completedVideoIds.has(a.id);
                        const bCompleted = completedVideoIds.has(b.id);
                        
                        // If completion status differs, sort by completion (unassigned first)
                        if (aCompleted !== bCompleted) {
                          return aCompleted ? 1 : -1; // Unassigned (false) comes first
                        }
                        
                        // Within same group, sort alphabetically
                        return a.title.localeCompare(b.title);
                      } else {
                        // For "Unassigned" mode, keep alphabetical sorting
                        return a.title.localeCompare(b.title);
                      }
                    })
                     .map((video, index) => {
                    const isSelected = selectedVideoIds.has(video.id);
                    const wasOriginallyAssigned = assignedVideoIds.has(video.id);
                    const isCompleted = completedVideoIds.has(video.id);
                    const progressData = videoProgressData.get(video.id);
                    
                    return (
                       <div
                         key={video.id}
                         className="flex items-center justify-between py-3 border-b last:border-b-0 border-border-primary/50 transition-colors min-h-[69px]"
                       >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Checkbox
                            id={`video-${video.id}`}
                            checked={isSelected}
                            disabled={isCompleted}
                            onCheckedChange={(checked) => 
                              handleVideoToggle(video.id, checked as boolean)
                            }
                          />
                          
                          <Label 
                            htmlFor={`video-${video.id}`}
                            className={cn(
                              "flex-1 min-w-0",
                              !isCompleted && "cursor-pointer"
                            )}
                          >
                            <div className={cn(
                              "font-medium text-sm line-clamp-2",
                              isCompleted && "text-muted-foreground"
                            )}>
                              {video.title}
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center gap-4">
                          {isCompleted && progressData ? (
                            <Badge variant="ghost-success" showIcon>
                              {getCompletionBadge(progressData).text}
                            </Badge>
                          ) : isSelected && (
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
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "w-[160px] justify-start text-left font-normal",
                                    !videoDeadlines.get(video.id) && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-3 w-3" />
                                  {videoDeadlines.get(video.id) ? (
                                    format(videoDeadlines.get(video.id)!, "MMM dd, yyyy")
                                  ) : (
                                    <span className="text-xs">Pick due date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent 
                                className="w-auto p-0 z-[9999]" 
                                align="end"
                                side="bottom"
                                sideOffset={5}
                                avoidCollisions={true}
                                collisionPadding={20}
                              >
                                <Calendar
                                  mode="single"
                                  selected={videoDeadlines.get(video.id)}
                                  onSelect={(date) => handleDeadlineChange(video.id, date)}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>

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
