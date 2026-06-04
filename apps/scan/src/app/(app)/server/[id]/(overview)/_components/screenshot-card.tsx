'use client';

import { useEffect, useState } from 'react';
import { cleanExternalText } from '@/lib/utils';
import type { RouterOutputs } from '@/trpc/client';

type Origin = NonNullable<RouterOutputs['public']['origins']['get']>;

export type ChartMetric = 'transactions' | 'volume' | 'buyers';
export type BottomMetric = 'transactions' | 'volume' | 'buyers' | 'resources';

interface Props {
  origin: Origin;
  resourceCount: number;
  stats: {
    transactions: number;
    volume: string;
    buyers: number;
  };
  chartData: { transactions: number; totalAmount: number; buyers: number }[];
  chartMetric?: ChartMetric;
  bottomMetrics?: BottomMetric[];
}

const X402_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 268.14 304.26"><path fill="#0052ff" d="M124.07,143.76L19.84,39.54c-7.32-7.32-19.84-2.14-19.84,8.22v208.79c0,10.31,12.47,15.48,19.76,8.18l104.31-104.31c4.6-4.6,4.6-12.05,0-16.65Z"/><path fill="#0052ff" d="M143.76,180.19l-104.23,104.23c-7.32,7.32-2.14,19.84,8.22,19.84h208.79c10.31,0,15.48-12.47,8.18-19.76l-104.31-104.31c-4.6-4.6-12.05-4.6-16.65,0Z"/><path fill="#0052ff" d="M160.49,124.07l104.23-104.23c7.32-7.32,2.14-19.84-8.22-19.84H47.71c-10.31,0-15.48,12.47-8.18,19.76l104.31,104.31c4.6,4.6,12.05,4.6,16.65,0Z"/></svg>`;

function generateGrainDataUrl(): string {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 18; // low opacity grain
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function AreaChart({
  data,
  width,
  height,
  color,
}: {
  data: number[];
  width: number;
  height: number;
  color: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const padX = 4;
  const padTop = 10;
  const padBottom = 4;
  const chartW = width - padX * 2;
  const chartH = height - padTop - padBottom;

  const points = data.map((val, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padTop + chartH - (val / max) * chartH,
  }));

  // Smooth the data by averaging neighbors to reduce jaggedness
  const smoothed = points.map((p, i) => {
    if (i === 0 || i === points.length - 1) return p;
    const prev = points[i - 1]!;
    const next = points[i + 1]!;
    return {
      x: p.x,
      y: (prev.y + p.y + next.y) / 3,
    };
  });

  const linePath = smoothed.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const first = smoothed[0]!;
  const last = smoothed[smoothed.length - 1]!;
  const areaPath = `${linePath} L${last.x},${height} L${first.x},${height} Z`;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.1} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r={2} fill={color} />
      <circle cx={last.x} cy={last.y} r={4} fill={color} opacity={0.12} />
    </svg>
  );
}

export const ScreenshotCard: React.FC<Props> = ({
  origin,
  resourceCount,
  stats,
  chartData,
  chartMetric = 'transactions',
  bottomMetrics = ['volume', 'buyers', 'resources'],
}) => {
  const [faviconDataUrl, setFaviconDataUrl] = useState<string | null>(null);
  const [grainDataUrl] = useState(() => generateGrainDataUrl());

  useEffect(() => {
    if (origin.favicon) {
      void fetchImageAsDataUrl(origin.favicon).then(setFaviconDataUrl);
    }
  }, [origin.favicon]);

  const rawTitle = origin.title
    ? cleanExternalText(origin.title)
    : new URL(origin.origin).hostname;
  // Truncate at common delimiters (em dash, en dash, spaced dash, colon, pipe)
  const title = (rawTitle.split(/\s*[—–:|]\s*|\s+-\s+/)[0] ?? rawTitle).trim();
  const description = origin.description
    ? cleanExternalText(origin.description)
    : null;

  const formatCompact = (n: number) =>
    n.toLocaleString(undefined, {
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const logoDataUrl = `data:image/svg+xml;base64,${btoa(X402_LOGO_SVG)}`;

  const chartDataMap: Record<ChartMetric, number[]> = {
    transactions: chartData.map(d => d.transactions),
    volume: chartData.map(d => d.totalAmount),
    buyers: chartData.map(d => d.buyers),
  };
  const chartLabelMap: Record<ChartMetric, string> = {
    transactions: 'Transactions',
    volume: 'Volume',
    buyers: 'Buyers',
  };
  const chartValueMap: Record<ChartMetric, string> = {
    transactions: formatCompact(stats.transactions),
    volume: stats.volume,
    buyers: formatCompact(stats.buyers),
  };

  const activeChartData = chartDataMap[chartMetric];
  const activeChartLabel = chartLabelMap[chartMetric];
  const activeChartValue = chartValueMap[chartMetric];

  const metricLookup: Record<BottomMetric, { label: string; value: string }> = {
    transactions: { label: 'Transactions', value: formatCompact(stats.transactions) },
    volume: { label: 'Volume', value: stats.volume },
    buyers: { label: 'Buyers', value: formatCompact(stats.buyers) },
    resources: { label: 'Resources', value: resourceCount.toString() },
  };
  const visibleBottomMetrics = bottomMetrics.map(id => ({ id, ...metricLookup[id] }));

  return (
    <div
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
      }}
      aria-hidden
    >
      <div
        id="origin-screenshot-card"
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          color: '#0a0a0a',
          fontFamily:
            '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          overflow: 'hidden',
          boxSizing: 'border-box',
          background: 'linear-gradient(to right, #ffffff 0%, #c5c5c5 100%)',
          position: 'relative',
        }}
      >
        {/* Grain overlay */}
        {grainDataUrl && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${grainDataUrl})`,
              backgroundRepeat: 'repeat',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Top: Favicon + Title/Desc (left) | Chart (right) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 60,
          }}
        >
          {/* Left: Favicon + text */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 24,
              }}
            >
              {/* Favicon */}
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 16,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: faviconDataUrl
                    ? `#fafafa url(${faviconDataUrl}) center/contain no-repeat`
                    : '#f0f0f0',
                }}
              />
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {title}
              </div>
            </div>
            {description && (
              <div
                style={{
                  fontSize: 21,
                  fontFamily:
                    '"Geist Mono", ui-monospace, SFMono-Regular, monospace',
                  lineHeight: 1.45,
                  marginTop: 20,
                  color: '#525252',
                  letterSpacing: '-0.02em',
                  maxWidth: 620,
                }}
              >
                {description}
              </div>
            )}
          </div>

          {/* Right: Transaction chart with overlaid label */}
          <div
            style={{
              width: 400,
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 40,
                left: 0,
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {activeChartValue}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#737373',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginTop: 4,
                }}
              >
                {activeChartLabel}
              </div>
            </div>
            <AreaChart
              data={activeChartData}
              width={400}
              height={260}
              color="#0052ff"
            />
          </div>
        </div>

        {/* Bottom: Branding + Stats */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '4px solid rgba(0,0,0,0.1)',
            paddingTop: 48,
          }}
        >
          {/* x402scan branding */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoDataUrl}
              alt=""
              width={32}
              height={32}
              style={{ width: 32, height: 32 }}
            />
            <span
              style={{
                fontSize: 32,
                fontWeight: 700,
                fontFamily:
                  '"Geist Mono", ui-monospace, SFMono-Regular, monospace',
                color: '#0a0a0a',
              }}
            >
              x402scan
            </span>
          </div>
          {/* Stats */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 48,
            }}
          >
            {visibleBottomMetrics.map(m => (
              <Metric key={m.id} label={m.label} value={m.value} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
    }}
  >
    <div
      style={{
        fontSize: 24,
        fontWeight: 400,
        color: '#737373',
        margin: 0,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 48,
        fontWeight: 700,
        margin: 0,
      }}
    >
      {value}
    </div>
  </div>
);
