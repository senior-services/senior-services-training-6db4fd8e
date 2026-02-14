/**
 * TrainingSettingsModal - Settings modal for managing a training's visibility.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogScrollArea,
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
import { EyeOff } from 'lucide-react';
import type { Video } from '@/types';

interface TrainingSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video | null;
  onHide: (video: Video) => void;
}

export const TrainingSettingsModal: React.FC<TrainingSettingsModalProps> = ({
  open,
  onOpenChange,
  video,
  onHide,
}) => {
  const [showHideConfirm, setShowHideConfirm] = useState(false);

  if (!video) return null;

  const handleHideConfirmed = () => {
    setShowHideConfirm(false);
    onOpenChange(false);
    onHide(video);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Training Settings</DialogTitle>
          </DialogHeader>

          <DialogScrollArea>
            <div className="space-y-6">
              {/* Training info */}
              <div>
                <p className="font-medium">{video.title}</p>
                {video.description && (
                  <p className="text-body-sm text-muted-foreground mt-1 line-clamp-2">{video.description}</p>
                )}
              </div>

              {/* Hide training */}
              <div>
                <Button
                  variant="outline"
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                  onClick={() => setShowHideConfirm(true)}
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Training
                </Button>
                <p className="text-body-sm text-muted-foreground mt-2">
                  Moves to the Hidden section without affecting existing assignments or progress.
                </p>
              </div>
            </div>
          </DialogScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hide Confirmation */}
      <AlertDialog open={showHideConfirm} onOpenChange={setShowHideConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide this training?</AlertDialogTitle>
            <AlertDialogDescription>
              "{video.title}" will move to the Hidden section. It will remain active for existing assignments and can be unhidden at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleHideConfirmed}>
              Hide Training
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
