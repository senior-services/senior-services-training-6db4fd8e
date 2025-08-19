import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, FileVideo } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (videoData: VideoFormData) => void;
}

export interface VideoFormData {
  title: string;
  description: string;
  type: 'file' | 'url';
  file?: File;
  url?: string;
}

export const AddVideoModal = ({ open, onOpenChange, onSave }: AddVideoModalProps) => {
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    description: '',
    type: 'url'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSave = () => {
    if (!formData.title.trim()) return;
    
    if (formData.type === 'file' && !selectedFile) return;
    if (formData.type === 'url' && !formData.url?.trim()) return;

    onSave({
      ...formData,
      file: selectedFile || undefined
    });
    
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      type: 'url'
    });
    setSelectedFile(null);
    setIsDragOver(false);
    onOpenChange(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, type: 'file' }));
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      setSelectedFile(files[0]);
      setFormData(prev => ({ ...prev, type: 'file' }));
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const isValid = formData.title.trim() && 
    ((formData.type === 'file' && selectedFile) || 
     (formData.type === 'url' && formData.url?.trim()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Training Video</DialogTitle>
          <DialogDescription>
            Upload a video file or provide a YouTube/Google Drive URL to add new training content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Source */}
          <div className="space-y-3">
            <Label>Video Source</Label>
            <Tabs 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'file' | 'url' }))}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  File Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-2 mt-4">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  value={formData.url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=... or https://drive.google.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Supports YouTube and Google Drive video links
                </p>
              </TabsContent>

              <TabsContent value="file" className="space-y-3 mt-4">
                <Label>Upload Video File</Label>
                
                {/* Drag & Drop Area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragOver
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex flex-col items-center space-y-4">
                    <FileVideo className={cn(
                      "w-12 h-12 transition-colors",
                      isDragOver ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {isDragOver ? "Drop video file here" : "Drag & drop video file here"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or click to browse files
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="fileInput"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('fileInput')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Browse Files
                    </Button>
                  </div>
                </div>

                {selectedFile && (
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <FileVideo className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Video Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter video title..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter video description..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};