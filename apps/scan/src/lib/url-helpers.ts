/**
 * Checks if a URL points to a local/private address that won't be accessible
 * from production environments.
 */
export function isLocalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Check for localhost variants
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local')
    ) {
      return true;
    }

    // Check for private IP ranges
    // 192.168.0.0/16
    if (/^192\.168\.\d+\.\d+$/.exec(hostname)) {
      return true;
    }

    // 10.0.0.0/8
    if (/^10\.\d+\.\d+\.\d+$/.exec(hostname)) {
      return true;
    }

    // 172.16.0.0/12
    if (/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.exec(hostname)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Extracts the port number from a URL, with sensible defaults.
 */
export function extractPort(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.port) {
      return parsed.port;
    }
    // Return default ports for common protocols
    if (parsed.protocol === 'https:') {
      return '443';
    }
    if (parsed.protocol === 'http:') {
      return '80';
    }
    return null;
  } catch {
    return null;
  }
}
