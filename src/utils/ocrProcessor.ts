import Tesseract from 'tesseract.js';
import { SelectionArea } from '@/components/ImageDisplay';
import { PDFPageImage } from './pdfProcessor';

export interface ExtractedText {
  id: string;
  fieldName: string;
  text: string;
  confidence: number;
  selectionArea: SelectionArea;
  pageNumber: number;
}

export class OCRProcessor {
  static async extractTextFromSelection(
    image: PDFPageImage,
    selection: SelectionArea,
    onProgress?: (progress: number) => void
  ): Promise<ExtractedText> {
    try {
      // Create a high-quality canvas to crop the selected area
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', {
        alpha: false,
        desynchronized: false,
        willReadFrequently: false
      });
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Load the image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = image.imageUrl;
      });

      // Use higher resolution for better OCR accuracy
      const scaleFactor = 2; // 2x upscaling for OCR
      canvas.width = selection.width * scaleFactor;
      canvas.height = selection.height * scaleFactor;

      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw the cropped area with upscaling
      ctx.drawImage(
        img,
        selection.x, selection.y, selection.width, selection.height,
        0, 0, canvas.width, canvas.height
      );

      // Convert canvas to high-quality blob for Tesseract
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png', 1.0); // Maximum quality PNG
      });

      // Perform OCR with enhanced settings
      const result = await Tesseract.recognize(blob, 'eng', {
        logger: (m) => {
          if (onProgress && m.status === 'recognizing text') {
            onProgress(m.progress);
          }
        },
      });

      return {
        id: selection.id,
        fieldName: selection.fieldName || 'Unknown Field',
        text: result.data.text.trim(),
        confidence: result.data.confidence,
        selectionArea: selection,
        pageNumber: selection.pageNumber,
      };
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error(`Failed to extract text: ${error}`);
    }
  }

  static async extractTextFromSelections(
    images: PDFPageImage[],
    selections: SelectionArea[],
    onProgress?: (current: number, total: number, currentField: string) => void
  ): Promise<ExtractedText[]> {
    const results: ExtractedText[] = [];
    
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      const image = images.find(img => img.pageNumber === selection.pageNumber);
      
      if (!image) {
        console.warn(`Image not found for page ${selection.pageNumber}`);
        continue;
      }

      try {
        if (onProgress) {
          onProgress(i + 1, selections.length, selection.fieldName || 'Unknown Field');
        }

        const result = await this.extractTextFromSelection(image, selection);
        results.push(result);
      } catch (error) {
        console.error(`Failed to extract text for selection ${selection.id}:`, error);
        // Continue with other selections even if one fails
        results.push({
          id: selection.id,
          fieldName: selection.fieldName || 'Unknown Field',
          text: '',
          confidence: 0,
          selectionArea: selection,
          pageNumber: selection.pageNumber,
        });
      }
    }

    return results;
  }

  static preprocessImageForOCR(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply preprocessing (contrast enhancement, noise reduction, etc.)
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      
      // Apply threshold (make it black and white)
      const threshold = 128;
      const value = gray > threshold ? 255 : 0;
      
      data[i] = value;     // Red
      data[i + 1] = value; // Green
      data[i + 2] = value; // Blue
      // Alpha channel stays the same
    }

    // Put the processed image data back
    ctx.putImageData(imageData, 0, 0);
    
    return canvas;
  }
}