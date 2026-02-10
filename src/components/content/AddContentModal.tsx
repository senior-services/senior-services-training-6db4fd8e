import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogScrollArea,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { detectContentTypeFromUrl } from "@/utils/videoUtils";
import { validateUrl, validateAndSanitize } from "@/utils/validation";
import { ContentType } from "@/types";
import { DueDateSelector, calculateDueDate, type DueDateOption } from "@/components/shared/DueDateSelector";
import { cn } from "@/lib/utils";

interface AddContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ContentFormData) => void;
}

export interface ContentFormData {
  title: string;
  description: string;
  content_type: ContentType;
  url: string;
  assignToAll?: boolean;
  dueDate?: Date;
}

export const AddContentModal: React.FC<AddContentModalProps> = ({ open, onOpenChange, onSave }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [contentType, setContentType] = useState<ContentType>("video");
  
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string>("");
  const [titleError, setTitleError] = useState<string>("");

  // Assign to all employees state
  const [assignToAll, setAssignToAll] = useState(false);
  const [dueDateOption, setDueDateOption] = useState<DueDateOption>("1week");
  const [noDueDateRequired, setNoDueDateRequired] = useState(false);

  // Reset all form state when dialog opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setUrl("");
      setContentType("video");
      setIsValidatingUrl(false);
      setUrlError("");
      setTitleError("");
      setAssignToAll(false);
      setDueDateOption("1week");
      setNoDueDateRequired(false);
    }
  }, [open]);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value.trim();
    setUrl(newUrl);
    setUrlError("");

    if (!newUrl) {
      return;
    }

    setIsValidatingUrl(true);

    // Validate URL format and security
    const validation = validateUrl(newUrl);
    if (!validation.isValid) {
      setUrlError(validation.errors[0] || "Invalid URL format");
      
      setIsValidatingUrl(false);
      return;
    }

    // Additional HTTPS check
    try {
      const urlObj = new URL(newUrl);
      if (urlObj.protocol !== "https:") {
        setUrlError("Only HTTPS URLs are allowed for security");
      setIsValidatingUrl(false);
      return;
    }
  } catch {
    setUrlError("Invalid URL format");
    setIsValidatingUrl(false);
      return;
    }

    // Auto-detect content type
    const detectedType = detectContentTypeFromUrl(newUrl);
    if (detectedType) {
      setContentType(detectedType);
    }

    setIsValidatingUrl(false);
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setTitleError("");

    // Real-time validation
    if (newTitle.trim()) {
      const validation = validateAndSanitize(newTitle, {
        required: true,
        maxLength: 200,
        allowHtml: false,
      });
      if (!validation.isValid) {
        setTitleError(validation.errors[0] || "Invalid title");
      }
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
  };

  const handleAssignToAllChange = (checked: boolean) => {
    setAssignToAll(checked);
    if (!checked) {
      // Reset due date options when unchecked
      setDueDateOption("1week");
      setNoDueDateRequired(false);
    }
  };

  const handleDueDateChange = (option: DueDateOption, noDueDate: boolean) => {
    setDueDateOption(option);
    setNoDueDateRequired(noDueDate);
  };

  const handleSave = () => {
    // Final validation before save
    const titleValidation = validateAndSanitize(title, {
      required: true,
      maxLength: 200,
      allowHtml: false,
    });

    const urlValidation = validateUrl(url);

    const descValidation = validateAndSanitize(description, {
      required: false,
      maxLength: 1000,
      allowHtml: false,
    });

    if (!titleValidation.isValid) {
      setTitleError(titleValidation.errors[0] || "Invalid title");
      return;
    }

    if (!urlValidation.isValid) {
      setUrlError(urlValidation.errors[0] || "Invalid URL");
      return;
    }

    const formData: ContentFormData = {
      title: titleValidation.sanitized,
      description: descValidation.sanitized,
      content_type: contentType,
      url: url.trim(),
      // TODO: Re-enable when "Assign to All" feature is restored in the UI
      assignToAll: false,
      dueDate: undefined,
    };

    onSave(formData);
    // Parent controls when to close the modal (preserves form data during confirmation dialogs)
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setUrl("");
    setContentType("video");
    setIsValidatingUrl(false);
    setUrlError("");
    setTitleError("");
    setAssignToAll(false);
    setDueDateOption("1week");
    setNoDueDateRequired(false);
    onOpenChange(false);
  };

  const isValid = title.trim() && url.trim() && !urlError && !titleError && !isValidatingUrl;

  const getUrlStatusIcon = () => {
    if (isValidatingUrl) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (urlError) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (url && !urlError) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Training</DialogTitle>
        </DialogHeader>

        <DialogScrollArea className="space-y-4">
          <div>
            <Label htmlFor="title">Training Title</Label>
            <Input
              id="title"
              value={title}
              onChange={handleTitleChange}
              placeholder="Enter content title"
              aria-invalid={!!titleError}
              aria-describedby={titleError ? "title-error" : undefined}
            />
            {titleError && (
              <p id="title-error" className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
                {titleError}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">
              Description <span className="font-normal italic text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Enter content description (optional)"
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">{description.length}/1000 characters</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="url">Video or Presentation URL</Label>
              <div className="relative">
                <Input
                  id="url"
                  value={url}
                  onChange={handleUrlChange}
                  placeholder="Enter YouTube, Google Drive, or Google Slides URL"
                  aria-invalid={!!urlError}
                  aria-describedby={urlError ? "url-error" : url && !urlError ? "url-success" : undefined}
                  className={urlError ? "pr-10 border-destructive" : url ? "pr-10" : ""}
                />
                {getUrlStatusIcon() && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">{getUrlStatusIcon()}</div>
                )}
              </div>
              {urlError && (
                <p
                  id="url-error"
                  className="text-sm text-destructive mt-1 flex items-start gap-1"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{urlError}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Only HTTPS URLs are supported for security</p>
            </div>
          </div>

          {/* TODO: Re-enable "Assign to All Employees" feature when ready.
              The state (assignToAll, dueDateOption, noDueDateRequired) and handlers
              (handleAssignToAllChange, handleDueDateChange) are preserved above.
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="assign-to-all"
                checked={assignToAll}
                onCheckedChange={handleAssignToAllChange}
              />
              <Label 
                htmlFor="assign-to-all" 
                className="text-sm font-medium cursor-pointer"
              >
                Assign this training to all active employees
              </Label>
            </div>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200 ease-in-out",
                assignToAll ? "max-h-48 opacity-100 mt-3" : "max-h-0 opacity-0"
              )}
              aria-live="polite"
            >
              <div className="pl-7 border-l-2 border-muted ml-1.5">
                <DueDateSelector
                  dueDateOption={dueDateOption}
                  noDueDateRequired={noDueDateRequired}
                  onSelectionChange={handleDueDateChange}
                  showLabel={true}
                />
              </div>
            </div>
          </div>
          */}
        </DialogScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Add Training
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
