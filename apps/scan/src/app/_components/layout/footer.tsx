import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto w-full">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
        <p className="type-caption text-muted-foreground">
          Made by{" "}
          <a
            href="https://merit.systems"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Merit Systems
          </a>
        </p>
        <nav
          aria-label="Footer navigation"
          className="flex items-center gap-4 type-caption text-muted-foreground"
        >
          <a
            href="https://github.com/Merit-Systems/x402scan"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <Link
            href="/privacy"
            prefetch={false}
            className="transition-colors hover:text-foreground"
          >
            Privacy
          </Link>
          <Link
            href="/tos"
            prefetch={false}
            className="transition-colors hover:text-foreground"
          >
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
