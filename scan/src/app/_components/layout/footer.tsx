import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/logo';

export function Footer() {
  return (
    <footer className="w-full border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo className="size-5" />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                x402scan
              </span>
            </Link>
          </div>

          {/* Right side - Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="https://github.com/merit-systems/x402scan"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Image
                src="/github.png"
                alt="GitHub"
                width={16}
                height={16}
                className="size-4"
              />
              <span>GitHub</span>
            </Link>

            <Link
              href="https://x.com/x402scan"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Twitter</span>
            </Link>

            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>

            <Link
              href="/tos"
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
