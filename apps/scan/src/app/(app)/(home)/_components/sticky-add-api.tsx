'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';

const SENTINEL_ID = 'add-api-sentinel';
const BUTTON_ID = 'add-api-button';
const BUTTON_MOBILE_ID = 'add-api-button-mobile';
const NAV_HEIGHT = 41;
const BANNER_HEIGHT = 27;

export function AddApiSentinel() {
  return <div id={SENTINEL_ID} className="h-px w-0 shrink-0" />;
}

export function AddApiButtonMarker({
  children,
  mobile,
}: {
  children: React.ReactNode;
  mobile?: boolean;
}) {
  return <div id={mobile ? BUTTON_MOBILE_ID : BUTTON_ID}>{children}</div>;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function restoreButtons() {
  for (const id of [BUTTON_ID, BUTTON_MOBILE_ID]) {
    const el = document.getElementById(id);
    if (el) el.style.visibility = '';
  }
}

export function StickyAddApi() {
  const pathname = usePathname();
  const rafRef = useRef<number>(0);
  const boxRef = useRef<HTMLAnchorElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;

    const tick = () => {
      const sentinel = document.getElementById(SENTINEL_ID);
      if (!sentinel) return;

      // Pick whichever button is currently visible (desktop or mobile)
      const desktopBtn = document.getElementById(BUTTON_ID);
      const mobileBtn = document.getElementById(BUTTON_MOBILE_ID);
      const mobileLink = mobileBtn?.querySelector('a');
      const isMobile = mobileLink != null && mobileLink.offsetHeight > 0;
      const button = isMobile ? mobileBtn! : desktopBtn;
      if (!button) return;

      const btnRect = button.getBoundingClientRect();
      const vw = window.innerWidth;

      // How far the button's top has gone above the nav bar bottom
      const distAboveNav = NAV_HEIGHT - btnRect.top;

      if (distAboveNav <= 0) {
        box.style.display = 'none';
        restoreButtons();
        return;
      }

      // Show overlay, hide the source button
      box.style.display = '';
      button.style.visibility = 'hidden';

      const progress = Math.min(1, distAboveNav / (btnRect.height + 30));
      const t = smoothstep(progress);

      // Left edge leads (finishes at 70%), right edge follows (starts at 30%)
      const leftT = smoothstep(Math.min(1, t / 0.7));
      const rightT = smoothstep(Math.max(0, (t - 0.3) / 0.7));

      const left = lerp(btnRect.left, 0, leftT);
      const right = lerp(btnRect.right, vw, rightT);
      const top = Math.max(NAV_HEIGHT, lerp(btnRect.top, NAV_HEIGHT, t));
      const height = lerp(btnRect.height, BANNER_HEIGHT, t);
      const radius = lerp(6, 0, t);

      box.style.left = `${left}px`;
      box.style.width = `${right - left}px`;
      box.style.top = `${top}px`;
      box.style.height = `${height}px`;
      box.style.borderRadius = `${radius}px`;

      // Text: slide from button center to banner center
      const boxWidth = right - left;
      const btnCenter = btnRect.left + btnRect.width / 2 - left;
      const bannerCenter = boxWidth / 2;
      text.style.left = `${lerp(btnCenter, bannerCenter, t)}px`;
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    tick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(rafRef.current);
      restoreButtons();
    };
  }, [pathname]);

  if (pathname === '/resources/register') {
    return null;
  }

  return (
    <Link
      ref={boxRef}
      href="/resources/register"
      className="fixed z-[9] flex items-center text-white text-[13px] leading-none font-medium overflow-hidden pointer-events-auto"
      style={{
        backgroundColor: '#0052ff',
        display: 'none',
      }}
    >
      <span
        ref={textRef}
        className="absolute flex items-center gap-1.5"
        style={{ transform: 'translateX(-50%) translateY(2px)' }}
      >
        <Plus className="size-[13px]" />
        Add your API
      </span>
    </Link>
  );
}
