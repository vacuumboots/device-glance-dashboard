import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileInput, Upload } from 'lucide-react';

interface FileUploadProps {
  onFilesLoaded: (files: FileList) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFilesLoaded(files);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      onFilesLoaded(files);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileInput className="w-5 h-5" />
          Load Inventory Data
        </CardTitle>
        <CardDescription>
          Upload one or more JSON inventory files to analyze your Windows device data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Drop JSON files here or click to browse</p>
          <p className="text-sm text-muted-foreground mt-2">
            Supports multiple files. Each file should contain device inventory data.
          </p>
          <Button className="mt-4" variant="outline">
            Select Files
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};
