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
You are a medical summarization assistant. Carefully read the entire document text below and extract every clinically relevant detail.

RULES:
- Extract ALL of the following if present: diagnoses, lab values (including normal ones with their reference ranges), vital signs, medications with doses, test results, procedures, dates, physician notes, allergies, and any abnormal findings.
- Quote numeric values exactly as they appear (e.g. "Hemoglobin: 11.2 g/dL (ref 12-16)").
- Do NOT skip values just because they are within normal range — include them.
- Merge repeated measurements into one bullet with the date range.
- Organize output into sections: **Diagnoses / Impressions**, **Lab Results**, **Vital Signs**, **Medications**, **Procedures / Tests**, **Other Findings**. Omit sections with no data.
- Use concise bullet points. Do NOT add medical advice or new diagnoses.
- Only say "No extractable information found" if the document text is truly blank or unintelligible.
- IMPORTANT: If the document contains a report date, collection date, test date, or sample date, output it on the VERY FIRST LINE in exactly this format: "Report Date: YYYY-MM-DD". If no date is found, omit that line entirely.

Document Text:
${text}

Structured Summary:
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
You are a medical summarization assistant. Combine the following AI-generated summaries from multiple documents belonging to the same patient into a single, cohesive report.

RULES:
- Include ALL findings from every document — do NOT drop values just because they appear normal.
- Highlight trends (e.g. "Hemoglobin dropped from 13 g/dL (Jan) to 11.2 g/dL (Mar)").
- ONLY use information present in the provided summaries.
- DO NOT invent new diagnoses, treatments, or prognoses.
- Organize into: **Overall Status**, **Key Diagnoses**, **Lab Trends**, **Medications**, **Procedures / Tests**, **Critical Alerts**. Omit sections with no data.
- Use concise bullet points per section.
- Only say "No information available" if all summaries are blank.

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
        temperature: 0.3,
        max_tokens: 1024,
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
