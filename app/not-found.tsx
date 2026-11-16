import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <p className="font-mono text-[11px] tracking-[0.2em] text-ink-3" dir="ltr">404 · OFF COURSE</p>
      <h1 className="mt-2 text-2xl font-semibold">יצאנו מהמסלול</h1>
      <Link href="/" className="mt-5 inline-block rounded-full bg-signal px-5 py-2.5 text-sm text-white">חזרה למרכז השליטה</Link>
    </div>
  );
}
