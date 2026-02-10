import OpenAI from 'openai';

/**
 * LLM Service for generating medical document summaries using Groq's hosted models.
 * Ensures summaries are strictly derived from the provided text, no new diagnoses or advice.
 */
export class LLMService {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }

    this.model = process.env.GROQ_MODEL?.trim() || 'llama-3.1-8b-instant';
    const baseURL = process.env.GROQ_BASE_URL?.trim() || 'https://api.groq.com/openai/v1';

    // Groq exposes an OpenAI-compatible API, so reuse the OpenAI SDK with a custom base URL.
    this.client = new OpenAI({ apiKey, baseURL });
  }

  /**
   * Generates a concise, doctor-friendly medical summary from cleaned text.
   * @param text - Cleaned medical text from OCR.
   * @returns Promise<string> - Structured bullet-point summary.
   */
  async generateSummary(text: string): Promise<string> {
    console.log('LLM: Generating summary for text length:', text.length);

    const prompt = `
You are a medical summarization assistant. Your task is to create a concise, doctor-friendly summary of the provided medical document text.

IMPORTANT RULES:
- ONLY include information explicitly mentioned in the text.
- DO NOT add new diagnoses, predictions, or medical advice.
- DO NOT suggest treatments or recommendations.
- Extract only: diagnoses mentioned, abnormal lab values, current medications, critical alerts.
- Merge duplicate measurements into one bullet noting the date range (e.g., "SaO2 92% on 06/04 - 07/05/2004").
- Limit each section to at most three concise bullets; omit a section if no data.
- Output sections in the order: Diagnoses, Abnormal Labs, Medications, Critical Alerts.
- If no relevant information is found, state "No significant findings in the provided text."

Medical Document Text:
${text}

Summary:
`;

    return this.requestSummary(prompt, 'document summary', 'Failed to generate medical summary');
  }

  /**
   * Generates an aggregated summary across multiple document-level summaries for a single patient.
   * @param documents - Array of pre-generated document summaries with optional titles.
   */
  async generateAggregateSummary(documents: Array<{ title?: string; summary: string }>): Promise<string> {
    if (!documents?.length) {
      throw new Error('No document summaries provided for aggregation');
    }

    console.log('LLM: Generating aggregate summary for document count:', documents.length);

    const compiled = documents
      .map((entry, index) => {
        const heading = entry.title?.trim() || `Document ${index + 1}`;
        return `Document ${index + 1} — ${heading}:
${entry.summary}`;
      })
      .join('\n\n');

    const prompt = `
You are a medical summarization assistant. You will receive AI-generated summaries from multiple medical documents belonging to the same patient. Combine them into a single, cohesive report.

IMPORTANT RULES:
- Synthesize overlapping findings and highlight trends across documents.
- ONLY use information present in the provided summaries.
- DO NOT invent new diagnoses, treatments, or prognoses.
- Organize output into: Overall Status, Key Diagnoses, Abnormal Labs, Medications, Critical Alerts.
- Limit each section to at most three concise bullets; omit sections without data.
- If no meaningful findings exist, respond with "No significant findings across the provided records.".

Patient Document Summaries:
${compiled}

Unified Summary:
`;

    return this.requestSummary(prompt, 'aggregate summary', 'Failed to generate patient summary');
  }

  private async requestSummary(prompt: string, operation: string, failureMessage: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2
      });

      const rawContent = response.choices[0]?.message?.content;
      const summary = Array.isArray(rawContent)
        ? rawContent.map(part => (typeof part === 'string' ? part : part?.text ?? '')).join('').trim()
        : rawContent?.trim();
      if (!summary) {
        throw new Error('LLM returned an empty summary');
      }

      console.log(`LLM (${operation}): Summary generated successfully`);
      return summary;
    } catch (error) {
      console.error(`Error generating ${operation} with LLM:`, error);

      const status = (error as { status?: number })?.status;
      const code = (error as { code?: string })?.code;
      const message = (error as { message?: string })?.message ?? '';

      if (status === 429 || code === 'insufficient_quota') {
        throw new Error('Groq quota exceeded; please review usage limits or upgrade the plan.');
      }

      if (code === 'model_decommissioned' || message.includes('decommissioned')) {
        throw new Error(`Groq model ${this.model} is deprecated; update GROQ_MODEL to a supported model (see console.groq.com/docs/models).`);
      }

      throw new Error(failureMessage);
    }
  }
}
