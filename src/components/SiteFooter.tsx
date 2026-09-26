import Link from "next/link";
import { Scale } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="container flex flex-col items-center gap-4 py-10 px-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Scale className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold">MartusAI</p>
            <p className="text-xs text-muted-foreground">
              AI legal information, not legal advice.
            </p>
          </div>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <li>
              <Link
                href="/"
                className="rounded-lg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="rounded-lg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                About
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/martus-ai/martusai"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>
        <ThemeToggle />
      </div>
      <div className="border-t border-border">
        <p className="container py-4 px-5 text-center text-xs text-muted-foreground">
          © 2026 MartusAI. Built for the InfinityX Global Hackathon 2K26.
          MartusAI provides legal <em>information</em>, not legal advice. For
          your specific situation, consult a licensed attorney or your local
          legal aid office.
        </p>
      </div>
      <p className="sr-only">Dark mode toggle is available above.</p>
    </footer>
  );
}
