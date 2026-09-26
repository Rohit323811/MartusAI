export function ResultsSkeleton() {
  return (
    <div className="container px-5 py-12" aria-hidden="true">
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-7 w-40 animate-pulse rounded-full bg-border" />
        <div className="h-7 w-28 animate-pulse rounded-full bg-border" />
      </div>
      <div className="mt-6 h-10 w-3/4 animate-pulse rounded-xl bg-border" />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-5 animate-pulse rounded bg-border"
            style={{ width: `${70 + ((i * 13) % 30)}%` }}
          />
        ))}
      </div>
      <div className="mt-12 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="h-64 animate-pulse rounded-2xl bg-border" />
        <div className="h-64 animate-pulse rounded-2xl bg-border" />
      </div>
    </div>
  );
}
