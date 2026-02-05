import React, { useState, useId } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';

interface DownloadDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (includeHidden: boolean) => void;
  hiddenCount: number;
  isLoading: boolean;
}

export const DownloadDataModal: React.FC<DownloadDataModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  hiddenCount,
  isLoading,
}) => {
  const [includeHidden, setIncludeHidden] = useState(false);
  const switchId = useId();

  const handleConfirm = () => {
    onConfirm(includeHidden);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setIncludeHidden(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Employee Data</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 py-4">
          <Switch
            id={switchId}
            checked={includeHidden}
            onCheckedChange={setIncludeHidden}
            disabled={isLoading}
          />
          <Label htmlFor={switchId} className="text-base cursor-pointer">
            Include hidden employees ({hiddenCount})
          </Label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              'Downloading...'
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
