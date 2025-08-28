import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, FileVideo, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
interface AddVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (videoData: VideoFormData) => Promise<void>;
}
export interface VideoFormData {
  title: string;
  description: string;
  type: 'file' | 'url';
  file?: File;
  url?: string;
}
export const AddVideoModal = ({
  open,
  onOpenChange,
  onSave
}: AddVideoModalProps) => {
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    description: '',
    type: 'file'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const handleSave = async () => {
    if (formData.type === 'file' && !selectedFile) return;
    if (formData.type === 'url' && !formData.url?.trim()) return;
    await onSave({
      ...formData,
      file: selectedFile || undefined
    });
    handleClose();
  };
  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      type: 'file'
    });
    setSelectedFile(null);
    setIsDragOver(false);
    onOpenChange(false);
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        type: 'file'
      }));
    }
  };
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      setSelectedFile(files[0]);
      setFormData(prev => ({
        ...prev,
        type: 'file'
      }));
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
  const isValid = formData.title.trim() && formData.description.trim() && (formData.type === 'file' && selectedFile || formData.type === 'url' && formData.url?.trim());
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Training Video</DialogTitle>
          <DialogDescription>
            Upload a video file or provide a YouTube/Google Drive URL to add new training content.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 p-1">
          {/* Video Source */}
          <div className="space-y-2">
            <Label>Video Source</Label>
            <Tabs value={formData.type} onValueChange={value => setFormData(prev => ({
            ...prev,
            type: value as 'file' | 'url'
          }))}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  File Upload
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-2 mt-3">
                <Label>Upload Video File</Label>
                
                {/* Drag & Drop Area - only show when no file selected */}
                {!selectedFile && <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} className={cn("border-2 border-dashed rounded-lg p-3 cursor-pointer transition-all duration-300", isDragOver ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50")}>
                    <div className="flex items-center space-x-4">
                      <FileVideo className={cn("w-6 h-6 flex-shrink-0 transition-colors", isDragOver ? "text-primary" : "text-muted-foreground")} />
                      
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {isDragOver ? "Drop video file here" : "Drag & drop video file here"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          or click to browse files
                        </p>
                      </div>
                      
                      <Input type="file" accept="video/*" onChange={handleFileChange} className="hidden" id="fileInput" />
                      
                      <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('fileInput')?.click()} className="flex-shrink-0">
                        <Upload className="w-4 h-4 mr-2" />
                        Browse Files
                      </Button>
                    </div>
                  </div>}

                {/* Success message - only show when file selected */}
                {selectedFile && <div className="border-2 border-dashed border-success rounded-lg p-3 bg-success/10">
                    <div className="flex items-center space-x-4">
                      <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-success">
                          Video uploaded successfully!
                        </p>
                      </div>
                    </div>
                  </div>}

                {/* File details - only show when file selected */}
                {selectedFile && <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-success/10 rounded-lg">
                        <FileVideo className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>}
              </TabsContent>

              <TabsContent value="url" className="space-y-2 mt-4">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input id="videoUrl" value={formData.url || ''} onChange={e => setFormData(prev => ({
                ...prev,
                url: e.target.value
              }))} placeholder="https://youtube.com/watch?v=... or https://drive.google.com/..." />
                <p className="text-xs text-muted-foreground">Supports YouTube or Google Drive URL. For Drive, change General access to Anyone with the link and set permission to Viewer (not Restricted).</p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Video Title</Label>
            <Input id="title" value={formData.title} onChange={e => setFormData(prev => ({
            ...prev,
            title: e.target.value
          }))} placeholder="Enter video title..." required />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description
          </Label>
            <Textarea id="description" value={formData.description} onChange={e => setFormData(prev => ({
            ...prev,
            description: e.target.value
          }))} placeholder="Enter video description..." rows={3} required />
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};