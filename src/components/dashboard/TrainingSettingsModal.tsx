/**
 * TrainingSettingsModal - Settings modal for managing a training's visibility.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogScrollArea,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [stagedHidden, setStagedHidden] = useState(false);

  // Reset staged state when modal opens
  useEffect(() => {
    if (open) {
      setStagedHidden(false);
    }
  }, [open]);

  if (!video) return null;

  const hasChanges = stagedHidden;

  const handleSave = () => {
    if (stagedHidden) {
      onHide(video);
    }
    onOpenChange(false);
  };

  return (
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
            </div>

            {/* Hide training */}
            <div>
              <Label className="font-medium">Hide Training From Active List</Label>
              <p className="text-body-sm text-muted-foreground mt-1">
                Moves to the Hidden section without affecting existing assignments or progress.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Checkbox
                  id="hide-training"
                  checked={stagedHidden}
                  onCheckedChange={(checked) => setStagedHidden(checked === true)}
                  aria-label="Hide training from active list"
                />
                <Label htmlFor="hide-training" className="text-body-sm cursor-pointer">
                  Hide this training
                </Label>
              </div>
            </div>
          </div>
        </DialogScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
