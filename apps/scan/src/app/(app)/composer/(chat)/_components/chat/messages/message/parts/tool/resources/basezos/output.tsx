import type { OutputComponent } from "../types";

import z from "zod";
import Image from "next/image";
import { Star, ExternalLink } from "lucide-react";
import { ToolOutput } from "@/components/ai-elements/tool";

const AmazonProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  price: z.string(),
  image: z.string(),
  // Normalize numeric star ratings to display strings at the parse boundary
  stars: z
    .union([z.number().transform((stars) => stars.toFixed(1)), z.string()])
    .optional(),
  reviewsCount: z.coerce.number().optional(),
  isPrime: z.coerce.boolean().optional(),
  cached: z.coerce.boolean().optional(),
});

const AmazonSearchOutputSchema = z.object({
  items: z.array(AmazonProductSchema),
});

export const BasezosOutput: OutputComponent = ({ output, errorText }) => {
  if (errorText) {
    return (
      <div className="type-supporting-body text-destructive">{errorText}</div>
    );
  }

  const parseResult = AmazonSearchOutputSchema.safeParse(output);

  if (!parseResult.success) {
    return <ToolOutput output={JSON.stringify(output)} />;
  }

  const { items } = parseResult.data;

  if (items.length === 0) {
    return (
      <div className="type-supporting-body text-muted-foreground">
        No products found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary"
        >
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={item.image}
              alt={item.name}
              fill
              unoptimized
              className="size-full object-contain p-2 transition-transform group-hover:scale-105"
            />
            {item.isPrime && (
              <div className="type-micro absolute top-2 left-2 rounded bg-primary px-1.5 py-0.5 text-primary-foreground">
                Prime
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2 p-3">
            <h3 className="line-clamp-2 type-card-title transition-colors group-hover:text-primary">
              {item.name}
            </h3>
            <div className="mt-auto flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="type-banner-metric text-primary">
                  {item.price}
                </div>
                {item.stars !== undefined && (
                  <div className="flex items-center gap-1 type-caption text-muted-foreground">
                    <Star className="size-3 fill-warning text-warning" />
                    <span>
                      {item.stars}
                      {item.reviewsCount !== undefined &&
                        ` (${item.reviewsCount.toLocaleString()})`}
                    </span>
                  </div>
                )}
              </div>
              <ExternalLink className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};
