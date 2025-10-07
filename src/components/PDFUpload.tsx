import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X } from 'lucide-react';

interface PDFUploadProps {
  onFileUpload: (file: File) => void;
  onNext: () => void;
  uploadedFile?: File | null;
}

export const PDFUpload: React.FC<PDFUploadProps> = ({
  onFileUpload,
  onNext,
  uploadedFile,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(uploadedFile || null);

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
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      setCurrentFile(pdfFile);
      onFileUpload(pdfFile);
    }
  }, [onFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setCurrentFile(file);
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const removeFile = () => {
    setCurrentFile(null);
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
        {!currentFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
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
                <h3 className="text-lg font-medium">Drop your PDF here</h3>
                <p className="text-sm text-muted-foreground">
                  or click to browse files
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileInput}
                className="hidden"
                id="pdf-upload"
              />
              <Button variant="outline" asChild>
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-medium">{currentFile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(currentFile.size)} • PDF Document
                  </p>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={removeFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">File Requirements:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• PDF format only</li>
            <li>• Maximum file size: 50MB</li>
            <li>• Clear, high-resolution diagrams work best</li>
            <li>• Multiple pages are supported</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {currentFile ? 'File ready for processing' : 'No file selected'}
          </div>
          <Button 
            onClick={onNext}
            disabled={!currentFile}
            className="min-w-24"
          >
            Process PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};