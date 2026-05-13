import { describe, it, expect } from 'vitest';
import {
  decodeHtmlEntities,
  repairMojibake,
  cleanExternalText,
} from './utils';

describe('decodeHtmlEntities', () => {
  it('decodes named entities', () => {
    expect(decodeHtmlEntities('Developers &amp; AI Agents')).toBe(
      'Developers & AI Agents'
    );
    expect(decodeHtmlEntities('&lt;script&gt;')).toBe('<script>');
    expect(decodeHtmlEntities('He said &quot;hello&quot;')).toBe(
      'He said "hello"'
    );
    expect(decodeHtmlEntities('it&#39;s')).toBe("it's");
    expect(decodeHtmlEntities('it&apos;s')).toBe("it's");
  });

  it('decodes numeric decimal entities', () => {
    expect(decodeHtmlEntities('&#169; 2024')).toBe('© 2024');
    expect(decodeHtmlEntities('&#8212; dash')).toBe('— dash');
  });

  it('decodes numeric hex entities', () => {
    expect(decodeHtmlEntities('&#x27;')).toBe("'");
    expect(decodeHtmlEntities('&#xA9;')).toBe('©');
    expect(decodeHtmlEntities('&#x2014;')).toBe('—');
  });

  it('passes through strings without entities', () => {
    expect(decodeHtmlEntities('hello world')).toBe('hello world');
    expect(decodeHtmlEntities('')).toBe('');
  });

  it('handles multiple entities in one string', () => {
    expect(
      decodeHtmlEntities(
        'Orbis &mdash; API Marketplace for Developers &amp; AI Agents'
      )
    ).toBe('Orbis &mdash; API Marketplace for Developers & AI Agents');
    // Note: &mdash; is not in our entity list, so it stays as-is
  });

  it('decodes the Orbis title from scraper', () => {
    expect(
      decodeHtmlEntities(
        'Orbis — API Marketplace for Developers &amp; AI Agents'
      )
    ).toBe('Orbis — API Marketplace for Developers & AI Agents');
  });
});

describe('repairMojibake', () => {
  it('repairs UTF-8 middle dot decoded as Latin-1', () => {
    // · (U+00B7) in UTF-8 is 0xC2 0xB7, decoded as Latin-1 gives Â·
    expect(repairMojibake('\u00c2\u00b7')).toBe('·');
  });

  it('repairs UTF-8 em dash decoded as Latin-1', () => {
    // — (U+2014) in UTF-8 is 0xE2 0x80 0x94, decoded as Latin-1 gives â€"
    expect(repairMojibake('\u00e2\u0080\u0094')).toBe('—');
  });

  it('repairs UTF-8 en dash decoded as Latin-1', () => {
    expect(repairMojibake('\u00e2\u0080\u0093')).toBe('–');
  });

  it('repairs smart quotes', () => {
    expect(repairMojibake('\u00e2\u0080\u009c')).toBe('\u201c'); // "
    expect(repairMojibake('\u00e2\u0080\u009d')).toBe('\u201d'); // "
    expect(repairMojibake('\u00e2\u0080\u0099')).toBe('\u2019'); // '
  });

  it('repairs the OATP description pattern', () => {
    // Simulate: original "OATP · token_risk_scan —" got mojibake'd
    const original = 'OATP \u00b7 token_risk_scan \u2014 Analyze';
    const mojibake = Buffer.from(original, 'utf-8').toString('latin1');
    expect(repairMojibake(mojibake)).toBe(original);
  });

  it('passes through plain ASCII', () => {
    expect(repairMojibake('hello world')).toBe('hello world');
    expect(repairMojibake('')).toBe('');
  });

  it('passes through strings with chars above Latin-1 range', () => {
    // Strings with codepoints > 0xFF should not be touched
    const withEmoji = 'hello \ud83d\ude00';
    expect(repairMojibake(withEmoji)).toBe(withEmoji);

    const withCjk = 'hello \u4e16\u754c';
    expect(repairMojibake(withCjk)).toBe(withCjk);
  });

  it('does not corrupt legitimate accented text', () => {
    // Single high bytes that don't form valid UTF-8 should be left alone
    expect(repairMojibake('caf\u00e9')).toBe('caf\u00e9');
    expect(repairMojibake('na\u00efve')).toBe('na\u00efve');
    expect(repairMojibake('\u00fcber')).toBe('\u00fcber');
    expect(repairMojibake('r\u00e9sum\u00e9')).toBe('r\u00e9sum\u00e9');
  });

  it('is idempotent', () => {
    const original = 'OATP \u00b7 token_risk_scan \u2014';
    const mojibake = Buffer.from(original, 'utf-8').toString('latin1');
    const repaired = repairMojibake(mojibake);
    expect(repairMojibake(repaired)).toBe(repaired);
  });
});

describe('cleanExternalText', () => {
  it('handles mojibake + HTML entities together', () => {
    // Simulate a description with both issues: mojibake'd unicode AND &amp;
    const mojibakeWithEntity = Buffer.from(
      'Token \u00b7 scan \u2014 mint',
      'utf-8'
    ).toString('latin1');
    const input = mojibakeWithEntity + ' &amp; freeze';
    expect(cleanExternalText(input)).toBe('Token \u00b7 scan \u2014 mint & freeze');
  });

  it('handles only HTML entities', () => {
    expect(cleanExternalText('Developers &amp; AI Agents')).toBe(
      'Developers & AI Agents'
    );
  });

  it('handles only mojibake', () => {
    const mojibake = Buffer.from('hello \u00b7 world', 'utf-8').toString(
      'latin1'
    );
    expect(cleanExternalText(mojibake)).toBe('hello \u00b7 world');
  });

  it('passes through clean text', () => {
    expect(cleanExternalText('hello world')).toBe('hello world');
    expect(cleanExternalText('')).toBe('');
  });
});
