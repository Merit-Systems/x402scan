interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
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
