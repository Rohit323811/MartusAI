"use client";

import Link from "next/link";
import { useState } from "react";
import { Scale, LogOut, LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TryCounterBadge } from "@/components/TryCounterBadge";
import { MagicLinkModal } from "@/components/MagicLinkModal";
import { useSession } from "@/lib/useSession";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { email, isSignedIn, signOut } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="container flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 py-2 lg:h-16 lg:flex-nowrap lg:py-0">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg font-display text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="MartusAI home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Scale className="h-5 w-5" aria-hidden="true" />
          </span>
          MartusAI
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <Link
            href="/modules"
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Modules
          </Link>
        </nav>
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <TryCounterBadge />
          {isSignedIn ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[160px] truncate text-sm text-muted-foreground sm:inline">
                {email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void signOut()}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOpen(true)}
              aria-label="Sign in"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign in</span>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
      <MagicLinkModal open={open} onOpenChange={setOpen} />
    </header>
  );
}
