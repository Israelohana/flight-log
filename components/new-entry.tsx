"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, KeyRound, Loader2, Lock, Plus, X } from "lucide-react";
import { addEntry, type ActionResult } from "@/app/actions";
import { toolCode } from "@/lib/normalize";
import { cn } from "./ui";

const STATUSES = [
  { value: "הושלם", code: "LANDED", dot: "bg-mint" },
  { value: "בתהליך", code: "IN FLIGHT", dot: "bg-signal" },
  { value: "מתוכנן", code: "BOARDING", dot: "bg-sky" },
  { value: "תקוע", code: "DELAYED", dot: "bg-rose" },
];

const BASE_TOOLS = ["Claude", "ChatGPT", "Gemini", "Perplexity", "NotebookLM", "Lovable", "Base44", "Figma"];

export type WriteState = { enabled: boolean; unlocked: boolean };

function Area({ name, label, hint, rows = 2 }: { name: string; label: string; hint?: string; rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13.5px] font-medium text-ink-2">{label}</span>
      <textarea
        name={name}
        rows={rows}
        placeholder={hint}
        className="w-full resize-y rounded-xl border border-line bg-night/70 px-3.5 py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-ink-3/70 focus:border-signal/60 focus:outline-none focus:ring-4 focus:ring-signal/10"
      />
    </label>
  );
}

export function NewEntryButton({
  tools,
  write,
  sheetUrl,
  variant = "hero",
}: {
  tools: string[];
  write: WriteState;
  sheetUrl: string | null;
  variant?: "hero" | "page";
}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Submit manually (not via the form "action" prop) so React does not clear the fields when the save fails.
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => setState(await addEntry(null, fd)));
  };
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [unlocked, setUnlocked] = useState(write.unlocked);

  const toolList = Array.from(new Set([...tools, ...BASE_TOOLS])).slice(0, 12);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setUnlocked(true);
      setOpen(false);
      setToast(state.message ?? "נשמר");
      router.refresh();
      const t = setTimeout(() => setToast(null), 3200);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  const showPasscode = write.enabled && (!unlocked || (state && !state.ok && state.needsPasscode));

  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-full bg-signal font-semibold text-white shadow-[0_10px_30px_-8px_rgba(255,107,44,.8)] transition hover:bg-signal-2 active:scale-[.98]",
              variant === "hero" ? "px-4 py-2 text-sm" : "px-5 py-2.5 text-[15px]",
            )}
          >
            <Plus className="size-4" />
            <span className={variant === "hero" ? "hidden sm:inline" : ""}>משימה חדשה</span>
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-space/75 backdrop-blur-md" />
          <Dialog.Content
            dir="rtl"
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[94dvh] flex-col overflow-hidden rounded-t-3xl border border-line bg-night shadow-[0_40px_80px_-20px_rgba(0,0,0,.9)] focus:outline-none sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[680px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
          >
            <div className="relative shrink-0 overflow-hidden border-b border-dashed border-white/15 bg-gradient-to-b from-night-3 to-night-2 px-6 pb-5 pt-5">
              <div className="pointer-events-none absolute -top-24 end-0 h-48 w-2/3 rounded-full bg-signal/25 blur-3xl" />
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11.5px] tracking-[0.18em] text-signal" dir="ltr">
                    NEW FLIGHT · CHECK-IN
                  </p>
                  <Dialog.Title className="mt-2 text-2xl font-bold">משימה חדשה ביומן</Dialog.Title>
                  <Dialog.Description className="mt-1 text-[14px] text-ink-2">
                    נשמר כשורה חדשה בלשונית יומן הטיסה בגיליון. השבוע והתאריך מתמלאים לבד.
                  </Dialog.Description>
                </div>
                <Dialog.Close className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-ink-2 hover:bg-white/20" aria-label="סגירה">
                  <X className="size-4" />
                </Dialog.Close>
              </div>
            </div>

            <form ref={formRef} onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
              <fieldset disabled={!write.enabled || pending} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 disabled:opacity-60">
                {!write.enabled && (
                  <div className="flex gap-3 rounded-xl border border-gold/25 bg-gold/[.07] p-4 text-[14px] text-ink-2">
                    <Lock className="mt-0.5 size-4 shrink-0 text-gold" />
                    <p>
                      <strong className="text-gold">השמירה עוד לא מופעלת.</strong> מפעילים אותה ב-Vercel עם ENABLE_WRITES=true ו-WRITE_PASSCODE,
                      ונותנים ל-Service Account הרשאת Editor בגיליון.
                      {sheetUrl && (
                        <>
                          {" "}
                          בינתיים אפשר{" "}
                          <a href={sheetUrl} target="_blank" rel="noreferrer" className="text-signal underline-offset-4 hover:underline">
                            לכתוב ישירות בגיליון
                          </a>
                          .
                        </>
                      )}
                    </p>
                  </div>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-[13.5px] font-medium text-ink-2">
                    המשימה / האתגר <span className="text-signal">*</span>
                  </span>
                  <input
                    name="title"
                    required
                    autoFocus
                    placeholder="למשל: סוכן עדכונים אישי לאימונים ותזונה"
                    className="h-12 w-full rounded-xl border border-line bg-night/70 px-3.5 text-[16px] font-medium text-ink placeholder:text-ink-3/70 focus:border-signal/60 focus:outline-none focus:ring-4 focus:ring-signal/10"
                  />
                </label>

                <div>
                  <span className="mb-2 block text-[13.5px] font-medium text-ink-2">כלי AI</span>
                  <div className="flex flex-wrap gap-2">
                    {toolList.map((t) => (
                      <label key={t} className="cursor-pointer">
                        <input type="checkbox" name="tool" value={t} className="peer sr-only" />
                        <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-night/70 px-3 text-[14px] text-ink-2 transition peer-checked:border-signal peer-checked:bg-signal/15 peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-signal">
                          <span className="font-mono text-[11px] font-bold text-ink-3" dir="ltr">
                            {toolCode(t)}
                          </span>
                          {t}
                        </span>
                      </label>
                    ))}
                    <input
                      name="toolOther"
                      placeholder="כלי אחר…"
                      className="h-9 w-32 rounded-full border border-dashed border-line bg-transparent px-3 text-[14px] text-ink placeholder:text-ink-3 focus:border-signal/60 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-[13.5px] font-medium text-ink-2">סטטוס</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {STATUSES.map((s, i) => (
                      <label key={s.value} className="cursor-pointer">
                        <input type="radio" name="status" value={s.value} defaultChecked={i === 0} className="peer sr-only" />
                        <span className="flex h-12 flex-col items-center justify-center rounded-xl border border-line bg-night/70 text-[14px] text-ink-2 transition peer-checked:border-signal peer-checked:bg-signal/10 peer-checked:text-ink">
                          <span className="flex items-center gap-1.5">
                            <span className={cn("size-1.5 rounded-full", s.dot)} />
                            {s.value}
                          </span>
                          <span className="font-mono text-[10px] tracking-wider text-ink-3" dir="ltr">
                            {s.code}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Area name="request" label="מה ביקשתי / פרומפט" hint="מה ניסיתי להשיג ואיך ניסחתי את הבקשה" rows={3} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Area name="worked" label="מה עבד" />
                  <Area name="notWorked" label="מה לא עבד / איפה נתקעתי" />
                </div>
                <Area name="changed" label="מה שיניתי" />
                <div className="rounded-2xl border border-signal/30 bg-signal/[.06] p-4">
                  <Area name="learned" label="💡 מה למדתי" hint="דבר אחד שאני יודע היום ולא ידעתי קודם" />
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                  <label className="block">
                    <span className="mb-1.5 block text-[13.5px] font-medium text-ink-2">קישור לתוצר / שיחה</span>
                    <input
                      name="link"
                      type="url"
                      dir="ltr"
                      placeholder="https://"
                      className="h-11 w-full rounded-xl border border-line bg-night/70 px-3.5 text-[15px] text-ink placeholder:text-ink-3/70 focus:border-signal/60 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[13.5px] font-medium text-ink-2">תאריך</span>
                    <input
                      name="date"
                      placeholder="היום"
                      className="h-11 w-full rounded-xl border border-line bg-night/70 px-3.5 font-mono text-[15px] text-ink placeholder:font-sans placeholder:text-ink-3/70 focus:border-signal/60 focus:outline-none"
                    />
                  </label>
                </div>

                {showPasscode && (
                  <label className="block rounded-2xl border border-line bg-night-2 p-4">
                    <span className="mb-1.5 flex items-center gap-2 text-[13.5px] font-medium text-ink-2">
                      <KeyRound className="size-4 text-signal" />
                      קוד גישה לשמירה (פעם אחת במכשיר הזה)
                    </span>
                    <input
                      name="passcode"
                      type="password"
                      autoComplete="current-password"
                      className="h-11 w-full rounded-xl border border-line bg-night/70 px-3.5 text-[15px] text-ink focus:border-signal/60 focus:outline-none"
                    />
                  </label>
                )}
              </fieldset>

              <div className="shrink-0 border-t border-line bg-night-2/80 px-6 py-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
                {state && !state.ok && <p className="mb-3 text-[14px] text-rose">{state.error}</p>}
                <button
                  type="submit"
                  disabled={!write.enabled || pending}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-signal text-[16px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,107,44,.9)] transition hover:bg-signal-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pending ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
                  {pending ? "שומר בגיליון…" : "שמירה ביומן"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-0 bottom-24 z-50 mx-auto flex w-fit items-center gap-2 rounded-full border border-mint/30 bg-night-2 px-4 py-2.5 text-[14px] text-ink shadow-2xl md:bottom-8"
            role="status"
          >
            <span className="grid size-5 place-items-center rounded-full bg-mint text-space">
              <Check className="size-3.5" />
            </span>
            {toast}
            <span className="font-mono text-[11px] text-mint" dir="ltr">
              LANDED
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
