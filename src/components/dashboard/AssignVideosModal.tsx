import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Video, Users, Play, Check, X } from 'lucide-react';
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
      }
      return newSet;
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
        description: `Video assignments updated for ${employee.is_generic ? 'white-label domains' : employee.full_name || employee.email}`,
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
    onOpenChange(false);
  };

  if (!employee) return null;

  const hasChanges = !areSetEqual(selectedVideoIds, assignedVideoIds);
  const selectedCount = selectedVideoIds.size;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Assign Videos to{' '}
            {employee.is_generic ? (
              <>
                <Users className="w-4 h-4" />
                White-Label Domains
              </>
            ) : (
              employee.full_name || employee.email
            )}
          </DialogTitle>
          <DialogDescription>
            {employee.is_generic 
              ? 'Videos assigned here will be available to all users from authorized domains.'
              : `Select which training videos should be assigned to ${employee.full_name || employee.email}.`
            }
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <LoadingSkeleton lines={1} className="h-16" />
            <LoadingSkeleton lines={1} className="h-16" />
            <LoadingSkeleton lines={1} className="h-16" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between py-2">
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

            <ScrollArea className="h-96 pr-4">
              <div className="space-y-3">
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
                          isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          id={`video-${video.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => 
                            handleVideoToggle(video.id, checked as boolean)
                          }
                          className="mt-1"
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
                              <label 
                                htmlFor={`video-${video.id}`}
                                className="font-medium text-sm cursor-pointer line-clamp-1"
                              >
                                {video.title}
                              </label>
                              {video.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {video.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {video.type}
                                </Badge>
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
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-3 pt-4 border-t">
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
                {isSubmitting ? 'Saving...' : 'Save Assignments'}
              </Button>
            </div>
          </>
        )}
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