/**
 * Normalize and validate URLs
 */

export function normalizeUrl(input: string): string {
  let url = input.trim();
  
  // Remove leading/trailing whitespace
  url = url.trim();
  
  // If empty, return as-is
  if (!url) return url;
  
  // If it already has a protocol, validate it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Remove www. prefix temporarily
  const hasWww = url.startsWith('www.');
  if (hasWww) {
    url = url.substring(4);
  }
  
  // Add https:// prefix (default to secure)
  url = 'https://' + (hasWww ? 'www.' : '') + url;
  
  // Validate URL format
  try {
    new URL(url);
    return url;
  } catch {
    // If invalid, try adding www.
    try {
      url = 'https://www.' + input.trim();
      new URL(url);
      return url;
    } catch {
      // Return original if still invalid
      return input;
    }
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

export function cleanUrlForDisplay(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
