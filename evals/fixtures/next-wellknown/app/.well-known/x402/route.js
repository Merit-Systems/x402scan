import { NextResponse } from "next/server";

// Broken attempt - dev copied format from somewhere wrong
export async function GET() {
  return NextResponse.json({
    version: 2,
    endpoints: [
      { path: "/api/search", method: "POST", cost: "$0.02" },
      { path: "/api/summarize", method: "POST", cost: "$0.03" },
    ],
  });
}
