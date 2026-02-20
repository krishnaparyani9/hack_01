import { createWorker } from 'tesseract.js';
import pdfParse from 'pdf-parse';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';

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
        const lower = url.toLowerCase();
        const hasPdfExt = lower.includes('.pdf');
        isPdf = hasPdfExt || (lower.includes('cloudinary') && lower.includes('/pdf/'));
        isImage = !hasPdfExt && (/(\.(jpg|jpeg|png))$/i.test(url) || (url.includes('cloudinary') && url.includes('/image/upload/')));
      }

      console.log(`OCR: isImage=${isImage}, isPdf=${isPdf}`);

      if (isPdf) {
        return await this.extractTextFromPdf(url);
      } else if (isImage) {
        return await this.extractTextFromImage(url);
      } else {
        console.log(`OCR: Unsupported URL type: ${url.substring(0, 50)}...`);
        throw new Error('Unsupported document type. Only JPG, PNG, and PDF are supported.');
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      return '';
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
        // Build best fetch URL — use Cloudinary private_download_url when possible
        let fetchUrl = url;
        const m = url.match(
          /res\.cloudinary\.com\/([^/]+)\/([^/]+)\/([^/]+)\/v(\d+)\/(.+?)\.(\w+)(?:[?#].*)?$/i
        );
        if (m) {
          const [, cloud, resType, , , publicId, format] = m;
          const resourceTypes = resType === 'raw' ? ['raw', 'image'] : ['image', 'raw'];
          for (const rt of resourceTypes) {
            try {
              const dlUrl = (cloudinary.utils as any).private_download_url(publicId, format, {
                cloud_name: cloud,
                resource_type: rt,
                type: 'upload',
                api_key: cloudinary.config().api_key,
                api_secret: cloudinary.config().api_secret,
              });
              if (dlUrl) { fetchUrl = dlUrl; break; }
            } catch { /* try next */ }
          }
        }
        console.log(`OCR: Fetching PDF from ${fetchUrl.substring(0, 80)}...`);
        const response = await axios.get(fetchUrl, { responseType: 'arraybuffer', timeout: 20000 });
        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status} fetching PDF`);
        }
        buffer = Buffer.from(response.data);
      }

      // Try pdf-parse for text extraction
      const data = await pdfParse(buffer);
      const text = data.text.trim();

      // If little to no text (likely scanned PDF), return empty string
      if (text.length < 30) {
        console.warn('PDF appears scanned or empty; no extractable text found.');
        return '';
      }

      return text;
    } catch (error) {
      // Fallback to OCR if pdf-parse fails or detects scanned PDF
      console.warn('PDF text extraction failed; returning empty text.');
      return '';
    }
  }

  /**
   * Cleans and normalizes extracted text for medical summarization.
   * Removes headers, footers, duplicate lab ranges, noise.
   * @param text - Raw extracted text.
   * @returns string - Cleaned text.
   */
  static cleanText(text: string): string {
    if (!text) return '';

    // Normalize line endings
    let cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Collapse runs of blank lines to a single blank line
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Remove obvious page headers/footers
    cleaned = cleaned.replace(/^(Page \d+( of \d+)?|Confidential|CONFIDENTIAL)\s*$/gim, '');

    // Collapse multiple spaces on a single line (but preserve newlines)
    cleaned = cleaned.split('\n').map(l => l.replace(/ {2,}/g, ' ').trim()).join('\n');

    // Remove truly empty lines after trimming
    cleaned = cleaned.split('\n').filter(l => l.length > 0).join('\n');

    return cleaned.trim();
  }
}
