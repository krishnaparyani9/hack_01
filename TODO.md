# TODO: Implement LLM-based Medical Document Summarization Pipeline

## Steps to Complete
- [x] Update package.json to add dependencies: tesseract.js, openai, pdf-parse
- [x] Update document.model.ts to add a 'summary' field (string) for storing AI-generated summaries
- [x] Create src/utils/ocr.service.ts: Service to extract text from images (JPG/PNG) using Tesseract.js, and from PDFs using pdf-parse (for text-based PDFs) or fallback to OCR if scanned
- [x] Create src/services/llm.service.ts: Service to send cleaned text to OpenAI API with a prompt for summarization, returning structured bullet points (diagnoses, abnormal labs, medications, alerts)
- [x] Add a new controller in document.controller.ts: summarizeDocumentController, which fetches the document, extracts text, cleans it, summarizes via LLM, and updates the document with the summary
- [x] Update document.routes.ts to add a new route: POST /documents/:id/summarize (requires auth, allows patients/doctors to trigger summarization on their documents)
- [x] Install new dependencies
- [x] Test the summarization route with sample documents
- [x] Ensure prompt engineering strictly follows requirements (no new diagnoses, only from text)
