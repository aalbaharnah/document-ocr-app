import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { PDFPageImage } from '@/utils/pdfProcessor';

import { ExtractionTemplate } from './ExtractionTemplate';

interface BatchProcessingDisplayProps {
    allImages: PDFPageImage[];
    selectedTemplate: ExtractionTemplate;
    onStartExtraction: (template: ExtractionTemplate, images: PDFPageImage[]) => void;
    onBack: () => void;
}

export const BatchProcessingDisplay: React.FC<BatchProcessingDisplayProps> = ({
    allImages,
    selectedTemplate,
    onStartExtraction,
    onBack,
}) => {
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    const [previewMode, setPreviewMode] = useState<'template' | 'images'>('template');

    // Group images by file using the actual file names
    const imagesByFile = allImages.reduce((acc, image) => {
        const fileName = image.fileName || `Document_${(image.fileIndex || 0) + 1}`;

        if (!acc[fileName]) {
            acc[fileName] = [];
        }
        acc[fileName].push(image);
        return acc;
    }, {} as Record<string, PDFPageImage[]>); const fileNames = Object.keys(imagesByFile);
    const totalFiles = fileNames.length;
    const totalPages = allImages.length;

    const renderTemplatePreview = () => {
        if (!selectedTemplate.selections.length) return null;

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Template Preview</h3>
                <div className="bg-muted/50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {selectedTemplate.selections.map((selection, index) => (
                            <div
                                key={selection.id}
                                className="p-3 bg-background rounded-lg border"
                                style={{
                                    borderColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
                                    borderWidth: '2px',
                                }}
                            >
                                <div className="text-sm">
                                    <div className="font-medium">{selection.fieldName}</div>
                                    <div className="text-muted-foreground text-xs">
                                        {selection.type} • {Math.round(selection.width)}×{Math.round(selection.height)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderImagePreview = () => {
        const currentImage = allImages[currentPreviewIndex];
        if (!currentImage) return null;

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Image Preview</h3>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPreviewIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentPreviewIndex === 0}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                            {currentPreviewIndex + 1} of {allImages.length}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPreviewIndex(prev => Math.min(allImages.length - 1, prev + 1))}
                            disabled={currentPreviewIndex === allImages.length - 1}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="border rounded-lg overflow-hidden bg-gray-50 max-h-96">
                    <img
                        src={currentImage.imageUrl}
                        alt={`Page ${currentImage.pageNumber}`}
                        className="w-full h-auto object-contain"
                        style={{ maxHeight: '400px' }}
                    />
                </div>

                <div className="text-sm text-muted-foreground text-center">
                    Page {currentImage.pageNumber} • {currentImage.width}×{currentImage.height}
                </div>
            </div>
        );
    };

    const renderFileList = () => {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Files to Process</h3>
                <div className="space-y-2">
                    {fileNames.map((fileName, index) => {
                        const fileImages = imagesByFile[fileName];
                        return (
                            <div key={fileName} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <div>
                                        <div className="font-medium">{fileName}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {fileImages.length} page{fileImages.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Pages {fileImages[0]?.pageNumber} - {fileImages[fileImages.length - 1]?.pageNumber}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <Card className="w-full max-w-6xl mx-auto">
            <CardHeader>
                <CardTitle>Batch Processing Preview</CardTitle>
                <CardDescription>
                    Review the template and files before starting batch extraction. The template will be applied to all pages.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Template Info */}
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div>
                        <h3 className="font-medium">{selectedTemplate.name}</h3>
                        {selectedTemplate.description && (
                            <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                        )}
                        <div className="text-sm text-muted-foreground">
                            {selectedTemplate.selections.length} extraction area{selectedTemplate.selections.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-medium">{totalFiles} file{totalFiles !== 1 ? 's' : ''}</div>
                        <div className="text-sm text-muted-foreground">{totalPages} page{totalPages !== 1 ? 's' : ''} total</div>
                    </div>
                </div>

                {/* Preview Mode Toggle */}
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Button
                        variant={previewMode === 'template' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('template')}
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        Template
                    </Button>
                    <Button
                        variant={previewMode === 'images' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('images')}
                    >
                        <FileText className="h-4 w-4 mr-1" />
                        Images
                    </Button>
                </div>

                {/* Preview Content */}
                {previewMode === 'template' && renderTemplatePreview()}
                {previewMode === 'images' && renderImagePreview()}

                {/* File List */}
                {renderFileList()}

                {/* Processing Summary */}
                <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Processing Summary:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Template "{selectedTemplate.name}" will be applied to all {totalPages} pages</li>
                        <li>• {selectedTemplate.selections.length} fields will be extracted from each page</li>
                        <li>• Total extractions: {totalPages * selectedTemplate.selections.length}</li>
                        <li>• Results will be compiled into a single dataset</li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" onClick={onBack}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back to Template
                    </Button>
                    <Button
                        onClick={() => onStartExtraction(selectedTemplate, allImages)}
                        className="min-w-32"
                    >
                        <Play className="h-4 w-4 mr-2" />
                        Start Extraction
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};