import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Square, Circle, Save, Download, Upload, Trash2 } from 'lucide-react';
import { PDFPageImage } from '@/utils/pdfProcessor';
import { SelectionArea } from './ImageDisplay';

export interface ExtractionTemplate {
    id: string;
    name: string;
    description?: string;
    selections: Omit<SelectionArea, 'pageNumber'>[];
    createdAt: Date;
    updatedAt: Date;
}

interface ExtractionTemplateProps {
    templateImage?: PDFPageImage;
    dataFields: Array<{ id: string; name: string; description?: string }>;
    onTemplateCreate: (template: ExtractionTemplate) => void;
    onTemplateSelect: (template: ExtractionTemplate) => void;
    existingTemplates?: ExtractionTemplate[];
}

export const ExtractionTemplateEditor: React.FC<ExtractionTemplateProps> = ({
    templateImage,
    dataFields,
    onTemplateCreate,
    onTemplateSelect,
    existingTemplates = [],
}) => {
    const [mode, setMode] = useState<'create' | 'select'>('select');
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [zoom, setZoom] = useState(1);
    const [selections, setSelections] = useState<Omit<SelectionArea, 'pageNumber'>[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingTool, setDrawingTool] = useState<'rectangle' | 'circle'>('rectangle');
    const [currentSelection, setCurrentSelection] = useState<Partial<SelectionArea> | null>(null);
    const [selectedFieldIndex, setSelectedFieldIndex] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Draw template image and selections on canvas
    useEffect(() => {
        if (!canvasRef.current || !templateImage) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            // Set canvas size
            canvas.width = templateImage.width * zoom;
            canvas.height = templateImage.height * zoom;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Draw selections
            selections.forEach((selection, index) => {
                ctx.strokeStyle = `hsl(${(index * 60) % 360}, 70%, 50%)`;
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);

                if (selection.type === 'rectangle') {
                    ctx.strokeRect(
                        selection.x * zoom,
                        selection.y * zoom,
                        selection.width * zoom,
                        selection.height * zoom
                    );
                } else {
                    ctx.beginPath();
                    const centerX = (selection.x + selection.width / 2) * zoom;
                    const centerY = (selection.y + selection.height / 2) * zoom;
                    const radius = Math.min(selection.width, selection.height) / 2 * zoom;
                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                }

                // Draw label
                ctx.fillStyle = `hsl(${(index * 60) % 360}, 70%, 50%)`;
                ctx.font = '12px sans-serif';
                ctx.fillText(
                    selection.fieldName || `Field ${index + 1}`,
                    selection.x * zoom,
                    selection.y * zoom - 5
                );
            });

            // Draw current selection being drawn
            if (currentSelection && isDrawing) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.setLineDash([2, 2]);

                if (drawingTool === 'rectangle') {
                    ctx.strokeRect(
                        currentSelection.x! * zoom,
                        currentSelection.y! * zoom,
                        currentSelection.width! * zoom,
                        currentSelection.height! * zoom
                    );
                } else {
                    ctx.beginPath();
                    const centerX = (currentSelection.x! + currentSelection.width! / 2) * zoom;
                    const centerY = (currentSelection.y! + currentSelection.height! / 2) * zoom;
                    const radius = Math.min(currentSelection.width!, currentSelection.height!) / 2 * zoom;
                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                }
            }
        };
        img.src = templateImage.imageUrl;
    }, [templateImage, zoom, selections, currentSelection, isDrawing, drawingTool]);

    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / zoom,
            y: (e.clientY - rect.top) / zoom,
        };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (mode !== 'create') return;

        const coords = getCanvasCoordinates(e);
        setIsDrawing(true);
        setCurrentSelection({
            x: coords.x,
            y: coords.y,
            width: 0,
            height: 0,
            type: drawingTool,
        });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !currentSelection || mode !== 'create') return;

        const coords = getCanvasCoordinates(e);
        setCurrentSelection(prev => ({
            ...prev!,
            width: coords.x - prev!.x!,
            height: coords.y - prev!.y!,
        }));
    };

    const handleMouseUp = () => {
        if (!isDrawing || !currentSelection || mode !== 'create') return;

        if (Math.abs(currentSelection.width!) > 10 && Math.abs(currentSelection.height!) > 10) {
            const newSelection: Omit<SelectionArea, 'pageNumber'> = {
                id: Date.now().toString(),
                x: Math.min(currentSelection.x!, currentSelection.x! + currentSelection.width!),
                y: Math.min(currentSelection.y!, currentSelection.y! + currentSelection.height!),
                width: Math.abs(currentSelection.width!),
                height: Math.abs(currentSelection.height!),
                type: currentSelection.type!,
                fieldName: dataFields[selectedFieldIndex]?.name || `Field ${selections.length + 1}`,
            };

            setSelections(prev => [...prev, newSelection]);

            // Move to next field if available
            if (selectedFieldIndex < dataFields.length - 1) {
                setSelectedFieldIndex(selectedFieldIndex + 1);
            }
        }

        setIsDrawing(false);
        setCurrentSelection(null);
    };

    const removeSelection = (id: string) => {
        setSelections(prev => prev.filter(s => s.id !== id));
    };

    const clearSelections = () => {
        setSelections([]);
        setSelectedFieldIndex(0);
    };

    const handleSaveTemplate = () => {
        if (!templateName.trim() || selections.length === 0) return;

        const template: ExtractionTemplate = {
            id: Date.now().toString(),
            name: templateName.trim(),
            description: templateDescription.trim() || undefined,
            selections,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        onTemplateCreate(template);

        // Reset form
        setTemplateName('');
        setTemplateDescription('');
        setSelections([]);
        setSelectedFieldIndex(0);
        setMode('select');
    };

    const handleExportTemplate = (template: ExtractionTemplate) => {
        const dataStr = JSON.stringify(template, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}_template.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const template = JSON.parse(event.target?.result as string) as ExtractionTemplate;
                onTemplateSelect(template);
            } catch (error) {
                alert('Invalid template file format');
            }
        };
        reader.readAsText(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
    const handleResetZoom = () => setZoom(1);

    return (
        <Card className="w-full max-w-6xl mx-auto">
            <CardHeader>
                <CardTitle>Extraction Template</CardTitle>
                <CardDescription>
                    Create or select a template to define extraction areas that will be applied to all documents.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Mode Selection */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <Button
                        variant={mode === 'select' ? 'default' : 'outline'}
                        onClick={() => setMode('select')}
                    >
                        Select Template
                    </Button>
                    <Button
                        variant={mode === 'create' ? 'default' : 'outline'}
                        onClick={() => setMode('create')}
                        disabled={!templateImage}
                    >
                        Create Template
                    </Button>

                    <div className="ml-auto flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleImportTemplate}
                            className="hidden"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-4 w-4 mr-1" />
                            Import
                        </Button>
                    </div>
                </div>

                {mode === 'select' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Existing Templates</h3>
                        {existingTemplates.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <div className="space-y-2">
                                    <div className="text-lg">No templates created yet</div>
                                    <div className="text-sm">Create a template to define extraction areas</div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {existingTemplates.map((template) => (
                                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium">{template.name}</h4>
                                                {template.description && (
                                                    <p className="text-sm text-muted-foreground">{template.description}</p>
                                                )}
                                                <div className="text-xs text-muted-foreground">
                                                    {template.selections.length} selection{template.selections.length !== 1 ? 's' : ''}
                                                </div>
                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onTemplateSelect(template)}
                                                    >
                                                        Use Template
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleExportTemplate(template)}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {mode === 'create' && templateImage && (
                    <div className="space-y-4">
                        {/* Template Form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                                <label className="text-sm font-medium">Template Name</label>
                                <input
                                    type="text"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-md"
                                    placeholder="Enter template name"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description (Optional)</label>
                                <input
                                    type="text"
                                    value={templateDescription}
                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-md"
                                    placeholder="Enter description"
                                />
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={drawingTool === 'rectangle' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDrawingTool('rectangle')}
                                >
                                    <Square className="h-4 w-4 mr-1" />
                                    Rectangle
                                </Button>
                                <Button
                                    variant={drawingTool === 'circle' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDrawingTool('circle')}
                                >
                                    <Circle className="h-4 w-4 mr-1" />
                                    Circle
                                </Button>
                            </div>

                            <div className="h-4 w-px bg-border" />

                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium w-16 text-center">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleResetZoom}>
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="h-4 w-px bg-border" />

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Current Field:</span>
                                <select
                                    value={selectedFieldIndex}
                                    onChange={(e) => setSelectedFieldIndex(Number(e.target.value))}
                                    className="text-sm border rounded px-2 py-1"
                                >
                                    {dataFields.map((field, index) => (
                                        <option key={field.id} value={index}>
                                            {field.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="ml-auto flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearSelections}
                                    disabled={selections.length === 0}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Clear All
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSaveTemplate}
                                    disabled={!templateName.trim() || selections.length === 0}
                                >
                                    <Save className="h-4 w-4 mr-1" />
                                    Save Template
                                </Button>
                            </div>
                        </div>

                        {/* Canvas Container */}
                        <div className="border rounded-lg overflow-auto max-h-96 bg-gray-50">
                            <canvas
                                ref={canvasRef}
                                className="cursor-crosshair"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            />
                        </div>

                        {/* Selections List */}
                        {selections.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium">Template Selections:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {selections.map((selection, index) => (
                                        <div key={selection.id} className="flex items-center justify-between p-2 border rounded">
                                            <div className="text-sm">
                                                <div className="font-medium">{selection.fieldName}</div>
                                                <div className="text-muted-foreground">
                                                    {selection.type}
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeSelection(selection.id)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'create' && !templateImage && (
                    <div className="text-center py-8 text-muted-foreground">
                        <div className="space-y-2">
                            <div className="text-lg">No template image available</div>
                            <div className="text-sm">Upload and process a PDF first to create a template</div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};