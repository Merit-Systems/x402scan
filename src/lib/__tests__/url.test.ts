import { describe, it, expect } from 'vitest';
import { getOriginFromUrl } from '../url';

describe('URL Utilities', () => {
  describe('getOriginFromUrl', () => {
    it('should extract origin from a simple URL', () => {
      const url = 'https://example.com/path/to/resource';
      expect(getOriginFromUrl(url)).toBe('https://example.com');
    });

    it('should extract origin with port', () => {
      const url = 'https://example.com:3000/api/endpoint';
      expect(getOriginFromUrl(url)).toBe('https://example.com:3000');
    });

    it('should handle HTTP protocol', () => {
      const url = 'http://example.com/page';
      expect(getOriginFromUrl(url)).toBe('http://example.com');
    });

    it('should handle URLs with query parameters', () => {
      const url = 'https://api.example.com/resource?foo=bar&baz=qux';
      expect(getOriginFromUrl(url)).toBe('https://api.example.com');
    });

    it('should handle URLs with hash fragments', () => {
      const url = 'https://example.com/page#section';
      expect(getOriginFromUrl(url)).toBe('https://example.com');
    });

    it('should throw error for invalid URL', () => {
      expect(() => getOriginFromUrl('not-a-valid-url')).toThrow();
    });

    it('should handle localhost URLs', () => {
      const url = 'http://localhost:3000/api';
      expect(getOriginFromUrl(url)).toBe('http://localhost:3000');
    });

    it('should handle IP address URLs', () => {
      const url = 'http://192.168.1.1:8080/endpoint';
      expect(getOriginFromUrl(url)).toBe('http://192.168.1.1:8080');
    });

    it('should preserve protocol in origin', () => {
      const httpsUrl = 'https://example.com/path';
      const httpUrl = 'http://example.com/path';
      
      expect(getOriginFromUrl(httpsUrl)).toBe('https://example.com');
      expect(getOriginFromUrl(httpUrl)).toBe('http://example.com');
    });
  });
});