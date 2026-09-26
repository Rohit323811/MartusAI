"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Languages,
  FolderKanban,
  Fingerprint,
  Home,
  Layers,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const MODULES = [
  { href: "/plainsite", label: "PlainSite", desc: "Plain-English translator", Icon: Languages },
  { href: "/contractflow", label: "ContractFlow", desc: "Extract · flag · route · remind", Icon: FolderKanban },
  { href: "/evidencechain", label: "EvidenceChain", desc: "Hash & chain of custody", Icon: Fingerprint },
  { href: "/tenantshield", label: "TenantShield", desc: "Deadlines & response letters", Icon: Home },
];

export function ModulesSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const content = (
    <nav aria-label="Feature modules" className="space-y-1">
      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Modules
      </p>
      {MODULES.map(({ href, label, desc, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block">{label}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {desc}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop: fixed sidebar (lg+) */}
      <aside className="fixed left-0 top-16 z-20 hidden h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r border-border bg-surface/60 px-3 py-2 backdrop-blur lg:block">
        {content}
      </aside>

      {/* Mobile: collapsible bar */}
      <div className="border-b border-border bg-surface/80 backdrop-blur lg:hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="modules-mobile"
          className="flex min-h-[44px] w-full items-center gap-2 px-5 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
          Modules
          <ChevronDown
            className={cn("ml-auto h-4 w-4 transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>
        {open && (
          <div id="modules-mobile" className="px-3 pb-3">
            {content}
          </div>
        )}
      </div>
    </>
  );
}
