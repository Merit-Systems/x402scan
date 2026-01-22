import type { OutputComponent } from '../types';

import z from 'zod';
import { Star, ExternalLink } from 'lucide-react';
import { ToolOutput } from '@/components/ai-elements/tool';

const AmazonProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  price: z.string(),
  image: z.string(),
  stars: z.union([z.number(), z.string()]).optional(),
  reviewsCount: z.coerce.number().optional(),
  isPrime: z.coerce.boolean().optional(),
  cached: z.coerce.boolean().optional(),
});

const AmazonSearchOutputSchema = z.object({
  items: z.array(AmazonProductSchema),
});

export const BasezosOutput: OutputComponent = ({ output, errorText }) => {
  if (errorText) {
    return <div className="text-destructive text-sm">{errorText}</div>;
  }

  const parseResult = AmazonSearchOutputSchema.safeParse(output);

  if (!parseResult.success) {
    return <ToolOutput output={JSON.stringify(output)} />;
  }

  const { items } = parseResult.data;

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">No products found</div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(item => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col border rounded-lg overflow-hidden hover:border-primary transition-colors bg-card"
        >
          <div className="relative aspect-square bg-muted overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
            />
            {item.isPrime && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded">
                Prime
              </div>
            )}
          </div>
          <div className="p-3 flex flex-col gap-2 flex-1">
            <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
              {item.name}
            </h3>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex flex-col gap-1">
                <div className="text-lg font-bold text-primary">
                  {item.price}
                </div>
                {item.stars !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3 fill-yellow-400 text-yellow-400" />
                    <span>
                      {typeof item.stars === 'number'
                        ? item.stars.toFixed(1)
                        : item.stars}
                      {item.reviewsCount !== undefined &&
                        ` (${item.reviewsCount.toLocaleString()})`}
                    </span>
                  </div>
                )}
              </div>
              <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};
