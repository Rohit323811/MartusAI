"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Languages,
  FolderKanban,
  Fingerprint,
  Home,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const MODULES = [
  {
    href: "/plainsite",
    label: "PlainSite",
    tagline: "Legal text → plain English",
    body: "Paste any lease, notice, or terms of service. Get a 6th-grade rewrite, up to 5 key points, and every clause that works against you.",
    Icon: Languages,
  },
  {
    href: "/contractflow",
    label: "ContractFlow",
    tagline: "Extract → Flag → Route → Remind",
    body: "Upload a PDF or DOCX contract. Pull the parties, dates, obligations, and penalties; flag deviations from your standard clauses; get an approval path and an .ics of deadlines.",
    Icon: FolderKanban,
  },
  {
    href: "/evidencechain",
    label: "EvidenceChain",
    tagline: "Tamper-evident proof, in one tap",
    body: "Hash a photo, video, or PDF with SHA-256, capture its metadata, and get a Chain of Custody card with a QR code. Re-verify any time.",
    Icon: Fingerprint,
  },
  {
    href: "/tenantshield",
    label: "TenantShield",
    tagline: "Deadlines, letters, court prep",
    body: "Tell us the notice you received and your state. Get a deadline card, an editable response letter you can download, and a court prep checklist.",
    Icon: Home,
  },
];

export default function ModulesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1 py-10">
        <div className="container px-5">
          <header className="max-w-2xl">
            <h1 className="font-display text-fluid-h1 font-semibold">Modules</h1>
            <p className="mt-2 text-muted-foreground">
              Four focused tools that share one promise: plain language, clear
              deadlines, and evidence you can trust.
            </p>
          </header>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {MODULES.map((m, i) => (
              <motion.div
                key={m.href}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={m.href}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <m.Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 font-display text-xl font-semibold">{m.label}</h2>
                  <p className="text-sm font-medium text-primary">{m.tagline}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {m.body}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    Open module
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
