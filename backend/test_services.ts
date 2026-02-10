import { OCRService } from './src/utils/ocr.service';
import { LLMService } from './src/services/llm.service';

async function testOCR() {
  console.log('Testing OCR Service...');
  try {
    // Use a sample image URL (replace with actual medical image if available)
    const text = await OCRService.extractText('https://example.com/sample.jpg'); // Replace with real URL
    console.log('Extracted text:', text);
  } catch (error) {
    console.error('OCR test failed:', error);
  }
}

async function testLLM() {
  console.log('Testing LLM Service...');
  try {
    const llmService = new LLMService();
    const summary = await llmService.generateSummary('Patient has high blood pressure. Medication: Lisinopril 10mg daily.');
    console.log('Generated summary:', summary);
  } catch (error) {
    console.error('LLM test failed:', error);
  }
}

testOCR();
testLLM();
