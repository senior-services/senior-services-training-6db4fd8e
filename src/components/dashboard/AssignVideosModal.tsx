import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { EmployeeService } from '@/services/employeeService';
import { videoService } from '@/services/supabase';
import type { Employee } from '@/types/employee';
import type { Video as VideoType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { LoadingSkeleton } from '@/components/ui/loading-spinner';

interface AssignVideosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onAssignmentComplete: () => void;
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
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      // Load all videos
      const allVideosResult = await videoService.getAll();
      if (allVideosResult.success && allVideosResult.data) {
        setVideos(allVideosResult.data);
      }

      // Load current assignments
      const assignments = await EmployeeService.getEmployeeAssignments(employee.id);
      const currentlyAssigned = new Set(assignments.map(a => a.video_id));
      setAssignedVideoIds(currentlyAssigned);
      setSelectedVideoIds(new Set(currentlyAssigned));
    } catch (error) {
      console.error('Error loading videos and assignments:', error);
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
      } else {
        newSet.delete(videoId);
        // Remove deadline when video is unselected
        setVideoDeadlines(prev => {
          const newDeadlines = new Map(prev);
          newDeadlines.delete(videoId);
          return newDeadlines;
        });
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

  const handleSubmit = async () => {
    if (!employee) return;

    setIsSubmitting(true);
    try {
      // Determine which videos to assign and which to unassign
      const toAssign = [...selectedVideoIds].filter(id => !assignedVideoIds.has(id));
      const toUnassign = [...assignedVideoIds].filter(id => !selectedVideoIds.has(id));

      // Process assignments
      for (const videoId of toAssign) {
        await EmployeeService.assignVideoToEmployee(videoId, employee.id);
      }

      // Process unassignments
      for (const videoId of toUnassign) {
        await EmployeeService.removeVideoAssignment(videoId, employee.id);
      }

      toast({
        title: "Success",
        description: `Video assignments updated for ${employee.full_name || employee.email}`,
      });

      onAssignmentComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating assignments:', error);
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
    setSelectedVideoIds(new Set(assignedVideoIds));
    setVideoDeadlines(new Map()); // Clear deadlines on close
    onOpenChange(false);
  };

  if (!employee) return null;

  const hasChanges = !areSetEqual(selectedVideoIds, assignedVideoIds);
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
              <div className="flex items-center justify-between py-2 flex-shrink-0 border-b">
                <div className="flex items-center gap-2">
                  <Badge variant={selectedCount > 0 ? "default" : "secondary"}>
                    {selectedCount} video{selectedCount !== 1 ? 's' : ''} selected
                  </Badge>
                  {hasChanges && (
                    <Badge variant="outline" className="text-orange-600">
                      Unsaved changes
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVideoIds(new Set())}
                    disabled={selectedVideoIds.size === 0}
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVideoIds(new Set(videos.map(v => v.id)))}
                    disabled={selectedVideoIds.size === videos.length}
                  >
                    Select All
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 mt-4">
                <div className="space-y-3 pr-4">
                  {videos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No training videos available</p>
                    </div>
                  ) : (
                    videos.map((video) => {
                      const isSelected = selectedVideoIds.has(video.id);
                      const wasOriginallyAssigned = assignedVideoIds.has(video.id);
                      
                      return (
                        <div
                          key={video.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            isSelected ? 'bg-primary/5 border-primary/20' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={`video-${video.id}`}
                            checked={isSelected}
                            onChange={(e) => 
                              handleVideoToggle(video.id, e.target.checked)
                            }
                            className="mt-1 flex-shrink-0 w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              {/* Video thumbnail/placeholder */}
                              <div className="relative w-16 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                {video.thumbnail_url ? (
                                  <img 
                                    src={video.thumbnail_url} 
                                    alt={video.title}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <Play className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">
                                  {video.title}
                                </div>
                                {video.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {video.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  {wasOriginallyAssigned && (
                                    <Badge 
                                      variant={isSelected ? "default" : "secondary"} 
                                      className="text-xs"
                                    >
                                      {isSelected ? (
                                        <>
                                          <Check className="w-3 h-3 mr-1" />
                                          Assigned
                                        </>
                                      ) : (
                                        <>
                                          <X className="w-3 h-3 mr-1" />
                                          Will Remove
                                        </>
                                      )}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Calendar Picker - Only show when video is selected */}
                          {isSelected && (
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                      "w-[180px] justify-start text-left font-normal",
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
                                <PopoverContent className="w-auto p-0" align="end">
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
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
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
    </Dialog>
  );
};

// Utility function to compare sets
function areSetEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
  if (set1.size !== set2.size) return false;
  for (const item of set1) {
    if (!set2.has(item)) return false;
  }
  return true;
}