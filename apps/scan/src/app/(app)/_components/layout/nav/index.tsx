"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { ExternalLink } from "lucide-react";

import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";

import { MotionTab } from "./motion-tab";

import type { Route } from "next";

interface Tab<T extends string> {
  label: string;
  href: Route<T>;
  subRoutes?: string[];
  external?: boolean;
  isNew?: boolean;
}

interface Props<T extends string = string> {
  tabs: Tab<T>[];
}

export const Nav = <T extends string>({ tabs }: Props<T>) => {
  const [buttonRefs, setButtonRefs] = useState<(HTMLAnchorElement | null)[]>(
    []
  );

  const { scrollY } = useScroll();

  const paddingLeft = useTransform(scrollY, [0, 56], [0, 36]);

  useEffect(() => {
    setButtonRefs((prev) => prev.slice(0, tabs.length));
  }, [tabs.length]);

  const navRef = useRef<HTMLDivElement>(null);
  const navRect = navRef.current?.getBoundingClientRect();

  const [hoveredTabIndex, setHoveredTabIndex] = useState<number | null>(null);
  const hoveredRect =
    buttonRefs[hoveredTabIndex ?? -1]?.getBoundingClientRect();

  return (
    <div className="no-scrollbar sticky top-0 z-10 w-full max-w-full overflow-x-auto overflow-y-hidden border-b bg-card px-2 pt-2.5 md:px-6">
      <nav
        className="relative h-full w-full bg-card"
        ref={navRef}
        onPointerLeave={() => setHoveredTabIndex(null)}
      >
        <motion.ul
          className="m-0 flex h-full w-full list-none flex-nowrap p-0 text-sm font-medium md:flex-wrap"
          style={{ paddingLeft: paddingLeft }}
        >
          {tabs.map((tab, index) => (
            <div className="relative z-11 shrink-0 pb-1" key={tab.label}>
              <Link
                href={tab.href}
                className="z-11"
                onMouseEnter={() => setHoveredTabIndex(index)}
                onMouseLeave={() => setHoveredTabIndex(null)}
                onClick={() => setHoveredTabIndex(null)}
                ref={(el) => {
                  if (el) {
                    buttonRefs[index] = el;
                  }
                }}
              >
                <MotionTab href={tab.href} subRoutes={tab.subRoutes}>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    {tab.label}
                    {tab.external && <ExternalLink className="size-4" />}
                    {tab.isNew && (
                      <span className="rounded-md border border-primary bg-primary/20 px-1.5 text-xs text-primary">
                        New
                      </span>
                    )}
                  </span>
                </MotionTab>
              </Link>
            </div>
          ))}
        </motion.ul>
        <AnimatePresence>
          {hoveredRect && navRect && (
            <motion.div
              key="hover"
              className={`absolute top-0 left-0 z-10 rounded-md bg-accent`}
              initial={{
                ...getHoverAnimationProps(hoveredRect, navRect),
                opacity: 0,
              }}
              animate={{
                ...getHoverAnimationProps(hoveredRect, navRect),
                opacity: 1,
              }}
              exit={{
                ...getHoverAnimationProps(hoveredRect, navRect),
                opacity: 0,
              }}
              transition={{
                type: "tween",
                ease: "easeOut",
                duration: 0.15,
              }}
            />
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
};

const getHoverAnimationProps = (hoveredRect: DOMRect, navRect: DOMRect) => ({
  x: hoveredRect.left - navRect.left,
  y: hoveredRect.top - navRect.top,
  width: hoveredRect.width,
  height: hoveredRect.height,
});
