type Env = {
  HELIUS_API_KEY: string;
  CORS_ALLOW_ORIGIN?: string;
};

// Configuration - adjust as needed
const BUFFER_TIMEOUT_MS = 10000;
const KEEPALIVE_INTERVAL_MS = 20000;
const MAX_BUFFER_SIZE = 10;

const KEEPALIVE_MESSAGE = JSON.stringify({
  jsonrpc: '2.0',
  method: 'helius_keepalive',
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Validate required environment
    if (!env.HELIUS_API_KEY) {
      return new Response('Missing HELIUS_API_KEY', { status: 500 });
    }

    // CORS setup
    // If the request is an OPTIONS request, return a 200 response with permissive CORS headers
    // This is required for the Helius RPC Proxy to work from the browser and arbitrary origins
    // If you wish to restrict the origins that can access your Helius RPC Proxy, you can do so by
    // changing the `*` in the `Access-Control-Allow-Origin` header to a specific origin.
    // For example, if you wanted to allow requests from `https://example.com`, you would change the
    // header to `https://example.com`. Multiple domains are supported by verifying that the request
    // originated from one of the domains in the `CORS_ALLOW_ORIGIN` environment variable.
    const supportedDomains = env.CORS_ALLOW_ORIGIN?.trim()
      ? env.CORS_ALLOW_ORIGIN.split(',').map(d => d.trim())
      : undefined;
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (supportedDomains) {
      const origin = request.headers.get('Origin');
      if (origin && supportedDomains.includes(origin)) {
        corsHeaders['Access-Control-Allow-Origin'] = origin;
      }
    } else {
      corsHeaders['Access-Control-Allow-Origin'] = '*';
    }

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // WebSocket handling
    const upgrade = request.headers.get('Upgrade')?.toLowerCase();
    if (upgrade === 'websocket') {
      return handleWebSocket(request, env, corsHeaders);
    }

    // HTTP RPC proxy
    return handleRPC(request, env, corsHeaders);
  },
};

function handleWebSocket(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Response {
  const { search } = new URL(request.url);
  const upstreamUrl = `wss://mainnet.helius-rpc.com${search ? `${search}&` : '?'}api-key=${
    env.HELIUS_API_KEY
  }`;

  // Extract subprotocol
  const clientProtocols = request.headers.get('Sec-WebSocket-Protocol');
  const selectedProtocol = clientProtocols?.split(',')[0]?.trim();

  // Create WebSocket pair
  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);
  if (!server) {
    return new Response('Internal Server Error', { status: 500 });
  }
  server.accept();

  // Connect upstream
  const upstream = selectedProtocol
    ? new WebSocket(upstreamUrl, [selectedProtocol])
    : new WebSocket(upstreamUrl);

  // Message buffering for race condition fix
  let bufferedData: (string | ArrayBuffer)[] = [];
  let bufferTimeout: ReturnType<typeof setTimeout> | null = null;
  let isUpstreamConnected = false;

  // Keepalive management
  let keepaliveTimer: ReturnType<typeof setInterval> | null = null;

  const startKeepalive = () => {
    keepaliveTimer = setInterval(() => {
      if (upstream.readyState === WebSocket.OPEN) {
        try {
          upstream.send(KEEPALIVE_MESSAGE);
        } catch {
          clearKeepalive();
        }
      } else {
        clearKeepalive();
      }
    }, KEEPALIVE_INTERVAL_MS);
  };

  const clearKeepalive = () => {
    if (keepaliveTimer) {
      clearInterval(keepaliveTimer);
      keepaliveTimer = null;
    }
  };

  const clearBufferTimeout = () => {
    if (bufferTimeout) {
      clearTimeout(bufferTimeout);
      bufferTimeout = null;
    }
  };

  const startBufferTimeout = () => {
    clearBufferTimeout();
    bufferTimeout = setTimeout(() => {
      if (bufferedData.length > 0 && !isUpstreamConnected) {
        bufferedData = [];
        try {
          server.close(1011, 'upstream_connection_timeout');
        } catch {
          // ignore
        }
      }
    }, BUFFER_TIMEOUT_MS);
  };

  const cleanup = () => {
    clearKeepalive();
    clearBufferTimeout();
    bufferedData = [];
  };

  // Upstream connection open
  upstream.addEventListener('open', () => {
    isUpstreamConnected = true;
    clearBufferTimeout();

    // Send buffered messages
    if (bufferedData.length > 0) {
      try {
        for (const data of bufferedData) {
          upstream.send(data);
        }
        bufferedData = [];
      } catch {
        cleanup();
        try {
          server.close(1011, 'upstream_ws_error');
        } catch {
          // ignore
        }
        return;
      }
    }
    startKeepalive();
  });

  // Client to upstream forwarding
  server.addEventListener('message', event => {
    if (isUpstreamConnected && upstream.readyState === WebSocket.OPEN) {
      try {
        upstream.send(event.data as string | ArrayBuffer);
      } catch {
        cleanup();
        try {
          server.close(1011, 'upstream_ws_error');
        } catch {
          // ignore
        }
      }
    } else {
      // Buffer with size limit
      if (bufferedData.length >= MAX_BUFFER_SIZE) {
        cleanup();
        try {
          server.close(1011, 'buffer_overflow');
        } catch {
          // ignore
        }
        return;
      }

      if (bufferedData.length === 0) {
        startBufferTimeout();
      }
      bufferedData.push(event.data as string | ArrayBuffer);
    }
  });

  // Upstream to client forwarding
  upstream.addEventListener('message', event => {
    if (server.readyState === WebSocket.OPEN) {
      try {
        server.send(event.data as string | ArrayBuffer);
      } catch {
        cleanup();
        try {
          upstream.close(1011, 'client_ws_error');
        } catch {
          // ignore
        }
      }
    }
  });

  // Connection close handling
  server.addEventListener('close', () => {
    cleanup();
    try {
      upstream.close();
    } catch {
      // ignore
    }
  });

  upstream.addEventListener('close', () => {
    isUpstreamConnected = false;
    cleanup();
    try {
      server.close();
    } catch {
      // ignore
    }
  });

  // Error handling
  server.addEventListener('error', () => {
    cleanup();
    try {
      upstream.close(1011, 'client_ws_error');
    } catch {
      // ignore
    }
  });

  upstream.addEventListener('error', () => {
    isUpstreamConnected = false;
    cleanup();
    try {
      server.close(1011, 'upstream_ws_error');
    } catch {
      // ignore
    }
  });

  // Response
  const responseHeaders: Record<string, string> = { ...corsHeaders };
  if (selectedProtocol) {
    responseHeaders['Sec-WebSocket-Protocol'] = selectedProtocol;
  }

  return new Response(null, {
    status: 101,
    webSocket: client,
    headers: responseHeaders,
  });
}

async function handleRPC(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { pathname, search } = new URL(request.url);
    const payload = await request.text();

    // Determine target endpoint
    const targetHost =
      pathname === '/' ? 'mainnet.helius-rpc.com' : 'api.helius.xyz';
    const targetUrl = `https://${targetHost}${pathname}?api-key=${env.HELIUS_API_KEY}${
      search ? `&${search.slice(1)}` : ''
    }`;

    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      body: payload || null,
      headers: {
        'Content-Type': 'application/json',
        'X-Helius-Cloudflare-Proxy': 'true',
      },
    });

    const response = await fetch(proxyRequest);

    return new Response(response.body, {
      status: response.status,
      headers: corsHeaders,
    });
  } catch {
    return new Response('Proxy Error', {
      status: 502,
      headers: corsHeaders,
    });
  }
}
