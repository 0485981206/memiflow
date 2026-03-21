import * as pdfjsLib from 'pdfjs-dist';
import { Tesseract } from 'tesseract.js';

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    
    // Convert page to canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
    
    // Run OCR on canvas image
    const imageData = canvas.toDataURL('image/png');
    const result = await Tesseract.recognize(imageData, 'nld', {
      logger: (m) => console.log('OCR progress:', m.progress),
    });
    
    fullText += result.data.text + '\n---PAGE BREAK---\n';
  }
  
  return fullText;
}

export function parsePrestatiesFromText(text) {
  // Extract dates, employee names, hours, codes from OCR text
  // Returns array of prestatie objects
  const prestaties = [];
  
  // Regex patterns
  const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g;
  const hoursPattern = /(\d+[.,]\d{1,2}|\d+)\s*(uur|h|hrs)/i;
  const namePattern = /([A-Z][a-z]+\s+[A-Z][a-z]+)/g;
  
  const lines = text.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const dates = line.match(datePattern);
    const hours = line.match(hoursPattern);
    const names = line.match(namePattern);
    
    if (dates && hours && names) {
      prestaties.push({
        datum: dates[0],
        werknemer_naam: names[0],
        uren: parseFloat(hours[1].replace(',', '.')),
        opmerking: line,
      });
    }
  }
  
  return prestaties;
}