import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source to use local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export interface PDFPageImage {
  pageNumber: number;
  imageUrl: string;
  width: number;
  height: number;
  fileName?: string;
  fileIndex?: number;
}

export interface PDFRenderOptions {
  scale?: number;
  quality?: number;
  imageFormat?: 'png' | 'jpeg';
  enableAntialiasing?: boolean;
}

export class PDFProcessor {
  static async convertPDFToImages(
    file: File,
    options: PDFRenderOptions = {},
    fileIndex?: number
  ): Promise<PDFPageImage[]> {
    const {
      scale = 3, // Increased from 2 to 3 for better quality
      quality = 1.0,
      imageFormat = 'png',
      enableAntialiasing = true
    } = options;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images: PDFPageImage[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Create canvas with high quality settings
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', {
          alpha: false,
          desynchronized: false,
          willReadFrequently: false
        });

        if (!context) {
          throw new Error('Could not get canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Set high-quality rendering settings
        if (enableAntialiasing) {
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';
        }

        // Set pixel density for high DPI displays
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.width = viewport.width * pixelRatio;
        canvas.height = viewport.height * pixelRatio;
        context.scale(pixelRatio, pixelRatio);

        // Render PDF page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;

        // Convert canvas to high-quality image URL
        const mimeType = imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
        const imageUrl = canvas.toDataURL(mimeType, quality);

        images.push({
          pageNumber: pageNum,
          imageUrl,
          width: viewport.width,
          height: viewport.height,
          fileName: file.name,
          fileIndex: fileIndex,
        });
      }

      return images;
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      throw new Error('Failed to convert PDF to images');
    }
  }

  static async getPageCount(file: File): Promise<number> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      return pdf.numPages;
    } catch (error) {
      console.error('Error getting page count:', error);
      throw new Error('Failed to read PDF file');
    }
  }
}