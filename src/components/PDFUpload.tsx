import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, Plus, Files } from 'lucide-react';

interface PDFUploadProps {
  onFileUpload: (files: File[]) => void;
  onNext: () => void;
  uploadedFiles?: File[];
}

export const PDFUpload: React.FC<PDFUploadProps> = ({
  onFileUpload,
  onNext,
  uploadedFiles = [],
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<File[]>(uploadedFiles);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length > 0) {
      const updatedFiles = [...currentFiles, ...pdfFiles];
      setCurrentFiles(updatedFiles);
      onFileUpload(updatedFiles);
    }
  }, [onFileUpload, currentFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
      if (pdfFiles.length > 0) {
        const updatedFiles = [...currentFiles, ...pdfFiles];
        setCurrentFiles(updatedFiles);
        onFileUpload(updatedFiles);
      }
    }
  }, [onFileUpload, currentFiles]);

  const removeFile = (index: number) => {
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    setCurrentFiles(updatedFiles);
    onFileUpload(updatedFiles);
  };

  const clearAllFiles = () => {
    setCurrentFiles([]);
    onFileUpload([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload P&ID PDF</CardTitle>
        <CardDescription>
          Upload your P&ID diagram in PDF format. The file will be converted to images for data extraction.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center space-y-4">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Drop your PDF files here</h3>
              <p className="text-sm text-muted-foreground">
                or click to browse files (multiple files supported)
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInput}
              className="hidden"
              id="pdf-upload"
              multiple
            />
            <Button variant="outline" asChild>
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Add PDF Files
              </label>
            </Button>
          </div>
        </div>

        {/* Files List */}
        {currentFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Files className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">
                  {currentFiles.length} PDF file{currentFiles.length !== 1 ? 's' : ''} selected
                </h3>
              </div>
              <Button variant="outline" size="sm" onClick={clearAllFiles}>
                Clear All
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-primary" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium truncate">{file.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • PDF Document
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">File Requirements:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• PDF format only</li>
            <li>• Maximum file size: 50MB per file</li>
            <li>• Multiple PDF files supported</li>
            <li>• Multiple pages per PDF supported</li>
            <li>• Clear, high-resolution diagrams work best</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {currentFiles.length > 0
              ? `${currentFiles.length} file${currentFiles.length !== 1 ? 's' : ''} ready for processing`
              : 'No files selected'
            }
          </div>
          <Button
            onClick={onNext}
            disabled={currentFiles.length === 0}
            className="min-w-24"
          >
            Process PDFs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};