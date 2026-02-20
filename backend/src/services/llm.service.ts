/**
 * LLM Service for generating medical document summaries
 * using a deployed Modal summarization endpoint (DistilBART).
 * 
 * NOTE:
 * DistilBART is NOT an instruction-following model.
 * We must send ONLY raw document text (no prompts).
 */

export class LLMService {
  private modalUrl: string;

  constructor() {
    // Accept either MODAL_SUMMARY_URL (preferred) or fallback to MODAL_URL for compatibility
    const url = (process.env.MODAL_SUMMARY_URL || process.env.MODAL_URL || "").trim();
    if (!url) {
      throw new Error(
        "Modal summarizer URL not set. Please set MODAL_SUMMARY_URL or MODAL_URL in environment"
      );
    }

    this.modalUrl = url;
  }

  /**
   * Generates a concise summary from cleaned OCR text.
   * @param text - Cleaned medical text from OCR.
   */
  formatStructuredData(structured: Record<string, any>): string {
    const formatArray = (label: string, items: any) => {
      if (!items) return '';
      let arr = [];
      if (Array.isArray(items)) arr = items;
      else if (typeof items === 'string' && items.trim()) arr = [items.trim()];

      if (!arr.length) return '';
      return `**${label}:**\n${arr.map((it: any) => `• ${it}`).join('\n')}\n\n`;
    };

    let result = '';

    if (structured) {
      if (structured.chief_complaint) result += `**Chief Complaint:** ${structured.chief_complaint}\n\n`;
      if (structured.duration) result += `**Duration:** ${structured.duration}\n\n`;

      if (typeof structured.summary === 'string' && structured.summary.trim()) {
        const title = structured.method === 'heuristic' ? 'Raw Extracted Excerpts' : 'Overview';
        result += `**${title}:**\n${structured.summary.trim()}\n\n`;
      }

      result += formatArray('Key Findings', structured.key_findings || structured.keyFindings);
      result += formatArray('Important Readings', structured.important_readings || structured.importantReadings || structured.readings);
      result += formatArray('Threats / Concerns', structured.threats || structured.concerns);
      result += formatArray('Doctor Recommendations', structured.recommendations || structured.recommendation);
      result += formatArray('Future Precautions', structured.precautions || structured.future_precautions);
    }

    if (!result.trim()) {
      if (structured && Object.keys(structured).length > 0) {
        if (structured.summary) return String(structured.summary);
        return `**Raw LLM Output:**\n\`\`\`json\n${JSON.stringify(structured, null, 2)}\n\`\`\``;
      }
      return 'No summary data extracted.';
    }

    return result.trim();
  }

  async generateSummary(text: string): Promise<string> {
    const structured = await this.generateStructuredSummary(text);
    return this.formatStructuredData(structured);
  }

  /**
   * Request a structured summary (attempt to parse JSON returned by the model).
   * Returns an object with optional fields: chief_complaint, duration, key_findings,
   * summary, important_readings, threats, recommendations, precautions
   */
  async generateStructuredSummary(text: string, options?: { allowLong?: boolean }): Promise<Record<string, any>> {
    console.log("LLM (Modal): Generating structured summary. Text length:", text.length);

    if (!text || !text.trim()) {
      throw new Error("No text provided for summarization");
    }

    // Explicitly prompt the modal to extract more fields
    const enhancedText = `${text}\n\n[INSTRUCTION ENFORCEMENT]: Also ensure the JSON response includes the following arrays of strings if found in the text: "important_readings", "threats", "precautions", and "recommendations". Focus on threatening readings and future precautions.`;

    const allowLong = !!options?.allowLong;

    let raw: string;
    try {
      raw = await this.requestSummary(enhancedText, "structured summary", "Failed to generate structured medical summary", allowLong);
    } catch (err) {
      console.error('Error generating structured summary via Modal (first attempt):', err);

      if (allowLong) {
        // If already in long mode, nothing else to try; fall back to heuristic
        console.log('Long request failed; falling back to heuristic fastSummarize');
        return this.fastSummarize(text);
      }

      // Try a reduced payload once (shorter) to increase chance of success
      try {
        const reduced = String(enhancedText || '').slice(0, 3000);
        console.log('Retrying LLM request with reduced payload (3000 chars)');
        raw = await this.requestSummary(reduced, "structured summary (retry)", "Failed to generate structured medical summary on retry", false);
      } catch (err2) {
        console.error('Retry also failed:', err2);
        console.log('Falling back to heuristic fastSummarize to provide immediate results');
        return this.fastSummarize(text);
      }
    }

    // requestSummary returns the raw summary string (usually data.summary). Try to parse JSON from it.
    const trimmed = raw.trim();

    // 1) direct JSON
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") return parsed as Record<string, any>;
    } catch (e) {
      // continue to next strategy
    }

    // 2) extract first JSON object in the text
    const jsonMatch = trimmed.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed && typeof parsed === "object") return parsed as Record<string, any>;
      } catch (e) {
        // fallthrough
      }
    }

    // 3) fallback: return as { summary: trimmed }
    return { summary: trimmed };
  }

  /**
   * Fast heuristic summarizer to return quick structured results for long documents.
   * This does not call the LLM and runs quickly on the server.
   */
  fastSummarize(text: string, maxFindings = 8): Record<string, any> {
    const lines = (text || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // find lines that look like test readings (contain digits or % or common units)
    const readingPattern = /\b\d+[.,]?\d*\b|%|mg\/dL|g\/dL|mmol\/L|IU\/L|IU|kU|mL|cm|mm|s|sec/iu;
    const candidateLines = lines.filter(l => readingPattern.test(l));

    // also include lines that contain known lab names even without explicit numbers
    const labKeywords = ['ptt', 'aptt', 'inr', 'hemoglobin', 'wbc', 'platelet', 'creatinine', 'glucose', 'sodium', 'potassium', 'bilirubin', 'alt', 'ast', 'crp', 'esr', 'ldh'];
    const keywordLines = lines.filter(l => labKeywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(l)));

    const combined = Array.from(new Set([...candidateLines, ...keywordLines]));

    const key_findings = combined.slice(0, maxFindings);

    const threats = key_findings.filter(l => /critical|high|low|abnormal|danger|prolong|increase|decrease|>|</i.test(l.toLowerCase()));

    // Extract a short comments block: top-most non-numeric, longer line(s) usually contain prescription comments
    const nonNumeric = lines.filter(l => !readingPattern.test(l));
    const comments = nonNumeric.slice(0, 2).join(' ');

    const summary = key_findings.length ? key_findings.join('\n') : (comments || lines.slice(0, 3).join('\n') || 'No discrete numeric readings found.');

    const resultObj: Record<string, any> = {
      method: 'heuristic',
      chief_complaint: nonNumeric[0] || '',
      comments,
      key_findings,
      important_readings: key_findings,
      threats: threats || [],
      recommendations: [],
      precautions: [],
      summary,
    };

    // Add the fully formatted markdown to the object as well
    resultObj.summaryMarkdown = this.formatStructuredData(resultObj);
    return resultObj;
  }

  /**
   * Generates aggregated summary across multiple documents.
   * This simply concatenates summaries and summarizes again.
   */
  async generateAggregateSummary(
    documents: Array<{ title?: string; summary: string }>
  ): Promise<string> {
    if (!documents?.length) {
      throw new Error("No document summaries provided for aggregation");
    }

    console.log(
      "LLM (Modal): Generating aggregate summary for document count:",
      documents.length
    );

    const combinedText = documents
      .map((entry, index) => {
        const heading = entry.title?.trim() || `Document ${index + 1}`;
        return `${heading}:\n${entry.summary}`;
      })
      .join("\n\n");

    return this.requestSummary(
      combinedText,
      "aggregate summary",
      "Failed to generate patient summary"
    );
  }

  /**
   * Internal method to call Modal endpoint
   */
  private async requestSummary(
    text: string,
    operation: string,
    failureMessage: string,
    allowLong?: boolean
  ): Promise<string> {
    try {
      console.log("Sending request to Modal:", this.modalUrl);

      // The model FastAPI expects a form field named `text` (Form(...)).
      // Use multipart/form-data (FormData) so we can also support images/pdf uploads later.
      const form = new FormData();
      form.append("text", text);

      // Add a timeout so the request does not hang for minutes. By default abort after 18s.
      // If allowLong is true (background long-running request), do not set a timeout (let it run).
      let response;
      if (allowLong) {
        response = await fetch(this.modalUrl, {
          method: "POST",
          body: form as any,
        });
      } else {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120_000);
        // When sending FormData, don't set Content-Type header so fetch will add the correct boundary.
        response = await fetch(this.modalUrl, {
          method: "POST",
          body: form as any,
          signal: controller.signal as any,
        }).finally(() => clearTimeout(timeout));
      }

      console.log("Modal response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Modal API error:", errorText);
        throw new Error(failureMessage);
      }

      const data = await response.json();

      if (!data?.summary) {
        throw new Error("Modal returned empty summary");
      }

      console.log(`LLM (${operation}): Summary generated successfully. Raw Output:`, data.summary);

      // Always return the raw summary string; higher layers will try to parse JSON if needed
      return String(data.summary).trim();
    } catch (error) {
      console.error(`Error generating ${operation} via Modal:`, error);
      throw new Error(failureMessage);
    }
  }
}