import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { StatusTone } from "@/lib/types";
import type { ReactNode } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TONE: Record<StatusTone, { code: string; dot: string; chip: string; text: string; hex: string }> = {
  landed: { code: "LANDED", dot: "bg-mint", chip: "bg-mint/10 text-mint ring-mint/25", text: "text-mint", hex: "#45E0A0" },
  inflight: { code: "IN FLIGHT", dot: "bg-signal", chip: "bg-signal/10 text-signal-2 ring-signal/30", text: "text-signal", hex: "#FF6B2C" },
  boarding: { code: "BOARDING", dot: "bg-sky", chip: "bg-sky/10 text-sky ring-sky/25", text: "text-sky", hex: "#6FA8FF" },
  delayed: { code: "DELAYED", dot: "bg-rose", chip: "bg-rose/10 text-rose ring-rose/25", text: "text-rose", hex: "#FF5E6A" },
  unknown: { code: "STATUS", dot: "bg-ink-3", chip: "bg-white/5 text-ink-2 ring-white/10", text: "text-ink-3", hex: "#5D6A84" },
};

/** Flight-status chip: the Hebrew status as written in the sheet + an aviation code. */
export function StatusChip({ tone, label, className }: { tone: StatusTone; label?: string; className?: string }) {
  const t = TONE[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium ring-1 ring-inset", t.chip, className)}>
      <span className={cn("size-1.5 rounded-full", t.dot, tone === "inflight" && "animate-blink shadow-[0_0_8px_#FF6B2C]")} />
      {label || "ללא סטטוס"}
      <span className="font-mono text-[10px] tracking-wider opacity-70" dir="ltr">
        {t.code}
      </span>
    </span>
  );
}

export function PageHeader({ code, title, subtitle, action }: { code: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 pb-8 pt-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] text-signal" dir="ltr">
          <span className="h-px w-6 bg-signal" />
          {code}
        </p>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight sm:text-[44px]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-2">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({ title, body, icon }: { title: string; body: string; icon?: ReactNode }) {
  return (
    <div className="panel flex flex-col items-center gap-2 px-6 py-14 text-center">
      {icon && <div className="mb-2 text-ink-3">{icon}</div>}
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-ink-2">{body}</p>
    </div>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="label mb-1.5">{label}</p>
      <div className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{children}</div>
    </div>
  );
}

/** Split-flap style code, one tile per character. */
export function FlapCode({ code, className }: { code: string; className?: string }) {
  return (
    <span className={cn("inline-flex gap-[3px]", className)} dir="ltr" aria-label={code}>
      {code.split("").map((ch, i) => (
        <span
          key={i}
          className="relative grid h-[1.6em] w-[1.15em] animate-flap place-items-center rounded-[4px] bg-gradient-to-b from-night-4 to-night-3 font-mono font-semibold text-ink shadow-[inset_0_-1px_0_rgba(0,0,0,.5)]"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <span className="absolute inset-x-0 top-1/2 h-px bg-black/50" />
          {ch}
        </span>
      ))}
    </span>
  );
}
