import { describe, it, expect } from 'vitest';
import {
  facilitators,
  facilitatorNameMap,
  facilitatorIdMap,
  facilitatorAddressMap,
  type Facilitator,
  type FacilitatorName,
} from '../facilitators';

describe('Facilitators Module', () => {
  describe('facilitators array', () => {
    it('should contain at least one facilitator', () => {
      expect(facilitators.length).toBeGreaterThan(0);
    });

    it('should have unique IDs', () => {
      const ids = facilitators.map(f => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique names', () => {
      const names = facilitators.map(f => f.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have valid structure for each facilitator', () => {
      facilitators.forEach(facilitator => {
        expect(facilitator).toHaveProperty('id');
        expect(facilitator).toHaveProperty('name');
        expect(facilitator).toHaveProperty('image');
        expect(facilitator).toHaveProperty('link');
        expect(facilitator).toHaveProperty('addresses');
        expect(facilitator).toHaveProperty('color');

        // Type checks
        expect(typeof facilitator.id).toBe('string');
        expect(typeof facilitator.name).toBe('string');
        expect(typeof facilitator.image).toBe('string');
        expect(typeof facilitator.link).toBe('string');
        expect(Array.isArray(facilitator.addresses)).toBe(true);
        expect(typeof facilitator.color).toBe('string');
      });
    });

    it('should have non-empty addresses array for each facilitator', () => {
      facilitators.forEach(facilitator => {
        expect(facilitator.addresses.length).toBeGreaterThan(0);
      });
    });

    it('should have valid Ethereum addresses', () => {
      const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
      
      facilitators.forEach(facilitator => {
        facilitator.addresses.forEach(address => {
          expect(address).toMatch(ethereumAddressRegex);
        });
      });
    });

    it('should have valid image paths', () => {
      facilitators.forEach(facilitator => {
        expect(facilitator.image).toMatch(/^\//);
        expect(facilitator.image).toMatch(/\.(png|jpg|jpeg|svg|webp)$/i);
      });
    });

    it('should have valid URLs for links', () => {
      facilitators.forEach(facilitator => {
        expect(() => new URL(facilitator.link)).not.toThrow();
        expect(facilitator.link).toMatch(/^https?:\/\//);
      });
    });
  });

  describe('facilitatorNameMap', () => {
    it('should be a Map instance', () => {
      expect(facilitatorNameMap).toBeInstanceOf(Map);
    });

    it('should have correct size', () => {
      expect(facilitatorNameMap.size).toBe(facilitators.length);
    });

    it('should correctly map names to facilitators', () => {
      facilitators.forEach(facilitator => {
        const mapped = facilitatorNameMap.get(facilitator.name as FacilitatorName);
        expect(mapped).toBeDefined();
        expect(mapped?.id).toBe(facilitator.id);
      });
    });
  });

  describe('facilitatorAddressMap', () => {
    it('should correctly map addresses to facilitators', () => {
      facilitators.forEach(facilitator => {
        facilitator.addresses.forEach(address => {
          const mapped = facilitatorAddressMap.get(address);
          expect(mapped).toBeDefined();
          expect(mapped?.id).toBe(facilitator.id);
        });
      });
    });
  });
});