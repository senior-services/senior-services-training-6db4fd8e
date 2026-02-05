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
          <p className="text-sm text-muted-foreground">
            Choose which employees to include in the export.
          </p>
        </DialogHeader>

        <div className="flex items-center justify-between py-4">
          <div className="space-y-0.5">
            <Label htmlFor={switchId} className="text-base cursor-pointer">
              Include hidden employees
            </Label>
            <p className="text-sm text-muted-foreground">
              {hiddenCount} hidden {hiddenCount === 1 ? 'employee' : 'employees'} will be added
            </p>
          </div>
          <Switch
            id={switchId}
            checked={includeHidden}
            onCheckedChange={setIncludeHidden}
            disabled={isLoading}
            aria-describedby={`${switchId}-description`}
          />
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
