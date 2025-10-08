import React, { useState } from 'react';
import { DataExtractionSetup } from './components/DataExtractionSetup';
import { PDFUpload } from './components/PDFUpload';
import { ImageDisplay, SelectionArea } from './components/ImageDisplay';
import { ExtractedTextDisplay } from './components/ExtractedTextDisplay';
import { QualitySettingsPanel, QualitySettings } from './components/QualitySettings';
import { PDFProcessor, PDFPageImage, PDFRenderOptions } from './utils/pdfProcessor';
import { OCRProcessor, ExtractedText } from './utils/ocrProcessor';
import { CSVExporter } from './utils/csvExporter';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { FileText, Settings, Image, Download, ArrowLeft } from 'lucide-react';

interface DataField {
  id: string;
  name: string;
  description?: string;
}

type AppStep = 'setup' | 'upload' | 'convert' | 'select' | 'extract' | 'results';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('setup');
  const [dataFields, setDataFields] = useState<DataField[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfImages, setPdfImages] = useState<PDFPageImage[]>([]);
  const [selections, setSelections] = useState<SelectionArea[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedText[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{
    current: number;
    total: number;
    currentField: string;
  } | undefined>();
  
  // Quality settings state
  const [qualitySettings, setQualitySettings] = useState<QualitySettings>({
    scale: 3,
    quality: 1.0,
    imageFormat: 'png',
    enableAntialiasing: true
  });
  const [showQualitySettings, setShowQualitySettings] = useState(false);

  const handleFieldsChange = (fields: DataField[]) => {
    setDataFields(fields);
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handlePDFConversion = async () => {
    if (!uploadedFile) return;
    
    setIsProcessing(true);
    try {
      const renderOptions: PDFRenderOptions = {
        scale: qualitySettings.scale,
        quality: qualitySettings.quality,
        imageFormat: qualitySettings.imageFormat,
        enableAntialiasing: qualitySettings.enableAntialiasing
      };
      
      const images = await PDFProcessor.convertPDFToImages(uploadedFile, renderOptions);
      setPdfImages(images);
      setCurrentStep('select');
    } catch (error) {
      console.error('Error converting PDF:', error);
      alert('Failed to convert PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectionChange = (newSelections: SelectionArea[]) => {
    setSelections(newSelections);
  };

  const handleTextExtraction = async () => {
    if (selections.length === 0) return;

    setIsProcessing(true);
    setCurrentStep('extract');
    
    try {
      const results = await OCRProcessor.extractTextFromSelections(
        pdfImages,
        selections,
        (current, total, currentField) => {
          setProcessingProgress({ current, total, currentField });
        }
      );
      setExtractedData(results);
      setCurrentStep('results');
    } catch (error) {
      console.error('Error extracting text:', error);
      alert('Failed to extract text. Please try again.');
      setCurrentStep('select');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(undefined);
    }
  };

  const handleDataChange = (data: ExtractedText[]) => {
    setExtractedData(data);
  };

  const handleExportCSV = () => {
    CSVExporter.exportToCSV(extractedData);
  };

  const goBack = () => {
    switch (currentStep) {
      case 'upload':
        setCurrentStep('setup');
        break;
      case 'convert':
        setCurrentStep('upload');
        break;
      case 'select':
        setCurrentStep('upload');
        break;
      case 'extract':
        setCurrentStep('select');
        break;
      case 'results':
        setCurrentStep('select');
        break;
      default:
        break;
    }
  };

  const resetApp = () => {
    setCurrentStep('setup');
    setDataFields([]);
    setUploadedFile(null);
    setPdfImages([]);
    setSelections([]);
    setExtractedData([]);
    setIsProcessing(false);
    setProcessingProgress(undefined);
  };

  const getStepIcon = (step: AppStep) => {
    switch (step) {
      case 'setup': return <Settings className="h-5 w-5" />;
      case 'upload': return <FileText className="h-5 w-5" />;
      case 'convert': return <Image className="h-5 w-5" />;
      case 'select': return <Image className="h-5 w-5" />;
      case 'extract': return <Image className="h-5 w-5" />;
      case 'results': return <Download className="h-5 w-5" />;
      default: return null;
    }
  };

  const getStepName = (step: AppStep) => {
    switch (step) {
      case 'setup': return 'Setup Fields';
      case 'upload': return 'Upload PDF';
      case 'convert': return 'Convert PDF';
      case 'select': return 'Select Areas';
      case 'extract': return 'Extract Text';
      case 'results': return 'Review Results';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">P&ID Data Extractor</h1>
                <p className="text-sm text-muted-foreground">
                  Extract data from P&ID diagrams using OCR technology
                </p>
              </div>
            </div>
            
            {currentStep !== 'setup' && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button variant="outline" onClick={resetApp}>
                  Start Over
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-4 overflow-x-auto">
            {(['setup', 'upload', 'select', 'results'] as AppStep[]).map((step, index) => {
              const isActive = currentStep === step;
              const isCompleted = ['setup', 'upload', 'select', 'results'].indexOf(currentStep) > index;
              
              return (
                <div
                  key={step}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isCompleted 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground'
                  }`}
                >
                  {getStepIcon(step)}
                  <span className="text-sm font-medium whitespace-nowrap">
                    {getStepName(step)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentStep === 'setup' && (
          <DataExtractionSetup
            onFieldsChange={handleFieldsChange}
            onNext={() => setCurrentStep('upload')}
          />
        )}

        {currentStep === 'upload' && (
          <PDFUpload
            onFileUpload={handleFileUpload}
            onNext={() => setCurrentStep('convert')}
            uploadedFile={uploadedFile}
          />
        )}

        {currentStep === 'convert' && (
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Quality Settings Panel */}
            <QualitySettingsPanel
              settings={qualitySettings}
              onSettingsChange={setQualitySettings}
              onApply={handlePDFConversion}
              isProcessing={isProcessing}
            />
            
            {/* Conversion Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Convert PDF to Images</CardTitle>
                <CardDescription>
                  Converting your PDF file to images for processing...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  {isProcessing ? (
                    <div className="space-y-4">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                      <p>Converting PDF pages to images at {qualitySettings.scale}x scale...</p>
                      <p className="text-sm text-gray-500">
                        Using {qualitySettings.imageFormat.toUpperCase()} format with {Math.round(qualitySettings.quality * 100)}% quality
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Image className="h-16 w-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium">Ready to Convert</h3>
                        <p className="text-muted-foreground">
                          Adjust quality settings above, then click to convert your PDF to images
                        </p>
                      </div>
                      <Button onClick={handlePDFConversion} size="lg">
                        Convert PDF to Images
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'select' && pdfImages.length > 0 && (
          <ImageDisplay
            images={pdfImages}
            onSelectionChange={handleSelectionChange}
            onNext={handleTextExtraction}
            dataFields={dataFields}
          />
        )}

        {(currentStep === 'extract' || currentStep === 'results') && (
          <ExtractedTextDisplay
            extractedData={extractedData}
            onDataChange={handleDataChange}
            onExportCSV={handleExportCSV}
            isProcessing={currentStep === 'extract'}
            processingProgress={processingProgress}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>P&ID Data Extractor - Built with React, Tesseract.js, and Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
