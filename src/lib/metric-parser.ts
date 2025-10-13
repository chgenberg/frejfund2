/**
 * Metric Parser
 * Extracts structured metrics from user chat responses
 */

export interface ExtractedMetric {
  type: 'cac' | 'ltv' | 'churn' | 'revenue' | 'growth' | 'retention' | 'burn' | 'mrr' | 'arr' | 'other';
  value: number;
  unit?: string;
  rawText: string;
  confidence: number;
  relatedDimensions: string[];
}

export function parseMetricsFromText(text: string): ExtractedMetric[] {
  const metrics: ExtractedMetric[] = [];
  const lowercaseText = text.toLowerCase();

  // CAC patterns
  const cacPatterns = [
    /cac\s*(?:is|=|:)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /customer acquisition cost\s*(?:is|=|:)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /cost per customer\s*(?:is|=|:)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i
  ];
  
  for (const pattern of cacPatterns) {
    const match = text.match(pattern);
    if (match) {
      metrics.push({
        type: 'cac',
        value: parseFloat(match[1].replace(/,/g, '')),
        unit: 'USD',
        rawText: match[0],
        confidence: 0.9,
        relatedDimensions: ['Unit Economics', 'Customer Acquisition Cost', 'Customer Acquisition Strategy']
      });
    }
  }

  // LTV patterns
  const ltvPatterns = [
    /ltv\s*(?:is|=|:)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /lifetime value\s*(?:is|=|:)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /customer lifetime value\s*(?:is|=|:)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i
  ];
  
  for (const pattern of ltvPatterns) {
    const match = text.match(pattern);
    if (match) {
      metrics.push({
        type: 'ltv',
        value: parseFloat(match[1].replace(/,/g, '')),
        unit: 'USD',
        rawText: match[0],
        confidence: 0.9,
        relatedDimensions: ['Unit Economics', 'Revenue Model Clarity']
      });
    }
  }

  // Churn patterns
  const churnPatterns = [
    /churn\s*(?:rate|is)?\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)\s*%/i,
    /(\d+(?:\.\d+)?)\s*%\s*churn/i,
    /losing\s*(\d+(?:\.\d+)?)\s*%\s*(?:of)?\s*customers/i
  ];
  
  for (const pattern of churnPatterns) {
    const match = text.match(pattern);
    if (match) {
      metrics.push({
        type: 'churn',
        value: parseFloat(match[1]),
        unit: 'percent',
        rawText: match[0],
        confidence: 0.85,
        relatedDimensions: ['Retention & Churn', 'Customer Retention', 'Churn Analysis']
      });
    }
  }

  // Revenue patterns (MRR/ARR)
  const mrrPatterns = [
    /mrr\s*(?:is|=|:)?\s*\$?(\d+(?:,\d{3})*(?:k|K)?)/i,
    /monthly (?:recurring )?revenue\s*(?:is|=|:)?\s*\$?(\d+(?:,\d{3})*(?:k|K)?)/i
  ];
  
  for (const pattern of mrrPatterns) {
    const match = text.match(pattern);
    if (match) {
      let value = parseFloat(match[1].replace(/,/g, ''));
      if (match[1].toLowerCase().includes('k')) {
        value *= 1000;
      }
      metrics.push({
        type: 'mrr',
        value,
        unit: 'USD',
        rawText: match[0],
        confidence: 0.9,
        relatedDimensions: ['Revenue', 'Revenue Growth Rate', 'Revenue Predictability']
      });
    }
  }

  // Growth patterns
  const growthPatterns = [
    /(?:growth|growing)\s*(?:at|by|is)?\s*(\d+(?:\.\d+)?)\s*%/i,
    /(\d+(?:\.\d+)?)\s*%\s*(?:monthly|month-over-month|mom|m\/m)\s*growth/i
  ];
  
  for (const pattern of growthPatterns) {
    const match = text.match(pattern);
    if (match) {
      metrics.push({
        type: 'growth',
        value: parseFloat(match[1]),
        unit: 'percent',
        rawText: match[0],
        confidence: 0.8,
        relatedDimensions: ['Revenue Growth Rate', 'User/Customer Growth', 'Growth Drivers']
      });
    }
  }

  // Retention patterns
  const retentionPatterns = [
    /retention\s*(?:rate|is)?\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)\s*%/i,
    /(\d+(?:\.\d+)?)\s*%\s*(?:of)?\s*customers\s*stay/i,
    /keeping\s*(\d+(?:\.\d+)?)\s*%/i
  ];
  
  for (const pattern of retentionPatterns) {
    const match = text.match(pattern);
    if (match) {
      metrics.push({
        type: 'retention',
        value: parseFloat(match[1]),
        unit: 'percent',
        rawText: match[0],
        confidence: 0.85,
        relatedDimensions: ['Customer Retention', 'Retention & Churn']
      });
    }
  }

  // Burn rate patterns
  const burnPatterns = [
    /burn(?:ing)?\s*(?:rate|is)?\s*(?:is|=|:)?\s*\$?(\d+(?:,\d{3})*(?:k|K)?)/i,
    /spending\s*\$?(\d+(?:,\d{3})*(?:k|K)?)\s*(?:per month|monthly|\/month)/i
  ];
  
  for (const pattern of burnPatterns) {
    const match = text.match(pattern);
    if (match) {
      let value = parseFloat(match[1].replace(/,/g, ''));
      if (match[1].toLowerCase().includes('k')) {
        value *= 1000;
      }
      metrics.push({
        type: 'burn',
        value,
        unit: 'USD',
        rawText: match[0],
        confidence: 0.85,
        relatedDimensions: ['Runway & Burn Rate', 'Burn Rate', 'Financial Health']
      });
    }
  }

  return metrics;
}

/**
 * Update businessInfo with extracted metrics
 */
export function mergeMetricsIntoBusinessInfo(businessInfo: any, metrics: ExtractedMetric[]): any {
  const updated = { ...businessInfo };

  for (const metric of metrics) {
    switch (metric.type) {
      case 'cac':
        updated.cac = metric.value;
        break;
      case 'ltv':
        updated.ltv = metric.value;
        break;
      case 'churn':
        updated.churnRate = metric.value;
        break;
      case 'mrr':
        updated.monthlyRevenue = metric.value;
        break;
      case 'growth':
        updated.growthRate = metric.value;
        break;
      case 'retention':
        updated.retentionRate = metric.value;
        break;
      case 'burn':
        updated.burnRate = metric.value;
        break;
    }
  }

  return updated;
}

