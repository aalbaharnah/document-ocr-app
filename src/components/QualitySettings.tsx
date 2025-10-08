import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings } from 'lucide-react';

export interface QualitySettings {
  scale: number;
  quality: number;
  imageFormat: 'png' | 'jpeg';
  enableAntialiasing: boolean;
}

interface QualitySettingsProps {
  settings: QualitySettings;
  onSettingsChange: (settings: QualitySettings) => void;
  onApply: () => void;
  isProcessing?: boolean;
}

export const QualitySettingsPanel: React.FC<QualitySettingsProps> = ({
  settings,
  onSettingsChange,
  onApply,
  isProcessing = false
}) => {
  const handleScaleChange = (value: string) => {
    const scale = Math.max(1, Math.min(5, parseFloat(value) || 2));
    onSettingsChange({ ...settings, scale });
  };

  const handleQualityChange = (value: string) => {
    const quality = Math.max(0.1, Math.min(1, parseFloat(value) || 1));
    onSettingsChange({ ...settings, quality });
  };

  const handleFormatChange = (format: 'png' | 'jpeg') => {
    onSettingsChange({ ...settings, imageFormat: format });
  };

  const handleAntialiasingToggle = () => {
    onSettingsChange({ ...settings, enableAntialiasing: !settings.enableAntialiasing });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Image Quality Settings
        </CardTitle>
        <CardDescription>
          Adjust these settings to improve image quality and OCR accuracy. Higher values produce better quality but larger file sizes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Scale Factor: {settings.scale}x
            </label>
            <Input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={settings.scale}
              onChange={(e) => handleScaleChange(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Higher scale = better quality (1x-5x)
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Quality: {Math.round(settings.quality * 100)}%
            </label>
            <Input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={settings.quality}
              onChange={(e) => handleQualityChange(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Image compression quality (10%-100%)
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Image Format</label>
          <div className="flex gap-2">
            <Button
              variant={settings.imageFormat === 'png' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFormatChange('png')}
            >
              PNG (Best Quality)
            </Button>
            <Button
              variant={settings.imageFormat === 'jpeg' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFormatChange('jpeg')}
            >
              JPEG (Smaller Size)
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="antialiasing"
            checked={settings.enableAntialiasing}
            onChange={handleAntialiasingToggle}
            className="h-4 w-4"
          />
          <label htmlFor="antialiasing" className="text-sm font-medium">
            Enable High-Quality Antialiasing
          </label>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            Current settings will produce {settings.imageFormat.toUpperCase()} images at {settings.scale}x scale
          </div>
          <Button 
            onClick={onApply} 
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? 'Processing...' : 'Apply Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};