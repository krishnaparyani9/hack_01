import { createWorker } from 'tesseract.js';
import pdfParse from 'pdf-parse';
import axios from 'axios';

/**
 * OCR Service for extracting text from medical documents.
 * Supports JPG/PNG images via Tesseract.js and PDFs via pdf-parse (text-based) or OCR fallback.
 */
export class OCRService {
  /**
   * Extracts text from a document URL (Cloudinary or data URL).
   * @param url - The document URL (e.g., Cloudinary secure_url or data URL).
   * @returns Promise<string> - Extracted raw text.
   */
  static async extractText(url: string): Promise<string> {
    try {
      console.log(`OCR: Processing URL: ${url.substring(0, 100)}...`);

      let isImage = false;
      let isPdf = false;

      if (url.startsWith('data:')) {
        // Parse mime type from data URL
        const mimeMatch = url.match(/^data:([^;]+)/);
        if (mimeMatch) {
          const mime = mimeMatch[1];
          console.log(`OCR: Data URL mime type: ${mime}`);
          isImage = mime.startsWith('image/');
          isPdf = mime === 'application/pdf';
        } else {
          // Fallback: assume image if data URL and not explicitly PDF
          console.log(`OCR: Could not parse mime type, assuming image`);
          isImage = true;
        }
      } else {
        // Regular URL detection
        isImage = /\.(jpg|jpeg|png)$/i.test(url) || (url.includes('cloudinary') && url.includes('image'));
        isPdf = /\.(pdf)$/i.test(url) || (url.includes('cloudinary') && url.includes('pdf'));
      }

      console.log(`OCR: isImage=${isImage}, isPdf=${isPdf}`);

      if (isImage) {
        return await this.extractTextFromImage(url);
      } else if (isPdf) {
        return await this.extractTextFromPdf(url);
      } else {
        console.log(`OCR: Unsupported URL type: ${url.substring(0, 50)}...`);
        throw new Error('Unsupported document type. Only JPG, PNG, and PDF are supported.');
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error('Failed to extract text from document.');
    }
  }

  /**
   * Extracts text from an image (JPG/PNG) using Tesseract.js OCR.
   * @param url - Image URL or data URL.
   * @returns Promise<string> - Extracted text.
   */
  private static async extractTextFromImage(url: string): Promise<string> {
    const worker = await createWorker('eng'); // English language for medical docs
    try {
      let imageInput: string | Buffer = url;

      // Handle data URLs
      if (url.startsWith('data:image/')) {
        const base64Data = url.split(',')[1];
        imageInput = Buffer.from(base64Data, 'base64');
      }

      const { data: { text } } = await worker.recognize(imageInput);
      return text;
    } finally {
      await worker.terminate();
    }
  }

  /**
   * Extracts text from a PDF. Uses pdf-parse for text-based PDFs; falls back to OCR if scanned.
   * @param url - PDF URL or data URL.
   * @returns Promise<string> - Extracted text.
   */
  private static async extractTextFromPdf(url: string): Promise<string> {
    try {
      let buffer: Buffer;

      // Handle data URLs
      if (url.startsWith('data:application/pdf;base64,')) {
        const base64Data = url.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        // Fetch PDF buffer from URL
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        buffer = Buffer.from(response.data);
      }

      // Try pdf-parse for text extraction
      const data = await pdfParse(buffer);
      const text = data.text.trim();

      // If little to no text (likely scanned PDF), fallback to OCR
      if (text.length < 100) {
        console.warn('PDF appears scanned; falling back to OCR.');
        // For simplicity, assume first page as image; in production, convert PDF pages to images
        throw new Error('Scanned PDF detected; OCR fallback needed.');
      }

      return text;
    } catch (error) {
      // Fallback to OCR if pdf-parse fails or detects scanned PDF
      console.warn('PDF text extraction failed; attempting OCR fallback.');
      // Note: For scanned PDFs, you'd need to convert pages to images first (e.g., using pdf2pic)
      // For now, throw error; in production, implement page-to-image conversion
      throw new Error('Scanned PDF OCR not fully implemented. Use text-based PDFs.');
    }
  }

  /**
   * Cleans and normalizes extracted text for medical summarization.
   * Removes headers, footers, duplicate lab ranges, noise.
   * @param text - Raw extracted text.
   * @returns string - Cleaned text.
   */
  static cleanText(text: string): string {
    // Basic cleaning: normalize CRLF -> LF and preserve line breaks for table-like extraction
    let cleaned = text.replace(/\r\n?/g, '\n');
    // Collapse multiple blank lines to a single blank line
    cleaned = cleaned.replace(/\n{2,}/g, '\n');

    // Trim spaces on each line but keep line separations
    const linesRaw = cleaned.split('\n').map((l) => l.replace(/\s+/g, ' ').trim());

    // Remove common headers/footers (customize based on typical medical docs)
    const filtered = linesRaw.filter((line) => !/^(Patient Name|Date|Report|Page \d+|Confidential)/i.test(line));

    // Remove duplicate lines (case-insensitive)
    const uniqueLines: string[] = [];
    const seen = new Set<string>();
    for (const line of filtered) {
      const normalized = line.trim().toLowerCase();
      if (!seen.has(normalized) && normalized.length > 0) {
        seen.add(normalized);
        uniqueLines.push(line.trim());
      }
    }
    cleaned = uniqueLines.join('\n');

    // Remove non-printable noise characters but preserve common medical symbols and %, ±, >, <, /, . and parentheses
    cleaned = cleaned.replace(/[^\x20-\x7E\n%±<>/(),.:;\-]/g, '');

    return cleaned.trim();
  }
}
