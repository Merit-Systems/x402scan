'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Download,
  Link,
  Share2,
  Loader2,
  Check,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { api, type RouterOutputs } from '@/trpc/client';
import { convertTokenAmount, formatTokenAmount } from '@/lib/token';
import { ActivityTimeframe } from '@/types/timeframes';
import {
  ScreenshotCard,
  fetchImageAsDataUrl,
  type ChartMetric,
  type BottomMetric,
} from './screenshot-card';

type Origin = NonNullable<RouterOutputs['public']['origins']['get']>;

interface Props {
  originTitle: string;
  originId: string;
  origin: Origin;
}

const CHART_OPTIONS: { id: ChartMetric; label: string }[] = [
  { id: 'transactions', label: 'Transactions' },
  { id: 'volume', label: 'Volume' },
  { id: 'buyers', label: 'Buyers' },
];

const BOTTOM_OPTIONS: { id: BottomMetric; label: string }[] = [
  { id: 'transactions', label: 'Transactions' },
  { id: 'volume', label: 'Volume' },
  { id: 'buyers', label: 'Buyers' },
  { id: 'resources', label: 'Resources' },
];

export const ShareModal: React.FC<Props> = ({
  originTitle,
  originId,
  origin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const linkTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('transactions');
  const [bottomMetrics, setBottomMetrics] = useState<BottomMetric[]>([
    'volume',
    'buyers',
    'resources',
  ]);
  const [faviconDataUrl, setFaviconDataUrl] = useState<string | null>(null);

  // Fetch favicon when modal opens
  useEffect(() => {
    if (isOpen && origin.favicon) {
      void fetchImageAsDataUrl(origin.favicon).then(setFaviconDataUrl);
    }
  }, [isOpen, origin.favicon]);

  // Fetch data for the screenshot card
  const { data: metadata } = api.public.origins.getMetadata.useQuery(originId, {
    enabled: isOpen,
  });

  const addresses = useMemo(
    () =>
      metadata
        ? Array.from(
            new Set(
              metadata.resources.flatMap(resource =>
                resource.accepts.map(accept => accept.payTo)
              )
            )
          )
        : [],
    [metadata]
  );

  const { data: overallStats } = api.public.stats.overall.useQuery(
    {
      recipients: { include: addresses },
      timeframe: ActivityTimeframe.ThirtyDays,
    },
    { enabled: isOpen && addresses.length > 0 }
  );

  const { data: bucketedStats } = api.public.stats.bucketed.useQuery(
    {
      numBuckets: 48,
      timeframe: ActivityTimeframe.ThirtyDays,
      recipients: { include: addresses },
    },
    { enabled: isOpen && addresses.length > 0 }
  );

  const stats = overallStats
    ? {
        transactions: overallStats.total_transactions,
        volume: formatTokenAmount(BigInt(overallStats.total_amount)),
        buyers: overallStats.unique_buyers,
      }
    : null;

  const chartData = bucketedStats
    ? bucketedStats.map(stat => ({
        transactions: stat.total_transactions,
        totalAmount: parseFloat(
          convertTokenAmount(BigInt(stat.total_amount)).toString()
        ),
        buyers: stat.unique_buyers,
      }))
    : [];

  const resourceCount = metadata?.resources.length ?? 0;

  const dataReady = stats && chartData.length > 0;

  const captureScreenshot = useCallback(async () => {
    try {
      setCaptureError(false);
      // Small delay to let the card render after config change
      await new Promise(r => setTimeout(r, 150));

      const cardEl = document.getElementById('origin-screenshot-card');
      if (!cardEl) return;

      const wrapper = cardEl.parentElement;
      if (wrapper) {
        wrapper.style.position = 'fixed';
        wrapper.style.left = '0';
        wrapper.style.top = '0';
        wrapper.style.zIndex = '-1';
        wrapper.style.opacity = '0';
        wrapper.style.pointerEvents = 'none';
      }

      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardEl, {
        pixelRatio: 2,
        skipFonts: true,
      });

      if (wrapper) {
        wrapper.style.position = 'absolute';
        wrapper.style.left = '-9999px';
        wrapper.style.top = '-9999px';
        wrapper.style.zIndex = '';
        wrapper.style.opacity = '';
        wrapper.style.pointerEvents = '';
      }

      setScreenshotUrl(dataUrl);
    } catch (err) {
      console.error(
        'Screenshot capture failed:',
        err instanceof Error ? err.message : err
      );
      setCaptureError(true);
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Capture on open (with spinner), re-capture on config change (no spinner)
  const hasInitialCapture = useRef(false);
  useEffect(() => {
    if (!isOpen || !dataReady) return;
    if (!hasInitialCapture.current) {
      hasInitialCapture.current = true;
      setIsCapturing(true);
    }
    void captureScreenshot();
  }, [
    isOpen,
    dataReady,
    chartMetric,
    bottomMetrics,
    faviconDataUrl,
    captureScreenshot,
  ]);

  const handleDownload = () => {
    if (!screenshotUrl) return;
    const link = document.createElement('a');
    link.download = `${originTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-x402scan.png`;
    link.href = screenshotUrl;
    link.click();
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    if (linkTimerRef.current) clearTimeout(linkTimerRef.current);
    linkTimerRef.current = setTimeout(() => setLinkCopied(false), 2000);
  };

  const MAX_BOTTOM_METRICS = 3;

  const toggleBottomMetric = (metric: BottomMetric) => {
    setBottomMetrics(prev => {
      if (prev.includes(metric)) return prev.filter(m => m !== metric);
      if (prev.length >= MAX_BOTTOM_METRICS) return prev;
      return [...prev, metric];
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBottomMetrics(prev => {
      const oldIndex = prev.indexOf(active.id as BottomMetric);
      const newIndex = prev.indexOf(over.id as BottomMetric);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const unselectedMetrics = BOTTOM_OPTIONS.filter(
    opt => !bottomMetrics.includes(opt.id)
  );

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setScreenshotUrl(null);
      setFaviconDataUrl(null);
      setLinkCopied(false);
      setCaptureError(false);
      if (linkTimerRef.current) clearTimeout(linkTimerRef.current);
      hasInitialCapture.current = false;
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#0052ff] hover:bg-[#0045dd] text-white text-xs font-medium cursor-pointer">
          <Share2 className="size-3" />
          Share
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share this page</DialogTitle>
          <DialogDescription>
            Customize and download a screenshot or copy the link.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {/* Screenshot preview */}
          <div className="rounded-md border overflow-hidden bg-muted">
            {captureError ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                <p className="text-sm">Failed to generate preview</p>
                <button
                  onClick={() => void captureScreenshot()}
                  className="text-xs underline cursor-pointer hover:text-foreground"
                >
                  Retry
                </button>
              </div>
            ) : isCapturing || !screenshotUrl ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={screenshotUrl}
                alt="Screenshot preview"
                className="w-full"
              />
            )}
          </div>

          {/* Metric config */}
          <div className="flex flex-col gap-3">
            {/* Chart metric */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">
                Chart
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {CHART_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setChartMetric(opt.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      chartMetric === opt.id
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Bottom metrics — drag to reorder, click to toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">
                Stats
              </span>
              <div className="flex gap-1.5 flex-wrap">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={bottomMetrics}
                    strategy={horizontalListSortingStrategy}
                  >
                    {bottomMetrics.map(metricId => (
                      <SortableMetricPill
                        key={metricId}
                        id={metricId}
                        label={
                          BOTTOM_OPTIONS.find(o => o.id === metricId)!.label
                        }
                        onRemove={() => toggleBottomMetric(metricId)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                {unselectedMetrics.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => toggleBottomMetric(opt.id)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors bg-muted text-muted-foreground hover:bg-muted/80"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2"
              onClick={handleDownload}
              disabled={!screenshotUrl}
            >
              <Download className="size-4" />
              Download
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => void handleCopyLink()}
            >
              {linkCopied ? (
                <Check className="size-4" />
              ) : (
                <Link className="size-4" />
              )}
              {linkCopied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>

        {/* Hidden screenshot card rendered inside the modal */}
        {dataReady && (
          <ScreenshotCard
            origin={origin}
            resourceCount={resourceCount}
            stats={stats}
            chartData={chartData}
            chartMetric={chartMetric}
            bottomMetrics={bottomMetrics}
            faviconDataUrl={faviconDataUrl}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const SortableMetricPill = ({
  id,
  label,
  onRemove,
}: {
  id: string;
  label: string;
  onRemove: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="inline-flex items-center gap-1 rounded-md bg-foreground text-background"
    >
      <button
        className="pl-1 py-1 cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3 opacity-50" />
      </button>
      <button
        onClick={onRemove}
        className="pr-2.5 py-1 text-xs font-medium cursor-pointer"
      >
        {label}
      </button>
    </div>
  );
};
