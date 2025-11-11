import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileInput, Upload } from 'lucide-react';

interface FileUploadProps {
  onFilesLoaded: (files: FileList, opts?: { signal?: AbortSignal; onProgress?: (p: { current: number; total: number; fileName?: string }) => void }) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; fileName?: string } | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const beginParse = (files: FileList) => {
    const controller = new AbortController();
    setAbortController(controller);
    setIsParsing(true);
    setProgress({ current: 0, total: files.length });
    onFilesLoaded(files, {
      signal: controller.signal,
      onProgress: (p) => setProgress(p),
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      beginParse(files);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      beginParse(files as FileList);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileInput className="w-5 h-5" />
          Upload Device Inventory Files
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
          <p className="text-lg font-medium">Drag and drop JSON files here</p>
          <p className="text-sm text-muted-foreground mt-2">
            Supports multiple files. Each file should contain device inventory data.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
            tabIndex={-1}
          />
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              className=""
              variant="outline"
              data-testid="file-upload-button"
              disabled={isParsing}
            >
              {isParsing ? 'Parsing…' : 'Browse Files'}
            </Button>
            {isParsing && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  abortController?.abort();
                  setIsParsing(false);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
          {progress && (
            <p className="text-xs text-muted-foreground mt-3" data-testid="parse-progress">
              Parsing {progress.current}/{progress.total}
              {progress.fileName ? `: ${progress.fileName}` : ''}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
