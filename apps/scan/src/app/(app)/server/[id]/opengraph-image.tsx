import {
  MeritOpenGraphMark,
  OpenGraphDescription,
  OpenGraphExternalImage,
  OpenGraphHeader,
  OpenGraphImage,
  OpenGraphTitle,
  openGraphImageSize,
} from "@merit-systems/brand/opengraph";
import { loadOpenGraphFonts } from "@merit-systems/brand/opengraph/node";
import { ImageResponse } from "next/og";

import { formatTokenAmount } from "@/lib/token";
import {
  cleanExternalText,
  formatNumber,
  truncateAtDelimiter,
} from "@/lib/utils";
import { api } from "@/trpc/server";
import { ActivityTimeframe } from "@/types/timeframes";

export const contentType = "image/png";
export const size = openGraphImageSize;
export const runtime = "nodejs";

interface ServerOpenGraphImageProps {
  params: Promise<{ id: string }>;
}

export default async function ServerOpenGraphImage({
  params,
}: ServerOpenGraphImageProps) {
  const { id } = await params;
  const [origin, statistics] = await Promise.all([
    api.public.origins.get(id),
    api.public.stats.overallByOrigin({
      originId: id,
      timeframe: ActivityTimeframe.AllTime,
    }),
  ]);

  if (!origin) {
    throw new Error("Server not found");
  }

  const rawTitle = origin.title
    ? cleanExternalText(origin.title)
    : new URL(origin.origin).hostname;
  const title = truncateAtDelimiter(rawTitle);
  const description = origin.description
    ? cleanExternalText(origin.description)
    : `Explore ${title} on x402scan`;

  return new ImageResponse(
    <OpenGraphImage
      style={{
        // Satori does not resolve the browser CSS variables used by Brand.
        // oxlint-disable-next-line merit-brand/no-raw-theme-colors
        backgroundColor: "#0d3474",
        backgroundImage:
          "linear-gradient(112deg, #1c56ad 0%, #103875 50%, #071b42 100%)",
        // Satori does not resolve the browser CSS variables used by Brand.
        // oxlint-disable-next-line merit-brand/no-raw-theme-colors
        color: "#ffffff",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
      }}
    >
      <div style={{ alignItems: "center", display: "flex", gap: 96 }}>
        <div
          style={{ display: "flex", flex: 1, flexDirection: "column", gap: 24 }}
        >
          <OpenGraphTitle size={72} style={{ letterSpacing: 0 }}>
            {title}
          </OpenGraphTitle>
          <OpenGraphDescription
            size={25}
            style={{ lineClamp: 4, maxWidth: 680, opacity: 0.72 }}
          >
            {description}
          </OpenGraphDescription>
        </div>
        {origin.favicon ? (
          <div
            style={{
              alignItems: "center",
              // Satori does not resolve the browser CSS variables used by Brand.
              // oxlint-disable-next-line merit-brand/no-raw-theme-colors
              backgroundColor: "#ffffff",
              borderRadius: 28,
              display: "flex",
              height: 192,
              justifyContent: "center",
              width: 192,
            }}
          >
            <OpenGraphExternalImage
              alt={title}
              fit="contain"
              height={144}
              radius={18}
              src={origin.favicon}
              width={144}
            />
          </div>
        ) : (
          <div
            style={{
              // Satori does not resolve the browser CSS variables used by Brand.
              // oxlint-disable-next-line merit-brand/no-raw-theme-colors
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              borderRadius: 28,
              height: 192,
              width: 192,
            }}
          />
        )}
      </div>
      <div
        style={{
          borderTop: "3px solid rgba(255, 255, 255, 0.22)",
          display: "flex",
          gap: 24,
          justifyContent: "space-between",
          paddingTop: 40,
        }}
      >
        <OpenGraphHeader
          logo={
            <MeritOpenGraphMark
              color="oklch(0.5461 0.2152 262.88)"
              foreground="#ffffff"
              size={48}
            />
          }
        >
          <span style={{ fontSize: 40, fontWeight: 450, lineHeight: 1 }}>
            x402scan
          </span>
        </OpenGraphHeader>
        <div style={{ display: "flex", gap: 48 }}>
          <Metric
            label="Transactions"
            value={formatNumber(statistics.total_transactions)}
          />
          <Metric
            label="Volume"
            value={formatTokenAmount(BigInt(statistics.total_amount))}
          />
        </div>
      </div>
    </OpenGraphImage>,
    {
      ...size,
      fonts: await loadOpenGraphFonts(),
    }
  );
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div
      style={{
        alignItems: "flex-end",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <p style={{ fontSize: 24, fontWeight: 400, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 48, fontWeight: 600, margin: 0 }}>{value}</p>
    </div>
  );
}
