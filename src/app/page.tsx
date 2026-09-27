import {
  ShieldCheck,
  Zap,
  BookOpen,
  FileText,
  MapPin,
  MessageSquareQuote,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnonymousBanner } from "@/components/AnonymousBanner";
import { InputTabs } from "@/components/InputTabs";
import { HeroMockup } from "@/components/HeroMockup";
import { FeatureCard } from "@/components/FeatureCard";

const steps = [
  {
    icon: <FileText aria-hidden="true" />,
    title: "1. Share your document",
    body: "Upload a photo of a notice or letter, or type your situation. No account needed.",
  },
  {
    icon: <BookOpen aria-hidden="true" />,
    title: "2. Get plain-language answers",
    body: "Every sentence color-coded by confidence, every claim backed by a citation you can open.",
  },
  {
    icon: <MapPin aria-hidden="true" />,
    title: "3. Act before the deadline",
    body: "Deadlines on a timeline, a draft response to edit and send, and nearby legal aid if you want a human.",
  },
];

const features = [
  {
    icon: <ShieldCheck aria-hidden="true" />,
    title: "Cited, not guessed",
    body: "Every claim links to the statute text it came from. No citation → flagged low-confidence.",
  },
  {
    icon: <Zap aria-hidden="true" />,
    title: "Built for deadlines",
    body: "Rights Radar turns dates in your document into a timeline with reminders.",
  },
  {
    icon: <MessageSquareQuote aria-hidden="true" />,
    title: "Your words, ready to send",
    body: "An editable draft response you can copy, download, and adapt — written in plain language.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AnonymousBanner />
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="grain-overlay relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,64,175,0.08),transparent_60%)]"
          />
          <div className="container relative grid gap-10 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="text-center lg:text-left">
              <h1 className="font-display text-fluid-hero font-semibold tracking-tight text-balance">
                Know your rights. Before the deadline does.
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground lg:mx-0">
                Upload any legal document. Get plain-language answers, cited
                sources, and a draft response — in under 30 seconds.
              </p>
              <div className="mt-8 flex justify-center lg:justify-start">
                <InputTabs />
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <HeroMockup />
            </div>
          </div>
        </section>

        {/* ── Trust strip ───────────────────────────────────── */}
        <section
          aria-label="Trust indicators"
          className="border-y border-border bg-secondary"
        >
          <div className="container grid grid-cols-1 gap-4 py-6 px-5 text-center sm:grid-cols-3">
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-flag-green" aria-hidden="true" />
              Nothing saved without your OK
            </p>
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-deadline" aria-hidden="true" />
              Under 30 seconds
            </p>
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
              Every claim cited
            </p>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────── */}
        <section aria-labelledby="how-heading" className="py-16 md:py-24">
          <div className="container px-5">
            <h2
              id="how-heading"
              className="font-display text-fluid-h2 font-semibold text-center"
            >
              Three steps, zero jargon
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
              Designed for the moment you receive a letter you don&apos;t
              understand — on a phone, with a deadline looming.
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 aspect-[16/10] w-full overflow-hidden rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="flex h-full flex-col justify-between rounded-lg border border-dashed border-primary/40 bg-background/80 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      <span>Upload document</span>
                    </div>
                    <div className="my-auto text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <p className="mt-2 text-[11px] font-medium text-foreground">
                        Drop eviction notice or photo here
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        PNG, JPEG, PDF up to 10MB
                      </p>
                    </div>
                    <div className="rounded bg-primary/10 py-1 text-center text-[10px] font-medium text-primary">
                      Step 1: Upload Document
                    </div>
                  </div>
                </div>
                <h3 className="font-display text-lg font-semibold">1. Upload</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Upload a photo of a notice or letter, or type your situation. No account required.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 aspect-[16/10] w-full overflow-hidden rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="flex h-full flex-col justify-between rounded-lg border border-border bg-background/80 p-3">
                    <div className="flex items-center justify-between border-b border-border/60 pb-1.5 text-[10px]">
                      <span className="font-medium text-foreground">Result Analysis</span>
                      <span className="rounded bg-flag-green/10 px-1.5 py-0.5 font-semibold text-flag-green">High Confidence</span>
                    </div>
                    <div className="space-y-1.5 my-auto">
                      <div className="h-2 w-full rounded bg-flag-green/20" />
                      <div className="h-2 w-4/5 rounded bg-flag-green/20" />
                      <div className="h-2 w-3/5 rounded bg-flag-yellow/20" />
                    </div>
                    <div className="rounded bg-primary/10 py-1 text-center text-[10px] font-medium text-primary">
                      Step 2: Instant Citation Analysis
                    </div>
                  </div>
                </div>
                <h3 className="font-display text-lg font-semibold">2. Get answers</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Every sentence is color-coded by confidence, with every legal claim backed by citations.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 aspect-[16/10] w-full overflow-hidden rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="flex h-full flex-col justify-between rounded-lg border border-border bg-background/80 p-3">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-deadline">7 Days Remaining</span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground">Draft ready</span>
                    </div>
                    <div className="my-auto space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-deadline" />
                        <span className="font-medium">Timeline: Response due Oct 1st</span>
                      </div>
                      <div className="rounded border border-border/50 bg-secondary/60 p-1.5 text-[9px] text-muted-foreground line-clamp-2">
                        Dear Landlord, I am writing regarding the pay-or-quit notice dated...
                      </div>
                    </div>
                    <div className="rounded bg-primary/10 py-1 text-center text-[10px] font-medium text-primary">
                      Step 3: Response Draft & Timeline
                    </div>
                  </div>
                </div>
                <h3 className="font-display text-lg font-semibold">3. Act</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Deadlines mapped on a timeline, ready-to-edit response draft, and legal aid connection options.
                </p>
              </div>
            </div>
      </div>
        </section>

        {/* ── Feature cards ─────────────────────────────────── */}
        <section aria-labelledby="features-heading" className="bg-secondary py-16 md:py-24">
          <div className="container px-5">
            <h2
              id="features-heading"
              className="font-display text-fluid-h2 font-semibold text-center"
            >
              What makes it trustworthy
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {features.map((f, i) => (
                <FeatureCard key={i} {...f} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Disclaimer ────────────────────────────────────── */}
        <section aria-label="Disclaimer" className="py-12">
          <div className="container px-5">
            <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
              MartusAI provides legal information, not legal advice. For your
              specific situation, consult a licensed attorney or your local
              legal aid office. If you are in immediate danger, call
              emergency services.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
