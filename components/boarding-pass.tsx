"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "motion/react";
import { ArrowUpLeft, X } from "lucide-react";
import { splitTools, toolCode } from "@/lib/normalize";
import type { LogEntry } from "@/lib/types";
import { Field, StatusChip, TONE, cn } from "./ui";

function flightNo(e: LogEntry) {
  return `FL-${String(e.row - 1).padStart(3, "0")}`;
}

export function BoardingPass({ entry, index = 0, compact = false }: { entry: LogEntry; index?: number; compact?: boolean }) {
  const tone = TONE[entry.tone];
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2 }}
          className="glow-border group relative flex w-full overflow-hidden rounded-2xl border border-line bg-gradient-to-l from-night-2 to-night text-start shadow-[0_20px_40px_-28px_rgba(0,0,0,.9)] transition-colors"
        >
          {/* Status rail */}
          <span className={cn("absolute inset-y-4 start-0 w-[3px] rounded-e-full", tone.dot)} style={{ boxShadow: `0 0 12px ${tone.hex}` }} />

          {/* Main */}
          <div className="min-w-0 flex-1 p-4 ps-5 sm:p-5 sm:ps-6">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <span className="font-mono text-[11.5px] tracking-[0.16em] text-ink-3" dir="ltr">
                {flightNo(entry)}
                {entry.week ? ` · WK${String(entry.week).padStart(2, "0")}` : ""}
              </span>
              <StatusChip tone={entry.tone} label={entry.status} />
            </div>
            <h3 className="line-clamp-2 text-[17px] font-bold leading-snug">{entry.title}</h3>
            {!compact && (entry.description || entry.request) && (
              <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-ink-2">{entry.description || entry.request}</p>
            )}
          </div>

          {/* Perforation with notches */}
          <div className="relative w-px self-stretch border-s border-dashed border-white/15">
            <span className="absolute -top-2.5 start-1/2 size-5 -translate-x-1/2 rounded-full border border-line bg-space rtl:translate-x-1/2" />
            <span className="absolute -bottom-2.5 start-1/2 size-5 -translate-x-1/2 rounded-full border border-line bg-space rtl:translate-x-1/2" />
          </div>

          {/* Stub */}
          <div className="flex w-[104px] shrink-0 flex-col justify-between p-3.5 sm:w-[124px] sm:p-4">
            <div>
              <p className="label">כלי</p>
              <p className="font-mono text-[26px] font-bold leading-tight tracking-wide text-ink transition group-hover:text-signal" dir="ltr">
                {toolCode(entry.tool)}
              </p>
              <p className="truncate text-[12.5px] text-ink-2" title={entry.tool}>
                {splitTools(entry.tool)[0] || "—"}
                {splitTools(entry.tool).length > 1 && <span className="text-signal"> +{splitTools(entry.tool).length - 1}</span>}
              </p>
            </div>
            <div className="mt-3">
              <p className="label">תאריך</p>
              <p
                className={cn("num line-clamp-2 text-[13px] leading-snug text-ink", /[\u0590-\u05FF]/.test(entry.date) ? "font-sans" : "font-mono")}
                title={entry.date}
                dir={/[\u0590-\u05FF]/.test(entry.date) ? "rtl" : "ltr"}
              >
                {entry.date || "—"}
              </p>
            </div>
          </div>
          <ArrowUpLeft className="absolute bottom-3 start-5 size-4 text-signal opacity-0 transition group-hover:opacity-100" />
        </motion.button>
      </Dialog.Trigger>
      <EntryDetail entry={entry} />
    </Dialog.Root>
  );
}

function EntryDetail({ entry }: { entry: LogEntry }) {
  const blocks: [string, string][] = [
    ["מה ביקשתי", entry.request],
    ["מה עבד", entry.worked],
    ["מה לא עבד", entry.notWorked],
    ["מה שיניתי", entry.changed],
  ];
  const filled = blocks.filter(([, v]) => v);

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-space/70 backdrop-blur-md" />
      <Dialog.Content
        dir="rtl"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-3xl border border-line bg-night shadow-[0_40px_80px_-20px_rgba(0,0,0,.9)] focus:outline-none sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[640px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
      >
        {/* Ticket header */}
        <div className="relative overflow-hidden rounded-t-3xl border-b border-dashed border-white/15 bg-gradient-to-b from-night-3 to-night-2 px-6 pb-6 pt-5 text-white">
          <div className="pointer-events-none absolute -top-24 end-0 h-48 w-2/3 rounded-full bg-signal/25 blur-3xl" />
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
          <div className="flex items-start justify-between gap-4">
            <p className="relative font-mono text-[11px] tracking-[0.2em] text-white/50" dir="ltr">
              <span className="text-signal">BOARDING PASS</span> · {flightNo(entry)}
            </p>
            <Dialog.Close className="grid size-8 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20" aria-label="סגירה">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <Dialog.Title className="relative mt-3 text-2xl font-bold leading-tight">{entry.title}</Dialog.Title>
          {entry.description && <Dialog.Description className="mt-1.5 text-white/65">{entry.description}</Dialog.Description>}
          <div className="relative mt-5 grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="font-mono text-[10px] tracking-[0.18em] text-white/40">כלי</p>
              <p className="mt-1 font-mono text-lg" dir="ltr">
                {toolCode(entry.tool)}
              </p>
              <p className="text-xs text-white/50">{entry.tool || "—"}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.18em] text-white/40">תאריך</p>
              <p
                className={cn("num mt-1 text-sm leading-snug", /[\u0590-\u05FF]/.test(entry.date) ? "font-sans" : "font-mono")}
                dir={/[\u0590-\u05FF]/.test(entry.date) ? "rtl" : "ltr"}
              >
                {entry.date || "—"}
              </p>
              {entry.week && <p className="text-xs text-white/50">שבוע {entry.week}</p>}
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.18em] text-white/40">סטטוס</p>
              <p className={cn("mt-1 font-mono text-lg", TONE[entry.tone].text)} dir="ltr">
                {TONE[entry.tone].code}
              </p>
              <p className="text-xs text-white/50">{entry.status || "—"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {filled.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              {filled.map(([k, v]) => (
                <Field key={k} label={k}>
                  {v}
                </Field>
              ))}
            </div>
          )}

          {entry.learned && (
            <div className="rounded-2xl border border-signal/30 bg-signal/[.08] p-4">
              <p className="label mb-1.5 !text-signal">מה למדתי</p>
              <p className="whitespace-pre-line text-[15px] leading-relaxed">{entry.learned}</p>
            </div>
          )}

          {entry.extras.length > 0 && (
            <div className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
              {entry.extras.map((x) => (
                <Field key={x.label} label={x.label}>
                  {x.value}
                </Field>
              ))}
            </div>
          )}

          {!filled.length && !entry.learned && !entry.extras.length && (
            <p className="text-sm text-ink-2">עדיין לא תועד פירוט למשימה הזו בגיליון.</p>
          )}

          {entry.link && /^https?:\/\//.test(entry.link) && (
            <a
              href={entry.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl bg-signal px-4 py-3 text-sm font-semibold text-white transition hover:bg-signal-2"
            >
              פתיחת התוצר
              <ArrowUpLeft className="size-4" />
            </a>
          )}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
