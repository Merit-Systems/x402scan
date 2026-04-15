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
          url: `http://localhost:${PORT}/api/summarize`,
          description: "Summarize a document or URL",
          mimeType: "application/json",
        },
        accepts: [
          {
            scheme: "exact",
            network: "eip155:8453",
            asset: "USDC",
            amount: "0.03",
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
    summary: `Summary of: ${body.url || body.text || "nothing"}`,
    wordCount: 42,
  });
}
