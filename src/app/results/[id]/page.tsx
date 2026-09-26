import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ResultsSkeleton } from "@/components/ResultsSkeleton";
import { ResultsView } from "@/components/ResultsView";

export const metadata: Metadata = {
  title: "Your analysis — MartusAI",
};

export default function ResultsPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <Suspense fallback={<ResultsSkeleton />}>
          <ResultsView analysisId={params.id} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
