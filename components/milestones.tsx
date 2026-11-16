"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Check, KeyRound, Plus } from "lucide-react";
import { saveMilestones } from "@/app/actions";
import type { Milestone } from "@/lib/types";
import type { WriteState } from "./new-entry";
import { cn } from "./ui";

export function Milestones({ goalRow, initial, write }: { goalRow: number; initial: Milestone[]; write: WriteState }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [optimistic, setOptimistic] = useOptimistic(list);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [askCode, setAskCode] = useState(false);
  const [code, setCode] = useState("");
  const [draft, setDraft] = useState("");
  const [queued, setQueued] = useState<Milestone[] | null>(null);

  const done = optimistic.filter((m) => m.done).length;
  const nextIdx = optimistic.findIndex((m) => !m.done);

  function commit(next: Milestone[], passcode?: string) {
    setError(null);
    start(async () => {
      setOptimistic(next);
      const res = await saveMilestones(goalRow, next, passcode);
      if (res.ok) {
        setList(next);
        setAskCode(false);
        setQueued(null);
        router.refresh();
      } else {
        setError(res.error);
        if (res.needsPasscode) {
          setAskCode(true);
          setQueued(next);
        }
      }
    });
  }

  const toggle = (i: number) => write.enabled && commit(optimistic.map((m, j) => (j === i ? { ...m, done: !m.done } : m)));

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="label">אבני דרך</p>
        {optimistic.length > 0 && (
          <p className="num font-mono text-[13px] text-ink-2" dir="ltr">
            <span className="text-mint">{done}</span>/{optimistic.length}
          </p>
        )}
      </div>

      {optimistic.length > 0 && (
        <>
          {/* Segmented progress: one segment per milestone, nothing estimated */}
          <div className="mb-4 flex gap-1" aria-hidden>
            {optimistic.map((m, i) => (
              <motion.span
                key={i}
                layout
                className={cn("h-1.5 flex-1 rounded-full", m.done ? "bg-mint shadow-[0_0_8px_rgba(69,224,160,.5)]" : i === nextIdx ? "bg-signal/60" : "bg-white/10")}
              />
            ))}
          </div>

          <ol className="relative space-y-1">
            {optimistic.map((m, i) => {
              const isNext = i === nextIdx;
              return (
                <li key={`${m.label}-${i}`}>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    disabled={!write.enabled || pending}
                    aria-pressed={m.done}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start transition",
                      write.enabled && "hover:bg-white/5",
                      !write.enabled && "cursor-default",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full border-2 transition",
                        m.done ? "border-mint bg-mint text-space" : isNext ? "border-signal" : "border-line",
                      )}
                    >
                      {m.done ? <Check className="size-3.5" strokeWidth={3} /> : isNext ? <span className="size-2 animate-blink rounded-full bg-signal" /> : null}
                    </span>
                    <span className={cn("flex-1 text-[15px]", m.done ? "text-ink-3 line-through decoration-ink-3/50" : "text-ink")}>{m.label}</span>
                    {isNext && (
                      <span className="font-mono text-[10.5px] tracking-wider text-signal" dir="ltr">
                        NEXT
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      )}

      {optimistic.length === 0 && (
        <p className="text-[14px] leading-relaxed text-ink-2">
          {write.enabled ? "עוד אין אבני דרך. הוסיפו את הראשונה:" : "עוד אין אבני דרך. אפשר להוסיף אותן בעמודה \"אבני דרך\" בגיליון, אחת בכל שורה, ולסמן ✓ לפני מה שהושלם."}
        </p>
      )}

      {write.enabled && (
        <form
          className="mt-2 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            commit([...optimistic, { label: draft.trim(), done: false }]);
            setDraft("");
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="אבן דרך חדשה…"
            className="h-10 flex-1 rounded-xl border border-dashed border-line bg-transparent px-3 text-[14px] text-ink placeholder:text-ink-3 focus:border-signal/60 focus:outline-none"
          />
          <button type="submit" disabled={pending} className="grid size-10 place-items-center rounded-xl bg-white/5 text-ink-2 hover:bg-signal hover:text-white" aria-label="הוספה">
            <Plus className="size-4" />
          </button>
        </form>
      )}

      {askCode && (
        <form
          className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-night p-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (queued) commit(queued, code);
          }}
        >
          <KeyRound className="ms-1 size-4 shrink-0 text-signal" />
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="קוד גישה לשמירה"
            className="h-9 flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-3 focus:outline-none"
          />
          <button className="h-9 rounded-lg bg-signal px-3 text-[13px] font-semibold text-white">אישור</button>
        </form>
      )}
      {error && <p className="mt-2 text-[13px] text-rose">{error}</p>}
    </div>
  );
}
