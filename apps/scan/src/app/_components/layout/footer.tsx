import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/logo';

function MeritMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 226 261"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <polygon
        points="59.23 99.45 59.23 161.55 113.02 192.61 113.02 130.5"
        className="fill-red-500/90"
      />
      <polygon
        points="113.02 68.39 59.23 99.45 113.02 130.5 166.8 99.45"
        className="fill-red-600"
      />
      <polygon
        points="166.8 99.45 113.02 130.5 113.02 192.61 166.8 161.55"
        className="fill-red-700"
      />
      <path
        d="M113.02,196.41l-57.08-32.95v-65.91l57.08-32.95,57.08,32.95v65.91l-57.08,32.95ZM60.49,160.83l52.53,30.33,52.53-30.33v-60.66l-52.53-30.33-52.53,30.33v60.66Z"
        fill="currentColor"
      />
      <path
        d="M113.02,261L0,195.75V65.25L113.02,0l113.02,65.25v130.5l-113.02,65.25ZM6.82,191.81l106.2,61.31,106.2-61.31v-122.62L113.02,7.88,6.82,69.19v122.62Z"
        fill="currentColor"
      />
      <rect x="111.88" y="3.94" width="2.27" height="63.28" fill="currentColor" />
      <rect
        x="-.83"
        y="176.82"
        width="63.28"
        height="2.27"
        transform="translate(-84.84 39.24) rotate(-29.99)"
        fill="currentColor"
      />
      <rect
        x="194.08"
        y="146.32"
        width="2.27"
        height="63.28"
        transform="translate(-56.51 258.05) rotate(-60)"
        fill="currentColor"
      />
      <rect x="111.88" y="130.5" width="2.27" height="126.56" fill="currentColor" />
      <rect
        x="104.54"
        y="97.72"
        width="126.56"
        height="2.27"
        transform="translate(-26.95 97.14) rotate(-29.99)"
        fill="currentColor"
      />
      <rect
        x="57.08"
        y="35.58"
        width="2.27"
        height="126.56"
        transform="translate(-56.51 99.84) rotate(-60)"
        fill="currentColor"
      />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="w-full border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="relative flex items-center justify-between gap-4">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo className="size-5" />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors font-mono">
                x402scan
              </span>
            </Link>
          </div>

          {/* Center - Merit badge */}
          <a
            href="https://merit.systems"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-muted-foreground transition-all hover:border-border hover:text-foreground hover:bg-muted/70"
          >
            <MeritMark className="size-3.5" />
            <span className="text-[11px] font-semibold tracking-wide uppercase">
              Merit
            </span>
          </a>

          {/* Right side - Links */}
          <div className="flex items-center gap-4 md:gap-6 text-sm text-muted-foreground">
            <a
              href="https://github.com/Merit-Systems/x402scan"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Image
                src="/github.png"
                alt="GitHub"
                width={16}
                height={16}
                className="size-4 dark:invert"
              />
            </a>

            <a
              href="https://x.com/x402scan"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
              aria-label="Twitter"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            <Link
              href="/privacy"
              prefetch={false}
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>

            <Link
              href="/tos"
              prefetch={false}
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
