import type { JsonValue } from '@/lib/json';

/** A JSON-LD schema object. `undefined` values are dropped by JSON.stringify. */
type JsonLdObject = Record<string, JsonValue | undefined>;

interface JsonLdProps {
  data: JsonLdObject | JsonLdObject[];
}

// Emit one <script> per schema object. Some in-app browsers inject JSON-LD
// scanners that assume each ld+json block is a single object with "@context"
// and throw on a top-level array.
export function JsonLd({ data }: JsonLdProps) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}
