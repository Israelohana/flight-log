"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { BookOpen, Flag, Gauge, RefreshCw, NotebookPen } from "lucide-react";
import { refreshSheet } from "@/app/actions";
import type { SourceState } from "@/lib/types";
import { cn } from "./ui";

const NAV = [
  { href: "/", label: "מרכז שליטה", code: "MISSION CONTROL", icon: Gauge },
  { href: "/log", label: "יומן הטיסה", code: "FLIGHT LOG", icon: BookOpen },
  { href: "/destinations", label: "יעדים", code: "DESTINATIONS", icon: Flag },
  { href: "/debrief", label: "תחקיר שבועי", code: "DEBRIEF", icon: NotebookPen },
];

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Flight Log — דף הבית">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <defs>
          <linearGradient id="logo-g" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#E2470F" />
            <stop offset="1" stopColor="#FF8A4C" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="10" fill="url(#logo-g)" />
        <path d="M6 23 C 12 22, 17 16, 24 10" stroke="white" strokeOpacity=".45" strokeWidth="1.4" strokeDasharray="2 2.5" fill="none" />
        <path d="M26 8 l-6.5 1.6 2.4 2.4 -1.6 6.5z" fill="white" />
      </svg>
      <div className="leading-none" dir="ltr">
        <p className="font-mono text-[13px] font-bold tracking-[0.24em]">FLIGHT LOG</p>
        <p className="mt-1 font-mono text-[9.5px] tracking-[0.2em] text-ink-3">AI LEARNING JOURNEY</p>
      </div>
    </Link>
  );
}

export function SourcePill({ source }: { source: SourceState }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const live = source.kind === "live";
  const meta =
    source.kind === "live"
      ? { label: "LIVE", text: "מחובר לגיליון", dot: "bg-mint animate-blink shadow-[0_0_8px_#45E0A0]" }
      : source.kind === "demo"
        ? { label: "DEMO", text: "נתוני תצוגה", dot: "bg-gold" }
        : { label: "NO SIGNAL", text: "שגיאת חיבור", dot: "bg-rose" };

  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-night-2/80 p-1 ps-3 backdrop-blur">
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      <span className="font-mono text-[10.5px] tracking-[0.14em]" dir="ltr">
        {meta.label}
      </span>
      <span className="hidden text-xs text-ink-2 md:inline">· {meta.text}</span>
      <button
        type="button"
        disabled={!live || pending}
        onClick={() =>
          start(async () => {
            await refreshSheet();
            router.refresh();
          })
        }
        className="ms-1 grid size-7 place-items-center rounded-full text-ink-2 transition hover:bg-white/10 hover:text-ink disabled:opacity-40"
        aria-label="רענון נתונים מהגיליון"
        title={live ? "רענון מהגיליון" : "הגיליון עדיין לא מחובר"}
      >
        <RefreshCw className={cn("size-3.5", pending && "animate-spin")} />
      </button>
    </div>
  );
}

export function Shell({ source, children }: { source: SourceState; children: React.ReactNode }) {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-white/[.06] bg-space/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 rounded-full border border-line bg-night-2/60 p-1 md:flex" aria-label="ניווט ראשי">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-medium transition",
                  active(n.href) ? "bg-signal text-white shadow-[0_6px_20px_-6px_rgba(255,107,44,.7)]" : "text-ink-2 hover:bg-white/5 hover:text-ink",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <SourcePill source={source} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 md:pb-20">{children}</main>

      {/* Mobile tab bar */}
      <nav
        className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl border border-white/10 bg-night-2/90 p-1.5 shadow-[0_20px_50px_-10px_rgba(0,0,0,.9)] backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
        aria-label="ניווט ראשי"
      >
        {NAV.map((n) => {
          const Icon = n.icon;
          const on = active(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] transition",
                on ? "bg-signal/15 text-white" : "text-ink-3",
              )}
            >
              <Icon className={cn("size-[18px]", on && "text-signal")} />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
