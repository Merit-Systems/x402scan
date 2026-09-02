"use client";

import { useMemo, useState } from "react";
import { GlobeIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { ComponentProps, ReactNode } from "react";

type AvatarProps = Omit<ComponentProps<typeof Avatar>, "children">;

interface OriginAvatarProps extends AvatarProps {
  fallback?: ReactNode;
  fallbackClassName?: string;
  imageClassName?: string;
  origin?: string;
  src?: string | null;
}

function getOriginFaviconUrls(origin: string) {
  try {
    const { origin: baseOrigin } = new URL(origin);

    return [
      new URL("/favicon.svg", baseOrigin).toString(),
      new URL("/favicon.png", baseOrigin).toString(),
      new URL("/favicon.ico", baseOrigin).toString(),
    ];
  } catch {
    return [];
  }
}

function OriginAvatar({
  className,
  fallback,
  fallbackClassName,
  imageClassName,
  origin,
  size = "sm",
  src,
  ...props
}: OriginAvatarProps) {
  const faviconUrls = useMemo(() => {
    const urls: string[] = [];
    const trimmedSrc = src?.trim();

    if (trimmedSrc) {
      urls.push(trimmedSrc);
    }

    if (origin) {
      for (const url of getOriginFaviconUrls(origin)) {
        if (!urls.includes(url)) {
          urls.push(url);
        }
      }
    }

    return urls;
  }, [origin, src]);
  const faviconKey = JSON.stringify(faviconUrls);
  const [faviconState, setFaviconState] = useState({
    index: 0,
    key: faviconKey,
  });
  const faviconIndex = faviconState.key === faviconKey ? faviconState.index : 0;
  const faviconUrl = faviconUrls[faviconIndex];

  return (
    <Avatar className={className} variant="tile" size={size} {...props}>
      {faviconUrl ? (
        <AvatarImage
          alt=""
          className={imageClassName}
          src={faviconUrl}
          onLoadingStatusChange={(status) => {
            if (status === "error") {
              setFaviconState({ index: faviconIndex + 1, key: faviconKey });
            }
          }}
        />
      ) : null}
      <AvatarFallback className={fallbackClassName}>
        {fallback ?? <GlobeIcon className="size-full text-primary/80" />}
      </AvatarFallback>
    </Avatar>
  );
}

export { OriginAvatar };
export type { OriginAvatarProps };
