import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * LLM Service for generating medical document summaries using Google Gemini.
 * Ensures summaries are strictly derived from the provided text, no new diagnoses or advice.
 */
export class LLMService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Generates a concise, doctor-friendly medical summary from cleaned text.
   * @param text - Cleaned medical text from OCR.
   * @returns Promise<string> - Structured bullet-point summary.
   */
  async generateSummary(text: string): Promise<string> {
    try {
      console.log('LLM: Generating summary for text length:', text.length);

      const prompt = `
You are a medical summarization assistant. Your task is to create a concise, doctor-friendly summary of the provided medical document text.

IMPORTANT RULES:
- ONLY include information explicitly mentioned in the text.
- DO NOT add new diagnoses, predictions, or medical advice.
- DO NOT suggest treatments or recommendations.
- Extract only: diagnoses mentioned, abnormal lab values, current medications, critical alerts.
- Output in structured bullet points.
- If no relevant information is found, state "No significant findings in the provided text."

Medical Document Text:
${text}

Summary:
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text().trim();

      console.log('LLM: Summary generated successfully');
      return summary;
    } catch (error) {
      console.error('Error generating summary with LLM:', error);
      throw new Error('Failed to generate medical summary');
    }
  }
}
