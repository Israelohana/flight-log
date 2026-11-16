import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getFlightData } from "@/lib/data";
import { canWrite } from "@/app/actions";
import { NewEntryButton } from "@/components/new-entry";
import { splitTools } from "@/lib/normalize";
import { parseDate } from "@/lib/normalize";
import { FlightRoute, type Waypoint } from "@/components/flight-route";
import { BoardingPass } from "@/components/boarding-pass";
import { EmptyState, StatusChip, TONE, cn } from "@/components/ui";

export const dynamic = "force-dynamic";

const SHEET_URL = process.env.GOOGLE_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}/edit` : null;

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en", { hour: "numeric", hour12: false, timeZone: "Asia/Jerusalem" }).format(new Date()));
  if (h < 5) return "לילה טוב";
  if (h < 12) return "בוקר טוב";
  if (h < 17) return "צהריים טובים";
  if (h < 21) return "ערב טוב";
  return "לילה טוב";
}

function ddmm(ms: number) {
  const d = new Date(ms);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function MissionControl() {
  const [{ entries, goals, debriefs, courseWeek, source }, write] = await Promise.all([getFlightData(), canWrite()]);
  const knownTools = Array.from(new Set(entries.flatMap((e) => splitTools(e.tool))));
  const start = parseDate(process.env.COURSE_START ?? "2026-11-09") ?? Date.UTC(2026, 10, 9);

  const landed = entries.filter((e) => e.tone === "landed").length;
  const active = entries.filter((e) => e.tone === "inflight" || e.tone === "delayed");
  const lastWeek = Math.max(courseWeek, ...entries.map((e) => e.week ?? 0), ...debriefs.map((d) => d.week ?? 0));
  const waypoints: Waypoint[] = Array.from({ length: Math.max(lastWeek + 1, 3) }, (_, i) => ({
    week: i + 1,
    date: ddmm(start + i * 7 * 86400000),
    count: entries.filter((e) => e.week === i + 1).length,
  }));
  const thisWeek = entries.filter((e) => e.week === courseWeek).length;
  const tools = new Set(entries.flatMap((e) => e.tool.split(/[,/+|]/).map((t) => t.trim())).filter(Boolean)).size;

  const instruments = [
    { code: "LANDED", label: "משימות שנחתו", v: landed, tone: "text-mint" },
    { code: "IN FLIGHT", label: "באוויר עכשיו", v: active.length, tone: "text-signal" },
    { code: `WK${String(courseWeek).padStart(2, "0")}`, label: "תועדו השבוע", v: thisWeek, tone: "text-ink" },
    { code: "TOOLS", label: "כלים במסע", v: tools, tone: "text-sky" },
  ];

  return (
    <div className="space-y-10">
      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden rounded-[32px] border border-line bg-gradient-to-b from-night-2 via-night to-[#050A15]">
        <div className="hud-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -top-40 end-0 h-80 w-[60%] rounded-full bg-signal/20 blur-[100px]" />

        <div className="relative px-5 pt-5 sm:px-10 sm:pt-9">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[11px] tracking-[0.24em] text-ink-3" dir="ltr">
              <span className="text-signal">FS-001</span> · FLYING SOLO<span className="hidden sm:inline"> · CLASS A</span>
            </p>
            <NewEntryButton tools={knownTools} write={write} sheetUrl={SHEET_URL} />
          </div>

          <h1 className="mt-4 text-[26px] font-bold leading-[1.1] tracking-tight sm:mt-6 sm:text-[56px] sm:leading-[1.05]">
            {greeting()}, ישראל
            <span className="mt-0.5 block bg-gradient-to-l from-signal-2 via-signal to-ink-2 bg-clip-text text-transparent sm:mt-1">
              <span className="sm:hidden">שבוע {courseWeek} במסע</span>
              <span className="hidden sm:inline">טס בשבוע {courseWeek} של המסע.</span>
            </span>
          </h1>

          {/* Origin → destination */}
          <div className="mt-5 flex items-end justify-between gap-4 sm:mt-8">
            <div>
              <p className="label">המראה</p>
              <p className="font-mono text-[28px] font-bold leading-tight tracking-tight sm:text-6xl" dir="ltr">
                SDR
              </p>
              <p className="mt-0.5 text-[13px] text-ink-2 sm:mt-1 sm:text-sm">שדרות · {ddmm(start)}</p>
            </div>
            <div className="hidden flex-1 flex-col items-center pb-3 sm:flex">
              <p className="font-mono text-[11px] tracking-[0.2em] text-ink-3" dir="ltr">
                EN ROUTE · {entries.length} LOGGED
              </p>
            </div>
            <div className="text-end">
              <p className="label">יעד</p>
              <p className="font-mono text-[28px] font-bold leading-tight tracking-tight text-sky sm:text-6xl" dir="ltr">
                APM
              </p>
              <p className="mt-0.5 text-[13px] text-ink-2 sm:mt-1 sm:text-sm">AI Product Manager</p>
            </div>
          </div>
        </div>

        <div className="relative -mt-4 hidden sm:block">
          <FlightRoute waypoints={waypoints} current={courseWeek} />
        </div>
        <div className="relative -mt-6 sm:hidden">
          <FlightRoute waypoints={waypoints} current={courseWeek} compact />
        </div>

        {/* Cockpit instruments */}
        <dl className="relative grid grid-cols-2 gap-px border-t border-white/[.06] bg-white/[.06] sm:grid-cols-4">
          {instruments.map((s) => (
            <div key={s.code} className="bg-[#050A15]/95 px-4 py-3.5 sm:px-8 sm:py-5">
              <dt className="flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-[0.18em] text-ink-3" dir="ltr">
                  {s.code}
                </span>
                <span className="flex gap-[3px]" aria-hidden>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className={cn("h-2 w-[2px] rounded-full", i < Math.min(6, s.v) ? "bg-current opacity-80" : "bg-white/10", s.tone)} />
                  ))}
                </span>
              </dt>
              <dd className="mt-1 flex items-baseline gap-2 sm:mt-2">
                <span className={cn("num font-mono text-[28px] font-semibold sm:text-4xl", s.tone)}>{String(s.v).padStart(2, "0")}</span>
                <span className="text-xs text-ink-2 sm:text-sm">{s.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Recent activity */}
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="label" dir="ltr">
                RECENT ACTIVITY
              </p>
              <h2 className="mt-1 text-2xl font-bold">פעילות אחרונה</h2>
            </div>
            <Link href="/log" className="inline-flex items-center gap-1 text-sm text-ink-2 transition hover:text-signal">
              כל היומן <ArrowLeft className="size-4" />
            </Link>
          </div>
          {entries.length ? (
            <div className="space-y-3">
              {entries.slice(0, 4).map((e, i) => (
                <BoardingPass key={e.id} entry={e} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={source.kind === "error" ? "אין נתונים להצגה" : "היומן עדיין ריק"}
              body={source.kind === "error" ? "בדקו את החיבור לגיליון ונסו לרענן." : "הוסיפו שורה ראשונה בלשונית יומן הטיסה, והיא תופיע כאן."}
            />
          )}
        </section>

        <div className="space-y-6">
          {/* In flight */}
          <section className="panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">באוויר עכשיו</h2>
              <span className="label" dir="ltr">
                ACTIVE
              </span>
            </div>
            {active.length ? (
              <ul className="space-y-3">
                {active.slice(0, 5).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3">
                    <span className="line-clamp-2 text-sm">{e.title}</span>
                    <StatusChip tone={e.tone} label={e.status} className="shrink-0" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-2">אין כרגע משימות פתוחות.</p>
            )}
          </section>

          {/* Destinations */}
          <section className="panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">היעדים שלי</h2>
              <Link href="/destinations" className="label transition hover:text-signal" dir="ltr">
                DESTINATIONS →
              </Link>
            </div>
            {goals.length ? (
              <ol className="space-y-4">
                {goals.slice(0, 3).map((g, i) => (
                  <li key={g.id} className="flex gap-3">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-night-4 font-mono text-xs font-bold text-ink">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{g.title}</p>
                      <p className={cn("mt-1 font-mono text-[11.5px] tracking-wider", TONE[g.tone].text)} dir="ltr">
                        {TONE[g.tone].code}
                        {g.milestones.length > 0 && ` · ${g.milestones.filter((m) => m.done).length}/${g.milestones.length}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-ink-2">עוד לא הוגדרו מטרות בלשונית המטרות.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
