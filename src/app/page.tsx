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
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {steps.map((s, i) => (
                <FeatureCard key={i} {...s} />
              ))}
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
