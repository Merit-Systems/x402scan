import { NextResponse } from "next/server";

const PORT = process.env.PORT || 3200;

export async function POST(request) {
  const payment = request.headers.get("x-payment");
  if (!payment) {
    return NextResponse.json(
      {
        x402Version: 2,
        error: "Payment Required",
        resource: {
          url: `http://localhost:${PORT}/api/search`,
          description: "Search for entities by keyword",
          mimeType: "application/json",
        },
        accepts: [
          {
            scheme: "exact",
            network: "eip155:8453",
            asset: "USDC",
            amount: "0.02",
            payTo: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
            maxTimeoutSeconds: 300,
            extra: {},
          },
        ],
      },
      { status: 402 }
    );
  }

  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    results: [
      { id: 1, name: body.query || "example result", score: 0.95 },
    ],
  });
}
