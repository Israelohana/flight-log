"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="panel mx-auto mt-10 max-w-md p-8 text-center">
      <p className="font-mono text-[11px] tracking-[0.2em] text-rose" dir="ltr">MAYDAY</p>
      <h1 className="mt-2 text-xl font-semibold">משהו השתבש בטעינה</h1>
      <p className="mt-2 text-sm text-ink-2">נסו שוב. אם זה חוזר, בדקו את החיבור לגיליון.</p>
      <button onClick={reset} className="mt-5 rounded-full bg-signal px-5 py-2.5 text-sm text-white">
        נסו שוב
      </button>
    </div>
  );
}
