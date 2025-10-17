import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Edit2, Check, X, AlertTriangle } from 'lucide-react';
import { ExtractedText } from '@/utils/ocrProcessor';

interface ExtractedTextDisplayProps {
  extractedData: ExtractedText[];
  onDataChange: (data: ExtractedText[]) => void;
  onExportCSV: () => void;
  isProcessing: boolean;
  processingProgress?: {
    current: number;
    total: number;
    currentField: string;
  };
}

export const ExtractedTextDisplay: React.FC<ExtractedTextDisplayProps> = ({
  extractedData,
  onDataChange,
  onExportCSV,
  isProcessing,
  processingProgress,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (item: ExtractedText) => {
    setEditingId(item.id);
    setEditValue(item.text);
  };

  const saveEdit = () => {
    if (!editingId) return;

    const updatedData = extractedData.map(item =>
      item.id === editingId ? { ...item, text: editValue } : item
    );
    onDataChange(updatedData);
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return '✓';
    if (confidence >= 30) return '⚠';
    return '⚠';
  };

  if (isProcessing) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Processing OCR...</CardTitle>
          <CardDescription>
            Extracting text from selected areas. This may take a few moments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {processingProgress ?
                  `Processing: ${processingProgress.currentField}` :
                  'Starting OCR processing...'
                }
              </span>
              <span>
                {processingProgress ?
                  `${processingProgress.current} / ${processingProgress.total}` :
                  '0 / 0'
                }
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: processingProgress ?
                    `${(processingProgress.current / processingProgress.total) * 100}%` :
                    '0%'
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Extracted Data</CardTitle>
        <CardDescription>
          Review and edit the extracted text data. Click the edit button to modify any incorrect text.
          Confidence scores indicate OCR accuracy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">{extractedData.length}</div>
            <div className="text-sm text-muted-foreground">Total Fields</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {extractedData.filter(item => item.confidence >= 80).length}
            </div>
            <div className="text-sm text-muted-foreground">High Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {extractedData.filter(item => item.confidence < 80 && item.confidence >= 30).length}
            </div>
            <div className="text-sm text-muted-foreground">Needs Review</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 font-medium text-sm">
            <div className="col-span-3">Field Name</div>
            <div className="col-span-6">Extracted Text</div>
            <div className="col-span-1 text-center">Page</div>
            <div className="col-span-1 text-center">Confidence</div>
            <div className="col-span-1 text-center">Actions</div>
          </div>

          {extractedData.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 p-3 border-t hover:bg-muted/20">
              <div className="col-span-3 font-medium">
                {item.fieldName}
              </div>

              <div className="col-span-6">
                {editingId === item.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                    />
                    <Button size="sm" onClick={saveEdit}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm">
                    {item.text || (
                      <span className="text-muted-foreground italic">No text extracted</span>
                    )}
                  </div>
                )}
              </div>

              <div className="col-span-1 text-center text-sm">
                {item.pageNumber}
              </div>

              <div className={`col-span-1 text-center text-sm font-medium ${getConfidenceColor(item.confidence)}`}>
                <div className="flex items-center justify-center gap-1">
                  {item.confidence < 80 && <AlertTriangle className="h-3 w-3" />}
                  {Math.round(item.confidence)}%
                </div>
              </div>

              <div className="col-span-1 text-center">
                {editingId === item.id ? null : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(item)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {extractedData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No data extracted. Please go back and select areas for text extraction.
          </div>
        )}

        {/* Low Confidence Warning */}
        {extractedData.some(item => item.confidence < 30) && (
          <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Low Confidence Detected</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Some fields have low confidence scores (&lt;60%). Please review and edit these values manually
              to ensure accuracy before exporting.
            </p>
          </div>
        )}

        {/* Export Section */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {extractedData.filter(item => item.text.trim()).length} of {extractedData.length} fields contain text
          </div>
          <Button
            onClick={onExportCSV}
            disabled={extractedData.length === 0}
            className="min-w-32"
          >
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};