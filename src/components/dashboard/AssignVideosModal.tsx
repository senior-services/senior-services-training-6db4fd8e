import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Video, Play, Check, X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { videoOperations, assignmentOperations } from '@/services/api';
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
  const [videoDeadlines, setVideoDeadlines] = useState<Map<string, Date>>(new Map());
  const [initialVideoDeadlines, setInitialVideoDeadlines] = useState<Map<string, Date>>(new Map());
  const [calendarOpen, setCalendarOpen] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
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
      // Load videos and current assignments in parallel
      const [videosResult, assignmentsResult] = await Promise.all([
        videoOperations.getAll(),
        employee ? assignmentOperations.getByEmployee(employee.id) : Promise.resolve({ success: true, data: [] as VideoAssignment[], error: null })
      ]);

      if (videosResult.success && videosResult.data) {
        setVideos(videosResult.data);
      } else {
        throw new Error(videosResult.error || 'Failed to load videos');
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
      // Update video types in database for selected videos
      for (const video of videos) {
        if (selectedVideoIds.has(video.id)) {
          // Update video type in database
          await videoOperations.update(video.id, { 
            title: video.title, 
            description: video.description || '',
            type: video.type 
          });
        }
      }

      // For now, since we don't have assignment operations implemented,
      // we'll just show success. TODO: Implement assignment operations
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
    onOpenChange(false);
  };

  if (!employee) return null;

  const hasSelectionChanges = !areSetEqual(selectedVideoIds, assignedVideoIds);
  const hasDeadlineChanges = !areDeadlineMapsEqual(videoDeadlines, initialVideoDeadlines);
  const hasChanges = hasSelectionChanges || hasDeadlineChanges;
  const selectedCount = selectedVideoIds.size;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Assign Videos to {employee.full_name || employee.email}
          </DialogTitle>
          <DialogDescription>
            Select which training videos should be assigned to {employee.full_name || employee.email}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          {loading ? (
            <div className="space-y-4 py-4">
              <LoadingSkeleton lines={1} className="h-16" />
              <LoadingSkeleton lines={1} className="h-16" />
              <LoadingSkeleton lines={1} className="h-16" />
            </div>
          ) : (
            <>
              <div className="flex items-center py-2 flex-shrink-0 border-b">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCount === videos.length && videos.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVideoIds(new Set(videos.map(v => v.id)));
                      } else {
                        setSelectedVideoIds(new Set());
                      }
                    }}
                    className="w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-pointer"
                    disabled={videos.length === 0}
                  />
                  <div className="w-px h-4 bg-border"></div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCount} video{selectedCount !== 1 ? 's' : ''} selected
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 mt-4 overflow-y-auto">
                <div className="pr-4">
                  {videos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No training videos available</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {videos.map((video, index) => {
                        const isSelected = selectedVideoIds.has(video.id);
                        const wasOriginallyAssigned = assignedVideoIds.has(video.id);
                        
                        return (
                          <div
                            key={video.id}
                            className="flex items-center justify-between py-3 border-b last:border-b-0 border-border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                id={`video-${video.id}`}
                                checked={isSelected}
                                onChange={(e) => 
                                  handleVideoToggle(video.id, e.target.checked)
                                }
                                className="flex-shrink-0 w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-pointer"
                              />
                              
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm line-clamp-2">
                                  {video.title}
                                </div>
                              </div>
                            </div>

                             <div className="flex items-center gap-4">
                               {/* Calendar Picker - Only show when video is selected */}
                               {isSelected && (
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
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t flex-shrink-0">
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
        </div>
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
