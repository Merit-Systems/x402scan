'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import { ExternalLink } from 'lucide-react';

import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';

import { MotionTab } from './motion-tab';

import type { Route } from 'next';

interface Tab<T extends string> {
  label: string;
  href: Route<T>;
  subRoutes?: string[];
  external?: boolean;
}

interface Props<T extends string = string> {
  tabs: Tab<T>[];
  layoutId?: string;
}

export const Nav = <T extends string>({
  tabs,
  layoutId = 'nav-underline',
}: Props<T>) => {
  const buttonRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const router = useRouter();
  const pathname = usePathname();
  const [_isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  const { scrollY } = useScroll();

  const paddingLeft = useTransform(scrollY, [0, 56], [0, 36]);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const navRef = useRef<HTMLDivElement>(null);

  const [hoveredTabIndex, setHoveredTabIndex] = useState<number | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | undefined>(
    undefined
  );
  const [navRect, setNavRect] = useState<DOMRect | undefined>(undefined);

  useEffect(() => {
    if (hoveredTabIndex !== null && buttonRefs.current[hoveredTabIndex]) {
      setHoveredRect(
        buttonRefs.current[hoveredTabIndex]?.getBoundingClientRect()
      );
    } else {
      setHoveredRect(undefined);
    }
  }, [hoveredTabIndex]);

  useEffect(() => {
    if (navRef.current) {
      setNavRect(navRef.current.getBoundingClientRect());
    }
  }, []);

  return (
    <div className="w-full max-w-full overflow-x-auto overflow-y-hidden border-b px-2 md:px-6 pt-2.5 sticky top-0 z-10 bg-card no-scrollbar">
      <nav
        className="bg-card w-full relative h-full"
        ref={navRef}
        onPointerLeave={() => setHoveredTabIndex(null)}
      >
        <motion.ul
          className="list-none p-0 m-0 font-medium text-sm flex w-full h-full flex-nowrap md:flex-wrap"
          style={{ paddingLeft: paddingLeft }}
        >
          {tabs.map((tab, index) => (
            <div className="relative z-11 pb-1 shrink-0" key={tab.label}>
              <Link
                href={tab.href}
                className="z-11"
                onMouseEnter={() => setHoveredTabIndex(index)}
                onMouseLeave={() => setHoveredTabIndex(null)}
                onClick={e => {
                  if (isNavigating) {
                    e.preventDefault();
                    return;
                  }
                  setIsNavigating(true);
                  e.preventDefault();
                  startTransition(() => {
                    router.push(tab.href);
                  });
                }}
                ref={el => {
                  buttonRefs.current[index] = el;
                }}
                prefetch={false}
              >
                <MotionTab
                  href={tab.href}
                  subRoutes={tab.subRoutes}
                  layoutId={layoutId}
                >
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    {tab.label}
                    {tab.external && <ExternalLink className="size-4" />}
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
              className={`absolute z-10 top-0 left-0 rounded-md bg-accent`}
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
                type: 'tween',
                ease: 'easeOut',
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
