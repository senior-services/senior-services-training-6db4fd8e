/**
 * Video Management Component - Handles all video-related operations
 * Extracted from AdminDashboard for better separation of concerns
 */

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { EyeOff, ChevronDown, Eye, Settings } from "lucide-react";
import { TrainingSettingsModal } from "./TrainingSettingsModal";
import { VideoTable } from "./VideoTable";
import { AddContentModal, ContentFormData } from "../content/AddContentModal";
import { EditVideoModal } from "../EditVideoModal";
import { VideoPlayerModal } from "../VideoPlayerModal";
import { IconButtonWithTooltip } from "../ui/icon-button-with-tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { videoOperations, employeeOperations, assignmentOperations } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import { logger, performanceTracker } from "@/utils/logger";
import { sanitizeInput } from "@/utils/security";
import { detectContentTypeFromUrl } from "@/utils/videoUtils";
import { formatLong } from "@/utils/date-formatter";
import type { Video } from "@/types";

interface VideoManagementProps {
  userEmail: string;
  onVideoCountChange?: (count: number) => void;
}

// Pending assignment data for confirmation dialog
interface PendingAssignment {
  contentData: ContentFormData;
  employeeCount: number;
}

export const VideoManagement: React.FC<VideoManagementProps> = ({ userEmail, onVideoCountChange }) => {
  // State management
  const [videos, setVideos] = useState<Video[]>([]);
  const [hiddenVideos, setHiddenVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [isEditVideoModalOpen, setIsEditVideoModalOpen] = useState(false);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<PendingAssignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settings modal state
  const [settingsVideo, setSettingsVideo] = useState<Video | null>(null);
  const [pendingShowVideo, setPendingShowVideo] = useState<Video | null>(null);

  // Load videos on mount
  useEffect(() => {
    loadVideos();
    loadHiddenVideos();
  }, []);

  /**
   * Loads videos using the unified API service
   */
  const loadVideos = async () => {
    setLoading(true);
    try {
      // Check authentication status first
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to view videos");
        setLoading(false);
        return;
      }
      const result = await videoOperations.getAll(false); // Only get visible (non-hidden) videos

      if (result.success && result.data) {
        setVideos(result.data);
        onVideoCountChange?.(result.data.length);
        logger.info("Videos loaded successfully", {
          count: result.data.length,
          adminUser: userEmail,
        });
      } else {
        logger.error("Failed to load videos", undefined, {
          error: result.error,
          adminUser: userEmail,
        });
        toast.error(result.error || "Failed to load videos");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred while loading videos");
    }
    setLoading(false);
  };

  /**
   * Loads hidden videos (using semantic wrapper)
   */
  const loadHiddenVideos = async () => {
    try {
      const result = await videoOperations.getHidden();
      if (result.success && result.data) {
        setHiddenVideos(result.data);
      } else {
        logger.error("Failed to load hidden videos", undefined, {
          error: result.error,
          adminUser: userEmail,
        });
      }
    } catch (error) {
      logger.error("Error loading hidden videos", error as Error);
    }
  };

  /**
   * Handles adding a new video - may trigger confirmation if assigning to all
   */
  const handleAddVideo = async (contentData: ContentFormData) => {
    // If assigning to all employees, fetch count and show confirmation
    if (contentData.assignToAll) {
      const employeesResult = await employeeOperations.getAll();

      if (employeesResult.success && employeesResult.data) {
        const activeEmployees = employeesResult.data.filter((emp) => emp.email); // Filter valid employees

        if (activeEmployees.length === 0) {
          // No employees - just create the video
          await createVideoOnly(contentData);
        } else {
          // Show confirmation dialog
          setPendingAssignment({
            contentData,
            employeeCount: activeEmployees.length,
          });
          setShowConfirmDialog(true);
        }
      } else {
        toast.error("Failed to fetch employees. Please try again.");
      }
    } else {
      // No assignment - just create the video
      await createVideoOnly(contentData);
    }
  };

  /**
   * Creates video without any assignments
   */
  const createVideoOnly = async (contentData: ContentFormData) => {
    const operation = "addVideo";
    performanceTracker.start(operation);

    // Sanitize input data
    const sanitizedData = {
      title: sanitizeInput(contentData.title || "Untitled Content"),
      description: contentData.description ? sanitizeInput(contentData.description, 1000) : null,
      video_url: contentData.url?.trim() || null,
      video_file_name: null,
      type: "Required" as const,
      content_type: contentData.content_type,
      duration_seconds: contentData.duration_seconds || 0,
    };

    const result = await videoOperations.create(sanitizedData);
    if (result.success) {
      toast.success(`"${sanitizedData.title}" has been added to the training library.`);
      await loadVideos();
      setIsAddVideoModalOpen(false);
    } else {
      toast.error(result.error || "Failed to add video");
    }
    performanceTracker.end(operation);

    return result;
  };

  /**
   * Handles confirmed assignment to all employees
   */
  const handleConfirmAssignment = async () => {
    if (!pendingAssignment) return;

    setIsSubmitting(true);
    const operation = "addVideoWithAssignment";
    performanceTracker.start(operation);

    try {
      const { contentData } = pendingAssignment;

      // Sanitize input data
      const sanitizedData = {
        title: sanitizeInput(contentData.title || "Untitled Content"),
        description: contentData.description ? sanitizeInput(contentData.description, 1000) : null,
        video_url: contentData.url?.trim() || null,
        video_file_name: null,
        type: "Required" as const,
        content_type: contentData.content_type,
        duration_seconds: contentData.duration_seconds || 0,
      };

      // Create the video first
      const videoResult = await videoOperations.create(sanitizedData);

      if (!videoResult.success || !videoResult.data) {
        toast.error(videoResult.error || "Failed to add video");
        return;
      }

      const newVideo = videoResult.data;

      // Get current user for assigned_by
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication error. Please log in again.");
        return;
      }

      // Fetch all active employees
      const employeesResult = await employeeOperations.getAll();

      if (employeesResult.success && employeesResult.data) {
        const activeEmployees = employeesResult.data.filter((emp) => emp.email);

        if (activeEmployees.length > 0) {
          // Prepare batch assignment data
          const assignments = activeEmployees.map((emp) => ({
            video_id: newVideo.id,
            employee_id: emp.id,
            assigned_by: user.id,
            due_date: contentData.dueDate,
          }));

          // Use batch insert for efficiency
          const assignResult = await assignmentOperations.createBatch(assignments);

          if (assignResult.success) {
            toast.success(
              `"${sanitizedData.title}" added and assigned to ${activeEmployees.length} employee${activeEmployees.length !== 1 ? "s" : ""}`,
            );
          } else {
            // Video created but assignment failed
            toast.error(`Video added but failed to assign: ${assignResult.error}`);
            logger.error("Batch assignment failed", undefined, {
              videoId: newVideo.id,
              error: assignResult.error,
            });
          }
        } else {
          toast.success(`"${sanitizedData.title}" has been added to the training library.`);
        }
      } else {
        toast.success(`"${sanitizedData.title}" has been added (could not fetch employees for assignment).`);
      }

      await loadVideos();
      setIsAddVideoModalOpen(false);
    } catch (error) {
      logger.error("Error adding video with assignments", error as Error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
      setPendingAssignment(null);
      performanceTracker.end(operation);
    }
  };

  /**
   * Cancels the pending assignment and just creates the video
   */
  const handleCancelConfirmation = () => {
    setShowConfirmDialog(false);
    setPendingAssignment(null);
  };

  /**
   * Handles editing a video
   */
  const handleEditVideo = (video: Video) => {
    logger.videoEvent("edit_started", video.id, {
      title: video.title,
      adminUser: userEmail,
    });
    setEditingVideo(video);
    setIsEditVideoModalOpen(true);
  };

  /**
   * Handles updating video details
   */
  const handleUpdateVideo = async (
    videoId: string,
    updates: {
      title: string;
      description: string;
    },
  ) => {
    const operation = "updateVideo";
    performanceTracker.start(operation);

    // Find the video to get its URL
    const video = videos.find((v) => v.id === videoId) || hiddenVideos.find((v) => v.id === videoId);
    const sanitizedUpdates = {
      title: sanitizeInput(updates.title),
      description: updates.description ? sanitizeInput(updates.description, 1000) : null,
      // Auto-detect content type from URL when available
      ...(video?.video_url && {
        content_type: detectContentTypeFromUrl(video.video_url) || video.content_type || "video",
      }),
    };
    const result = await videoOperations.update(videoId, sanitizedUpdates);
    if (result.success) {
      toast.success("Video details have been updated.");
      await loadVideos();
      setIsEditVideoModalOpen(false);
      setEditingVideo(null);
    } else {
      toast.error(result.error || "Failed to update video");
    }
    performanceTracker.end(operation);
  };

  /**
   * Handles video deletion - separate handler for the EditVideoModal
   */
  const handleDeleteVideo = async (videoId: string) => {
    const result = await videoOperations.delete(videoId);
    if (result.success) {
      toast.success("Video has been removed from the library.");
      await loadVideos();
      setIsEditVideoModalOpen(false);
      setEditingVideo(null);
    } else {
      toast.error(result.error || "Failed to delete video");
    }
  };

  /**
   * Handles quiz being saved
   */
  const handleQuizSaved = async (videoId: string) => {
    await loadVideos();
  };

  /**
   * Handles playing a video
   */
  const handlePlayVideo = (video: Video) => {
    logger.videoEvent("play_started", video.id, {
      title: video.title,
      adminUser: userEmail,
    });
    setSelectedVideo(video);
    setIsVideoPlayerOpen(true);
  };

  /**
   * Handles hiding a video (stored via archived_at column)
   */
  const handleHideVideo = async (video: Video) => {
    const result = await videoOperations.hide(video.id);
    if (result.success) {
      toast.success(`"${video.title}" has been hidden from the video list`);
      await loadVideos();
      await loadHiddenVideos();
    } else {
      toast.error(result.error || "Failed to hide video");
    }
  };

  /**
   * Handles showing a hidden video (clears archived_at column)
   */
  const handleShowVideo = async (video: Video) => {
    const result = await videoOperations.show(video.id);
    if (result.success) {
      toast.success(`"${video.title}" is now visible in the video list`);
      await loadVideos();
      await loadHiddenVideos();
    } else {
      toast.error(result.error || "Failed to show video");
    }
  };

  /**
   * Generates thumbnail color for video placeholders
   */
  const generateThumbnailColor = (title: string): string => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-red-500",
    ];
    const index = title.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Format due date for confirmation dialog
  const formatConfirmationDueDate = (): string => {
    if (!pendingAssignment?.contentData.dueDate) {
      return "No due date";
    }
    return formatLong(pendingAssignment.contentData.dueDate);
  };

  return (
    <div className="space-y-6">
      <VideoTable
        videos={videos}
        loading={loading}
        onEdit={handleEditVideo}
        onPlay={handlePlayVideo}
        onAddVideo={() => setIsAddVideoModalOpen(true)}
        onSettings={(video) => setSettingsVideo(video)}
      />

      {/* Hidden Videos Section */}
      {hiddenVideos.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="hidden" className="border-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 [&>svg]:hidden group">
              <div className="flex items-center gap-3 w-full">
                <ChevronDown
                  className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
                  aria-hidden="true"
                />
                <EyeOff className="w-5 h-5 text-muted-foreground" />
                <span className="text-h4 font-semibold">Hidden Trainings</span>
                <Badge variant="soft-destructive" className="ml-2">
                  {hiddenVideos.length}
                </Badge>
                <div className="ml-auto">
                  <span className="text-body-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                    Hidden videos remain functional for employees with assignments
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
                          <TableHead>TRAINING</TableHead>
                          <TableHead className="w-32 text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hiddenVideos.map((video) => (
                          <TableRow key={video.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{video.title}</div>
                                {video.description && (
                                  <div className="text-body-sm text-muted-foreground line-clamp-2 mt-1">
                                    {video.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center">
                                <IconButtonWithTooltip
                                  icon={Eye}
                                  tooltip="Show video in main list"
                                  onClick={() => setPendingShowVideo(video)}
                                  variant="ghost"
                                  className="text-muted-foreground hover:text-foreground"
                                  ariaLabel={`Show ${video.title} in video list`}
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

      {/* Add Content Modal */}
      <AddContentModal open={isAddVideoModalOpen} onOpenChange={setIsAddVideoModalOpen} onSave={handleAddVideo} />

      {/* Edit Video Modal */}
      <EditVideoModal
        open={isEditVideoModalOpen}
        onOpenChange={setIsEditVideoModalOpen}
        video={editingVideo}
        onSave={handleUpdateVideo}
        onDelete={handleDeleteVideo}
        onQuizSaved={handleQuizSaved}
      />

      {/* Video Player Modal */}
      <VideoPlayerModal open={isVideoPlayerOpen} onOpenChange={setIsVideoPlayerOpen} video={selectedVideo} />

      {/* Training Settings Modal */}
      <TrainingSettingsModal
        open={!!settingsVideo}
        onOpenChange={(open) => {
          if (!open) setSettingsVideo(null);
        }}
        video={settingsVideo}
        onHide={(video) => handleHideVideo(video)}
      />

      {/* Confirmation Dialog for Show Training */}
      <AlertDialog open={!!pendingShowVideo} onOpenChange={(open) => !open && setPendingShowVideo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Show this training?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingShowVideo?.title}" will return to the main training list and be visible to admins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingShowVideo(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingShowVideo) {
                  handleShowVideo(pendingShowVideo);
                  setPendingShowVideo(null);
                }
              }}
            >
              Show Training
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={(open) => !open && handleCancelConfirmation()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign to {pendingAssignment?.employeeCount} employees?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will create "{pendingAssignment?.contentData.title}" and assign it to all active employees.
              </span>
              <span className="block text-body-sm">
                <strong>Due date:</strong> {formatConfirmationDueDate()}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} onClick={handleCancelConfirmation}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAssignment} disabled={isSubmitting}>
              {isSubmitting ? "Adding & Assigning..." : "Add & Assign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
