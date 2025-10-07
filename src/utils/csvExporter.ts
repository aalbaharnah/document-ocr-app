import { ExtractedText } from './ocrProcessor';

export class CSVExporter {
  static exportToCSV(extractedData: ExtractedText[], filename?: string): void {
    if (extractedData.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Prepare CSV headers
    const headers = [
      'Field Name',
      'Extracted Text',
      'Page Number',
      'Confidence Score (%)',
      'Position X',
      'Position Y',
      'Width',
      'Height',
      'Selection Type'
    ];

    // Prepare CSV rows
    const rows = extractedData.map(item => [
      this.escapeCSVValue(item.fieldName),
      this.escapeCSVValue(item.text),
      item.pageNumber.toString(),
      Math.round(item.confidence).toString(),
      Math.round(item.selectionArea.x).toString(),
      Math.round(item.selectionArea.y).toString(),
      Math.round(item.selectionArea.width).toString(),
      Math.round(item.selectionArea.height).toString(),
      item.selectionArea.type
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    // Create and download file
    this.downloadCSV(csvContent, filename);
  }

  static exportSummaryToCSV(extractedData: ExtractedText[], filename?: string): void {
    if (extractedData.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Prepare simplified CSV headers
    const headers = ['Field Name', 'Extracted Text', 'Page Number'];

    // Prepare CSV rows with only essential data
    const rows = extractedData.map(item => [
      this.escapeCSVValue(item.fieldName),
      this.escapeCSVValue(item.text),
      item.pageNumber.toString()
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    // Create and download file
    this.downloadCSV(csvContent, filename || 'pid_data_summary.csv');
  }

  static exportGroupedByPage(extractedData: ExtractedText[], filename?: string): void {
    if (extractedData.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Group data by page
    const groupedData = extractedData.reduce((acc, item) => {
      const page = item.pageNumber;
      if (!acc[page]) {
        acc[page] = [];
      }
      acc[page].push(item);
      return acc;
    }, {} as Record<number, ExtractedText[]>);

    const headers = ['Page', 'Field Name', 'Extracted Text', 'Confidence (%)'];
    const rows: string[][] = [];

    // Add data for each page
    Object.keys(groupedData)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(pageNum => {
        const pageData = groupedData[parseInt(pageNum)];
        
        pageData.forEach((item, index) => {
          rows.push([
            index === 0 ? `Page ${pageNum}` : '', // Only show page number on first row for each page
            this.escapeCSVValue(item.fieldName),
            this.escapeCSVValue(item.text),
            Math.round(item.confidence).toString()
          ]);
        });

        // Add empty row between pages (except for last page)
        if (pageNum !== Object.keys(groupedData).slice(-1)[0]) {
          rows.push(['', '', '', '']);
        }
      });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    // Create and download file
    this.downloadCSV(csvContent, filename || 'pid_data_by_page.csv');
  }

  private static escapeCSVValue(value: string): string {
    // Handle empty or null values
    if (!value) return '""';

    // Escape quotes and wrap in quotes if necessary
    const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r');
    
    if (needsQuotes) {
      // Escape existing quotes by doubling them
      const escapedValue = value.replace(/"/g, '""');
      return `"${escapedValue}"`;
    }

    return value;
  }

  private static downloadCSV(csvContent: string, filename?: string): void {
    const defaultFilename = `pid_extracted_data_${new Date().toISOString().split('T')[0]}.csv`;
    const finalFilename = filename || defaultFilename;

    // Create blob with CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      // Modern browsers support
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', finalFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Fallback for older browsers
      const nav = navigator as any;
      if (nav.msSaveBlob) {
        nav.msSaveBlob(blob, finalFilename);
      } else {
        console.error('CSV download not supported in this browser');
      }
    }
  }

  static getDataPreview(extractedData: ExtractedText[], maxRows: number = 5): string {
    if (extractedData.length === 0) return 'No data available';

    const headers = ['Field Name', 'Extracted Text', 'Page'];
    const previewData = extractedData.slice(0, maxRows);
    
    const rows = previewData.map(item => [
      item.fieldName,
      item.text.length > 30 ? item.text.substring(0, 30) + '...' : item.text,
      item.pageNumber.toString()
    ]);

    const table = [headers, ...rows]
      .map(row => row.map(cell => cell.padEnd(20)).join(' | '))
      .join('\n');

    return table + (extractedData.length > maxRows ? `\n... and ${extractedData.length - maxRows} more rows` : '');
  }
}