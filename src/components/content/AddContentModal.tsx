import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogScrollArea, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, FileVideo, Presentation } from 'lucide-react';
import { CONTENT_CONFIG } from '@/constants';
import { detectContentTypeFromFile, detectContentTypeFromUrl } from '@/utils/videoUtils';
import { ContentType } from '@/types';

interface AddContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ContentFormData) => void;
}

export interface ContentFormData {
  title: string;
  description: string;
  type: 'file' | 'url';
  content_type: ContentType;
  file?: File;
  url?: string;
}

export const AddContentModal: React.FC<AddContentModalProps> = ({
  open,
  onOpenChange,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [contentType, setContentType] = useState<ContentType>('video');
  const [dragActive, setDragActive] = useState(false);
  const [showManualSelector, setShowManualSelector] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const detectedType = detectContentTypeFromFile(file);
      if (detectedType) {
        setSelectedFile(file);
        setContentType(detectedType);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    }
  }, [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const detectedType = detectContentTypeFromFile(file);
      if (detectedType) {
        setSelectedFile(file);
        setContentType(detectedType);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value.trim();
    setUrl(newUrl);
    
    if (newUrl) {
      // Validate URL format
      try {
        new URL(newUrl);
      } catch {
        setShowManualSelector(false);
        return;
      }
      
      const detectedType = detectContentTypeFromUrl(newUrl);
      if (detectedType) {
        setContentType(detectedType);
        setShowManualSelector(false);
      } else {
        // Ambiguous URL - show manual selector
        setShowManualSelector(true);
      }
    } else {
      setShowManualSelector(false);
    }
  };

  const handleSave = () => {
    const formData: ContentFormData = {
      title,
      description,
      type: url.trim() ? 'url' : 'file',
      content_type: contentType,
    };

    if (selectedFile) {
      formData.file = selectedFile;
    }
    
    if (url.trim()) {
      formData.url = url;
    }

    onSave(formData);
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setUrl('');
    setContentType('video');
    setDragActive(false);
    setShowManualSelector(false);
    onOpenChange(false);
  };

  const isValid = title.trim() && (url.trim() || selectedFile);

  const getSupportedFormats = () => {
    if (contentType === 'presentation') {
      return CONTENT_CONFIG.PRESENTATION.SUPPORTED_FORMATS.join(', ');
    }
    return CONTENT_CONFIG.VIDEO.SUPPORTED_FORMATS.join(', ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Training Content</DialogTitle>
        </DialogHeader>

        <DialogScrollArea className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter content title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter content description"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="Enter YouTube, Google Drive, or Google Slides URL"
              />
              {url && !showManualSelector && (
                <p className="text-sm text-muted-foreground mt-1">
                  ✓ Auto-detected: {contentType === 'presentation' ? 'Presentation' : 'Video'}
                </p>
              )}
            </div>

            {showManualSelector && (
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="manual-content-type">
                  Content Type
                  <span className="text-xs text-muted-foreground block mt-1">
                    Unable to detect content type automatically. Please select:
                  </span>
                </Label>
                <RadioGroup
                  id="manual-content-type"
                  value={contentType}
                  onValueChange={(value) => setContentType(value as ContentType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="video" id="type-video" />
                    <Label htmlFor="type-video" className="cursor-pointer font-normal">
                      Video
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="presentation" id="type-presentation" />
                    <Label htmlFor="type-presentation" className="cursor-pointer font-normal">
                      Presentation
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all duration-300 ${
                dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !selectedFile && document.getElementById('file-upload')?.click()}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !selectedFile) {
                  e.preventDefault();
                  document.getElementById('file-upload')?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Upload file area. Drag and drop a file or click to browse"
            >
              {selectedFile ? (
                <div className="flex items-center space-x-4">
                  {contentType === 'presentation' ? (
                    <Presentation className="h-8 w-8 text-primary flex-shrink-0" />
                  ) : (
                    <FileVideo className="h-8 w-8 text-primary flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {contentType === 'presentation' ? 'Presentation' : 'Video'} • {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="flex-shrink-0"
                    aria-label="Remove selected file"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  {contentType === 'presentation' ? (
                    <Presentation className={`h-8 w-8 flex-shrink-0 transition-colors ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  ) : (
                    <FileVideo className={`h-8 w-8 flex-shrink-0 transition-colors ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {dragActive ? 'Drop file here' : 'Drag & drop file here'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      or click to browse files
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    accept={[...CONTENT_CONFIG.VIDEO.MIME_TYPES, ...CONTENT_CONFIG.PRESENTATION.MIME_TYPES].join(',')}
                    onChange={handleFileChange}
                    aria-label="File upload input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById('file-upload')?.click();
                    }}
                    className="flex-shrink-0"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Browse Files
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Add Content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};