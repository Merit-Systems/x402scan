/**
 * Checks if a URL points to a local/private address that won't be accessible
 * from production environments.
 */
export function isLocalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

    if (
      hostname === 'localhost' ||
      hostname === '::1' ||
      hostname === '::' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.localhost')
    ) {
      return true;
    }

    if (
      hostname.startsWith('fc') ||
      hostname.startsWith('fd') ||
      hostname.startsWith('fe80:')
    ) {
      return true;
    }

    const ipv4Parts = hostname.split('.').map(part => Number(part));
    if (
      ipv4Parts.length !== 4 ||
      ipv4Parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)
    ) {
      return false;
    }

    const a = ipv4Parts[0]!;
    const b = ipv4Parts[1]!;

    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
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
