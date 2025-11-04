import { JsonViewer } from '@/components/ai-elements/json-viewer';

import type { X402FetchResponse } from '@/app/_hooks/x402/types';
import type { JsonValue } from '@/components/ai-elements/json-viewer';

interface Props {
  error: Error | null;
  response: X402FetchResponse | undefined;
}

export const X402FetchResult: React.FC<Props> = ({ error, response }) => {
  return (
    <>
      {/* Error and response display */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-3 rounded-md">
          {error.message}
        </p>
      )}

      {response && (
        <pre className="max-h-60 overflow-auto rounded-md bg-muted text-xs">
          {response.type === 'json' ? (
            <JsonViewer data={response.data as JsonValue} />
          ) : (
            <pre className="max-h-60 overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          )}
        </pre>
      )}
    </>
  );
};
