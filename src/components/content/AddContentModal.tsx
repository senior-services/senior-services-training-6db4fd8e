import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogScrollArea, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, FileVideo, Presentation, Link } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
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
      type: activeTab,
      content_type: contentType,
    };

    if (activeTab === 'file' && selectedFile) {
      formData.file = selectedFile;
    } else if (activeTab === 'url') {
      formData.url = url;
    }

    onSave(formData);
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setActiveTab('file');
    setSelectedFile(null);
    setUrl('');
    setContentType('video');
    setDragActive(false);
    setShowManualSelector(false);
    onOpenChange(false);
  };

  const isValid = title.trim() && ((activeTab === 'file' && selectedFile) || (activeTab === 'url' && url.trim()));

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

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'file' | 'url')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                URL Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    {contentType === 'presentation' ? (
                      <Presentation className="h-8 w-8 text-primary" />
                    ) : (
                      <FileVideo className="h-8 w-8 text-primary" />
                    )}
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {contentType === 'presentation' ? 'Presentation' : 'Video'} • {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p>Drag and drop a file here, or click to select</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supported: {getSupportedFormats()}
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  id="file-upload"
                  accept={[...CONTENT_CONFIG.VIDEO.MIME_TYPES, ...CONTENT_CONFIG.PRESENTATION.MIME_TYPES].join(',')}
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Choose File
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
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
            </TabsContent>
          </Tabs>
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