export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="טוען נתונים מהגיליון">
      <div className="h-[380px] animate-pulse rounded-[32px] border border-line bg-night-2" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-line bg-night-2" />
        ))}
      </div>
      <p className="text-center font-mono text-[11px] tracking-[0.2em] text-ink-3" dir="ltr">
        ESTABLISHING CONTACT…
      </p>
    </div>
  );
}
