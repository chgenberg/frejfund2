/**
 * PDF OCR - Extract text and metrics from pitch deck slides
 * Uses Tesseract.js for OCR on PDF pages converted to images
 */

import { createWorker } from 'tesseract.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

interface OCRMetrics {
  cac?: number;
  ltv?: number;
  churn?: number;
  mrr?: number;
  arr?: number;
  customers?: number;
  revenue?: number;
  growth?: number;
  burnRate?: number;
  runway?: number;
}

interface OCRResult {
  text: string;
  metrics: OCRMetrics;
  confidence: number;
}

/**
 * Extract metrics from text using regex patterns
 */
function extractMetrics(text: string): OCRMetrics {
  const metrics: OCRMetrics = {};
  const normalizedText = text.toLowerCase();

  // CAC patterns: "CAC: $50", "Customer Acquisition Cost $50", "CAC $50"
  const cacMatch = normalizedText.match(/(?:cac|customer acquisition cost)[\s:]*\$?([0-9,]+)/i);
  if (cacMatch) {
    metrics.cac = parseFloat(cacMatch[1].replace(/,/g, ''));
  }

  // LTV patterns: "LTV: $500", "Lifetime Value $500", "LTV $500"
  const ltvMatch = normalizedText.match(/(?:ltv|lifetime value|customer lifetime value)[\s:]*\$?([0-9,]+)/i);
  if (ltvMatch) {
    metrics.ltv = parseFloat(ltvMatch[1].replace(/,/g, ''));
  }

  // Churn patterns: "Churn: 2%", "Churn Rate 2%", "2% churn"
  const churnMatch = normalizedText.match(/(?:churn|churn rate)[\s:]*([0-9.]+)%?/i) ||
                      normalizedText.match(/([0-9.]+)%?\s*churn/i);
  if (churnMatch) {
    metrics.churn = parseFloat(churnMatch[1]);
  }

  // MRR patterns: "MRR: $50k", "Monthly Recurring Revenue $50,000"
  const mrrMatch = normalizedText.match(/(?:mrr|monthly recurring revenue)[\s:]*\$?([0-9,.]+)([km])?/i);
  if (mrrMatch) {
    let value = parseFloat(mrrMatch[1].replace(/,/g, ''));
    if (mrrMatch[2]?.toLowerCase() === 'k') value *= 1000;
    if (mrrMatch[2]?.toLowerCase() === 'm') value *= 1000000;
    metrics.mrr = value;
  }

  // ARR patterns: "ARR: $600k", "Annual Recurring Revenue $600,000"
  const arrMatch = normalizedText.match(/(?:arr|annual recurring revenue)[\s:]*\$?([0-9,.]+)([km])?/i);
  if (arrMatch) {
    let value = parseFloat(arrMatch[1].replace(/,/g, ''));
    if (arrMatch[2]?.toLowerCase() === 'k') value *= 1000;
    if (arrMatch[2]?.toLowerCase() === 'm') value *= 1000000;
    metrics.arr = value;
  }

  // Customers: "10,000 customers", "Customers: 10k"
  const customersMatch = normalizedText.match(/([0-9,.]+)([km])?\s*(?:customers|users|active users)/i) ||
                          normalizedText.match(/(?:customers|users|active users)[\s:]*([0-9,.]+)([km])?/i);
  if (customersMatch) {
    let value = parseFloat(customersMatch[1].replace(/,/g, ''));
    if (customersMatch[2]?.toLowerCase() === 'k') value *= 1000;
    if (customersMatch[2]?.toLowerCase() === 'm') value *= 1000000;
    metrics.customers = value;
  }

  // Revenue: "Revenue: $1.2M", "$1,200,000 revenue"
  const revenueMatch = normalizedText.match(/(?:revenue|sales)[\s:]*\$?([0-9,.]+)([km])?/i) ||
                        normalizedText.match(/\$([0-9,.]+)([km])?\s*(?:revenue|sales)/i);
  if (revenueMatch) {
    let value = parseFloat(revenueMatch[1].replace(/,/g, ''));
    if (revenueMatch[2]?.toLowerCase() === 'k') value *= 1000;
    if (revenueMatch[2]?.toLowerCase() === 'm') value *= 1000000;
    metrics.revenue = value;
  }

  // Growth: "300% YoY growth", "Growing 3x"
  const growthMatch = normalizedText.match(/([0-9.]+)%?\s*(?:yoy|year over year|growth)/i) ||
                       normalizedText.match(/growing?\s*([0-9.]+)x/i);
  if (growthMatch) {
    metrics.growth = parseFloat(growthMatch[1]);
  }

  // Burn Rate: "Burn: $50k/month", "Burn rate $50,000"
  const burnMatch = normalizedText.match(/(?:burn|burn rate|monthly burn)[\s:]*\$?([0-9,.]+)([km])?/i);
  if (burnMatch) {
    let value = parseFloat(burnMatch[1].replace(/,/g, ''));
    if (burnMatch[2]?.toLowerCase() === 'k') value *= 1000;
    if (burnMatch[2]?.toLowerCase() === 'm') value *= 1000000;
    metrics.burnRate = value;
  }

  // Runway: "18 months runway", "Runway: 12 months"
  const runwayMatch = normalizedText.match(/(?:runway)[\s:]*([0-9.]+)\s*months?/i) ||
                       normalizedText.match(/([0-9.]+)\s*months?\s*runway/i);
  if (runwayMatch) {
    metrics.runway = parseFloat(runwayMatch[1]);
  }

  return metrics;
}

/**
 * Perform OCR on a single image buffer
 */
async function ocrImage(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  const worker = await createWorker('eng', 1, {
    logger: () => {}, // Suppress logs
  });

  try {
    const { data } = await worker.recognize(imageBuffer);
    await worker.terminate();
    
    return {
      text: data.text,
      confidence: data.confidence,
    };
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}

/**
 * Convert PDF to images and perform OCR on each page
 * This is a simplified version - in production you'd use pdf-poppler or similar
 */
async function pdfToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
  // For now, we'll use pdf-parse to extract text directly
  // In a future iteration, we can add proper PDF-to-image conversion
  // using pdf-poppler or pdf.js
  
  // This is a placeholder - actual PDF to image conversion would go here
  // For now, we'll just return the PDF as a single "image" for text extraction
  return [pdfBuffer];
}

/**
 * Extract text and metrics from PDF using OCR
 */
export async function extractPDFMetrics(pdfBuffer: Buffer, filename?: string): Promise<OCRResult> {
  console.log(`📄 Starting OCR extraction for ${filename || 'PDF'}...`);

  try {
    // First try standard PDF text extraction (faster, no OCR needed)
    const pdfParse = (await import('pdf-parse')).default;
    const pdfData = await pdfParse(pdfBuffer);
    
    if (pdfData.text && pdfData.text.length > 100) {
      console.log(`✓ Extracted ${pdfData.text.length} chars via standard PDF parsing`);
      const metrics = extractMetrics(pdfData.text);
      
      return {
        text: pdfData.text,
        metrics,
        confidence: 95, // High confidence for native text extraction
      };
    }

    console.log('⚠️  PDF has little text, falling back to OCR...');

    // Fallback to OCR for scanned PDFs or images
    const images = await pdfToImages(pdfBuffer);
    let allText = '';
    let totalConfidence = 0;

    for (let i = 0; i < Math.min(images.length, 20); i++) {
      // Limit to first 20 pages to avoid long processing
      console.log(`OCR processing page ${i + 1}/${images.length}...`);
      const result = await ocrImage(images[i]);
      allText += result.text + '\n\n';
      totalConfidence += result.confidence;
    }

    const avgConfidence = totalConfidence / Math.min(images.length, 20);
    const metrics = extractMetrics(allText);

    console.log(`✓ OCR complete: ${allText.length} chars, ${Object.keys(metrics).length} metrics found`);

    return {
      text: allText,
      metrics,
      confidence: avgConfidence,
    };
  } catch (error) {
    console.error('PDF OCR extraction failed:', error);
    return {
      text: '',
      metrics: {},
      confidence: 0,
    };
  }
}

/**
 * Smart metrics extraction from pitch deck
 * Focuses on key financial slides
 */
export async function extractPitchDeckMetrics(pdfBuffer: Buffer, filename?: string): Promise<{
  metrics: OCRMetrics;
  fullText: string;
  confidence: number;
  summary: string;
}> {
  const result = await extractPDFMetrics(pdfBuffer, filename);

  // Generate a summary of found metrics
  const foundMetrics = Object.keys(result.metrics).filter(k => result.metrics[k as keyof OCRMetrics] !== undefined);
  const summary = foundMetrics.length > 0
    ? `Found ${foundMetrics.length} metrics: ${foundMetrics.join(', ')}`
    : 'No metrics found in pitch deck';

  return {
    metrics: result.metrics,
    fullText: result.text,
    confidence: result.confidence,
    summary,
  };
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: OCRMetrics): string {
  const lines: string[] = [];

  if (metrics.cac) lines.push(`CAC: $${metrics.cac.toLocaleString()}`);
  if (metrics.ltv) lines.push(`LTV: $${metrics.ltv.toLocaleString()}`);
  if (metrics.churn) lines.push(`Churn: ${metrics.churn}%`);
  if (metrics.mrr) lines.push(`MRR: $${metrics.mrr.toLocaleString()}`);
  if (metrics.arr) lines.push(`ARR: $${metrics.arr.toLocaleString()}`);
  if (metrics.customers) lines.push(`Customers: ${metrics.customers.toLocaleString()}`);
  if (metrics.revenue) lines.push(`Revenue: $${metrics.revenue.toLocaleString()}`);
  if (metrics.growth) lines.push(`Growth: ${metrics.growth}%`);
  if (metrics.burnRate) lines.push(`Burn Rate: $${metrics.burnRate.toLocaleString()}/mo`);
  if (metrics.runway) lines.push(`Runway: ${metrics.runway} months`);

  return lines.join('\n');
}

