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
  // Decide if input looks like a domain (requires a dot and TLD)
  const hasWww = url.toLowerCase().startsWith('www.');
  const candidateHost = hasWww ? url.substring(4) : url;
  const looksLikeDomain = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(candidateHost);
  if (!looksLikeDomain) {
    // Keep raw input while typing (avoid turning "www." into "https://www.")
    return input;
  }

  // Add https:// prefix (default secure) and revalidate
  const normalized = 'https://' + (hasWww ? 'www.' : '') + candidateHost;
  try {
    new URL(normalized);
    return normalized;
  } catch {
    return input;
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
