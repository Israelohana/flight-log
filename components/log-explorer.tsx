"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { splitTools, toolCode } from "@/lib/normalize";
import type { LogEntry, StatusTone } from "@/lib/types";
import { BoardingPass } from "./boarding-pass";
import { EmptyState, TONE, cn } from "./ui";

const TONES: StatusTone[] = ["landed", "inflight", "boarding", "delayed"];

export function LogExplorer({ entries }: { entries: LogEntry[] }) {
  const [q, setQ] = useState("");
  const [tone, setTone] = useState<StatusTone | "all">("all");
  const [tool, setTool] = useState<string>("all");

  const tools = useMemo(() => {
    const m = new Map<string, number>();
    entries.forEach((e) => splitTools(e.tool).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const toneCounts = useMemo(() => {
    const c: Partial<Record<StatusTone, number>> = {};
    entries.forEach((e) => (c[e.tone] = (c[e.tone] ?? 0) + 1));
    return c;
  }, [entries]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (tone !== "all" && e.tone !== tone) return false;
      if (tool !== "all" && !splitTools(e.tool).includes(tool)) return false;
      if (!needle) return true;
      return [e.title, e.description, e.tool, e.request, e.worked, e.notWorked, e.changed, e.learned, e.status]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [entries, q, tone, tool]);

  const filtered = q || tone !== "all" || tool !== "all";

  return (
    <div>
      {/* Controls */}
      <div className="sticky top-16 z-20 -mx-4 mb-6 space-y-3 bg-space/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <label className="relative block">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש במשימות, בפרומפטים ובתובנות…"
            className="h-12 w-full rounded-2xl border border-line bg-night-2/80 pe-10 ps-11 text-[15px] text-ink placeholder:text-ink-3 focus:border-signal/60 focus:outline-none focus:ring-4 focus:ring-signal/10"
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink" aria-label="ניקוי חיפוש">
              <X className="size-4" />
            </button>
          )}
        </label>

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <Chip on={tone === "all"} onClick={() => setTone("all")}>
            כל הסטטוסים <span className="num opacity-50">{entries.length}</span>
          </Chip>
          {TONES.filter((t) => toneCounts[t]).map((t) => (
            <Chip key={t} on={tone === t} onClick={() => setTone(tone === t ? "all" : t)}>
              <span className={cn("size-1.5 rounded-full", TONE[t].dot)} />
              <span className="font-mono text-[11px] tracking-wider" dir="ltr">
                {TONE[t].code}
              </span>
              <span className="num opacity-50">{toneCounts[t]}</span>
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" />
          {tools.map(([t, n]) => (
            <Chip key={t} on={tool === t} onClick={() => setTool(tool === t ? "all" : t)}>
              <span className="font-mono text-[11px] font-semibold" dir="ltr">
                {toolCode(t)}
              </span>
              {t}
              <span className="num opacity-50">{n}</span>
            </Chip>
          ))}
        </div>
      </div>

      {filtered && (
        <p className="mb-3 text-sm text-ink-2">
          {list.length} מתוך {entries.length} משימות
          <button
            className="ms-3 text-signal hover:underline"
            onClick={() => {
              setQ("");
              setTone("all");
              setTool("all");
            }}
          >
            ניקוי סינון
          </button>
        </p>
      )}

      {list.length ? (
        <motion.div layout className="grid gap-3 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {list.map((e, i) => (
              <motion.div key={e.id} layout exit={{ opacity: 0, scale: 0.97 }}>
                <BoardingPass entry={e} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState
          title={entries.length ? "לא נמצאו משימות" : "היומן עדיין ריק"}
          body={entries.length ? "נסו מילת חיפוש אחרת או נקו את הסינון." : "הוסיפו שורה ראשונה בלשונית יומן הטיסה בגיליון."}
        />
      )}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm transition",
        on ? "border-signal bg-signal text-white shadow-[0_6px_18px_-6px_rgba(255,107,44,.7)]" : "border-line bg-night-2/70 text-ink-2 hover:border-white/20 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
