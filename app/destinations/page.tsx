import { MapPin } from "lucide-react";
import { getFlightData } from "@/lib/data";
import { canWrite } from "@/app/actions";
import { Milestones } from "@/components/milestones";
import { EmptyState, FlapCode, PageHeader, StatusChip, TONE, cn } from "@/components/ui";

export const dynamic = "force-dynamic";

const GATES = ["A1", "B2", "C3", "D4", "E5"];
const CODES = ["DST", "MTH", "MVP", "GOL", "ARV"];

/** A short code from the goal's own words when it has a Latin term, otherwise a stable fallback. */
function codeFor(title: string, i: number) {
  if (/product manager/i.test(title)) return "APM";
  if (/mvp/i.test(title)) return "MVP";
  if (/מתודולוגי/.test(title)) return "MTH";
  return CODES[i] ?? `G0${i + 1}`;
}

export default async function DestinationsPage() {
  const [{ goals }, write] = await Promise.all([getFlightData(), canWrite()]);

  return (
    <>
      <PageHeader
        code="MY DESTINATIONS"
        title="היעדים שלי"
        subtitle="המטרות האישיות שהגדרתי לקורס. ההתקדמות נמדדת באבני דרך שמסמנים כהושלמו, בלי אחוזים מומצאים."
      />

      {!goals.length ? (
        <EmptyState icon={<MapPin className="size-6" />} title="עוד לא הוגדרו יעדים" body="הוסיפו את המטרות שלכם בלשונית המטרות בגיליון." />
      ) : (
        <>
          {/* Departures board */}
          <div className="panel mb-8 overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="font-mono text-[11px] tracking-[0.22em] text-gold" dir="ltr">
                DEPARTURES · יעדים
              </p>
              <span className="size-1.5 animate-blink rounded-full bg-gold shadow-[0_0_8px_#FFC043]" />
            </div>
            <div className="divide-y divide-line">
              {goals.map((g, i) => (
                <div key={g.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[90px_auto_1fr_auto]">
                  <span className="hidden font-mono text-sm text-ink-3 sm:block" dir="ltr">
                    GATE {GATES[i] ?? i + 1}
                  </span>
                  <FlapCode code={codeFor(g.title, i)} className="text-lg sm:text-xl" />
                  <p className="truncate text-[15px] font-medium">{g.title}</p>
                  <span className="flex items-center gap-3">
                    {g.milestones.length > 0 && (
                      <span className="num hidden font-mono text-[13px] text-ink-2 sm:inline" dir="ltr">
                        <span className="text-mint">{g.milestones.filter((m) => m.done).length}</span>/{g.milestones.length}
                      </span>
                    )}
                    <span className={cn("font-mono text-xs tracking-[0.16em]", TONE[g.tone].text)} dir="ltr">
                      {TONE[g.tone].code}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Destination cards */}
          <div className="grid gap-5 lg:grid-cols-3">
            {goals.map((g, i) => {
              const t = TONE[g.tone];
              return (
                <article key={g.id} className="glow-border panel flex flex-col overflow-hidden">
                  <div className="relative overflow-hidden border-b border-dashed border-white/10 bg-gradient-to-b from-night-3/80 to-transparent px-5 pb-5 pt-5">
                    <div className="pointer-events-none absolute -top-16 end-0 size-40 rounded-full blur-3xl" style={{ background: `${t.hex}33` }} />
                    <div className="relative flex items-start justify-between gap-3">
                      <div>
                        <p className="label">יעד {String.fromCharCode(1488 + i)}׳</p>
                        <p className="mt-1 font-mono text-4xl font-bold tracking-tight" dir="ltr">
                          {codeFor(g.title, i)}
                        </p>
                      </div>
                      <StatusChip tone={g.tone} label={g.status} />
                    </div>
                    <h2 className="relative mt-3 text-lg font-bold leading-snug">{g.title}</h2>
                  </div>

                  <div className="flex flex-1 flex-col gap-5 p-5">
                    {g.why && (
                      <div>
                        <p className="label mb-1.5">למה זה חשוב לי</p>
                        <p className="text-[15px] leading-relaxed text-ink-2">{g.why}</p>
                      </div>
                    )}

                    {g.metric && (
                      <div className="rounded-xl border border-line bg-night/60 p-4">
                        <p className="label mb-1.5 !text-sky">איך מודדים הצלחה</p>
                        <p className="text-[15px] leading-relaxed">{g.metric}</p>
                      </div>
                    )}

                    {g.progress !== null && (
                      <div>
                        <div className="mb-1.5 flex items-baseline justify-between">
                          <p className="label">התקדמות</p>
                          <p className="num font-mono text-sm">{g.progress}%</p>
                        </div>
                        <div className="relative h-1.5 rounded-full bg-white/10">
                          <div className={cn("absolute inset-y-0 start-0 rounded-full", t.dot)} style={{ width: `${g.progress}%` }} />
                        </div>
                      </div>
                    )}

                    <Milestones goalRow={g.row} initial={g.milestones} write={write} />

                    {g.notes && (
                      <div className="mt-auto border-t border-line pt-4">
                        <p className="label mb-1.5">התקדמות והערות</p>
                        <p className="text-sm leading-relaxed text-ink-2">{g.notes}</p>
                      </div>
                    )}

                    {g.extras.map((x) => (
                      <div key={x.label}>
                        <p className="label mb-1.5">{x.label}</p>
                        <p className="text-sm text-ink-2">{x.value}</p>
                      </div>
                    ))}

                    {g.target && (
                      <p className="font-mono text-xs text-ink-2">
                        <span className="text-ink-3">ETA · </span>
                        {g.target}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
