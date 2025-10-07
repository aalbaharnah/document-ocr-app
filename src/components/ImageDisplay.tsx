import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Square, Circle } from 'lucide-react';
import { PDFPageImage } from '@/utils/pdfProcessor';

export interface SelectionArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rectangle' | 'circle';
  pageNumber: number;
  fieldName?: string;
}

interface ImageDisplayProps {
  images: PDFPageImage[];
  onSelectionChange: (selections: SelectionArea[]) => void;
  onNext: () => void;
  dataFields: Array<{ id: string; name: string; description?: string }>;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  images,
  onSelectionChange,
  onNext,
  dataFields,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selections, setSelections] = useState<SelectionArea[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'rectangle' | 'circle'>('rectangle');
  const [currentSelection, setCurrentSelection] = useState<Partial<SelectionArea> | null>(null);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentPage];

  // Draw image and selections on canvas
  useEffect(() => {
    if (!canvasRef.current || !currentImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size
      canvas.width = currentImage.width * zoom;
      canvas.height = currentImage.height * zoom;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw selections for current page
      const pageSelections = selections.filter(s => s.pageNumber === currentPage + 1);
      
      pageSelections.forEach((selection, index) => {
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
    img.src = currentImage.imageUrl;
  }, [currentImage, zoom, selections, currentPage, currentSelection, isDrawing, drawingTool]);

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
    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    setCurrentSelection({
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0,
      type: drawingTool,
      pageNumber: currentPage + 1,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentSelection) return;

    const coords = getCanvasCoordinates(e);
    setCurrentSelection(prev => ({
      ...prev!,
      width: coords.x - prev!.x!,
      height: coords.y - prev!.y!,
    }));
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentSelection) return;

    if (Math.abs(currentSelection.width!) > 10 && Math.abs(currentSelection.height!) > 10) {
      const newSelection: SelectionArea = {
        id: Date.now().toString(),
        x: Math.min(currentSelection.x!, currentSelection.x! + currentSelection.width!),
        y: Math.min(currentSelection.y!, currentSelection.y! + currentSelection.height!),
        width: Math.abs(currentSelection.width!),
        height: Math.abs(currentSelection.height!),
        type: currentSelection.type!,
        pageNumber: currentSelection.pageNumber!,
        fieldName: dataFields[selectedFieldIndex]?.name || `Field ${selections.length + 1}`,
      };

      const updatedSelections = [...selections, newSelection];
      setSelections(updatedSelections);
      onSelectionChange(updatedSelections);
      
      // Move to next field if available
      if (selectedFieldIndex < dataFields.length - 1) {
        setSelectedFieldIndex(selectedFieldIndex + 1);
      }
    }

    setIsDrawing(false);
    setCurrentSelection(null);
  };

  const removeSelection = (id: string) => {
    const updatedSelections = selections.filter(s => s.id !== id);
    setSelections(updatedSelections);
    onSelectionChange(updatedSelections);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  if (!currentImage) {
    return <div>No images to display</div>;
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Select Areas for Data Extraction</CardTitle>
        <CardDescription>
          Click and drag to select areas containing the data you want to extract.
          Use the tools below to draw rectangles or circles around text areas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
        </div>

        {/* Page Navigation */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              Previous Page
            </Button>
            <span className="text-sm font-medium">
              Page {currentPage + 1} of {images.length}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(images.length - 1, prev + 1))}
              disabled={currentPage === images.length - 1}
            >
              Next Page
            </Button>
          </div>
        )}

        {/* Canvas Container */}
        <div 
          ref={containerRef}
          className="border rounded-lg overflow-auto max-h-96 bg-gray-50"
          style={{ maxHeight: '500px' }}
        >
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
            <h3 className="text-sm font-medium">Selected Areas:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {selections.map((selection, index) => (
                <div key={selection.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="text-sm">
                    <div className="font-medium">{selection.fieldName}</div>
                    <div className="text-muted-foreground">
                      Page {selection.pageNumber} • {selection.type}
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

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selections.length} area{selections.length !== 1 ? 's' : ''} selected
          </div>
          <Button 
            onClick={onNext}
            disabled={selections.length === 0}
            className="min-w-24"
          >
            Extract Text
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};