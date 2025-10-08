import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

interface DataField {
  id: string;
  name: string;
  description?: string;
}

interface DataExtractionSetupProps {
  onFieldsChange: (fields: DataField[]) => void;
  onNext: () => void;
}

export const DataExtractionSetup: React.FC<DataExtractionSetupProps> = ({
  onFieldsChange,
  onNext,
}) => {
  const [fields, setFields] = useState<DataField[]>([
    { id: '1', name: 'Project Name', description: 'Project identification name' },
    { id: '2', name: 'P&ID No', description: 'P&ID number' },
    { id: '3', name: 'Rev', description: 'Revision number' },
  ]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldDescription, setNewFieldDescription] = useState('');

  const addField = () => {
    if (newFieldName.trim()) {
      const newField: DataField = {
        id: Date.now().toString(),
        name: newFieldName.trim(),
        description: newFieldDescription.trim() || undefined,
      };
      const updatedFields = [...fields, newField];
      setFields(updatedFields);
      onFieldsChange(updatedFields);
      setNewFieldName('');
      setNewFieldDescription('');
    }
  };

  const removeField = (id: string) => {
    const updatedFields = fields.filter(field => field.id !== id);
    setFields(updatedFields);
    onFieldsChange(updatedFields);
  };

  const updateField = (id: string, name: string, description?: string) => {
    const updatedFields = fields.map(field =>
      field.id === id ? { ...field, name, description } : field
    );
    setFields(updatedFields);
    onFieldsChange(updatedFields);
  };

  const handleNext = () => {
    onFieldsChange(fields);
    onNext();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Configure Data Extraction</CardTitle>
        <CardDescription>
          Define what data you want to extract from your P&ID diagrams. 
          You can add common fields like equipment tags, temperatures, pressures, etc.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Fields */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Data Fields to Extract</h3>
          {fields.map((field) => (
            <div key={field.id} className="flex items-center space-x-2 p-3 border rounded-lg">
              <div className="flex-1">
                <Input
                  value={field.name}
                  onChange={(e) => updateField(field.id, e.target.value, field.description)}
                  placeholder="Field name"
                  className="mb-2"
                />
                <Input
                  value={field.description || ''}
                  onChange={(e) => updateField(field.id, field.name, e.target.value)}
                  placeholder="Description (optional)"
                  className="text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeField(field.id)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add New Field */}
        <div className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-medium">Add New Field</h3>
          <div className="space-y-2">
            <Input
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="Field name (e.g., Flow Rate, Valve Type)"
              onKeyPress={(e) => e.key === 'Enter' && addField()}
            />
            <Input
              value={newFieldDescription}
              onChange={(e) => setNewFieldDescription(e.target.value)}
              placeholder="Description (optional)"
              onKeyPress={(e) => e.key === 'Enter' && addField()}
            />
            <Button onClick={addField} className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {fields.length} field{fields.length !== 1 ? 's' : ''} configured
          </div>
          <Button 
            onClick={handleNext}
            disabled={fields.length === 0}
            className="min-w-24"
          >
            Next Step
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};