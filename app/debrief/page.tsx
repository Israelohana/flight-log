import { NotebookPen, Sparkles } from "lucide-react";
import { getFlightData } from "@/lib/data";
import { EmptyState, Field, PageHeader, cn } from "@/components/ui";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { key: "tried", label: "מה ניסיתי", code: "ATTEMPTS" },
  { key: "stuck", label: "איפה נתקעתי", code: "TURBULENCE" },
  { key: "learned", label: "מה למדתי", code: "INSIGHT" },
  { key: "next", label: "מה אנסה בשבוע הבא", code: "NEXT HEADING" },
] as const;

export default async function DebriefPage() {
  const { debriefs, courseWeek, entries } = await getFlightData();
  const hasCurrent = debriefs.some((d) => d.week === courseWeek);
  const sheetUrl = process.env.GOOGLE_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}/edit` : null;
  const currentCount = entries.filter((e) => e.week === courseWeek).length;

  return (
    <>
      <PageHeader code="WEEKLY DEBRIEF" title="תחקיר שבועי" subtitle="מה ניסיתי, איפה נתקעתי, מה למדתי ומה הכיוון לשבוע הבא." />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="relative">
          {/* Route spine */}
          <div className="absolute inset-y-2 start-[17px] w-[2px] bg-gradient-to-b from-signal via-signal/30 to-transparent" aria-hidden />

          <div className="space-y-6">
            {!hasCurrent && (
              <div className="relative ps-12">
                <span className="absolute start-0 top-4 grid size-9 place-items-center rounded-full border-2 border-dashed border-signal bg-space font-mono text-[11px] font-bold text-signal shadow-[0_0_20px_rgba(255,107,44,.4)]">
                  {String(courseWeek).padStart(2, "0")}
                </span>
                <div className="rounded-2xl border border-dashed border-signal/40 bg-signal/[.06] p-5">
                  <p className="font-medium">התחקיר של שבוע {courseWeek} עוד לא נכתב</p>
                  <p className="mt-1 text-sm text-ink-2">
                    השבוע תועדו {currentCount} משימות ביומן.
                    {sheetUrl && (
                      <>
                        {" "}
                        <a href={sheetUrl} target="_blank" rel="noreferrer" className="text-signal underline-offset-4 hover:underline">
                          כתיבה בגיליון
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {debriefs.length === 0 && (
              <div className="ps-12">
                <EmptyState icon={<NotebookPen className="size-6" />} title="אין עדיין תחקירים" body="הוסיפו שורה לכל שבוע בלשונית הסיכום השבועי." />
              </div>
            )}

            {debriefs.map((d) => {
              const isCur = d.week === courseWeek;
              return (
                <article key={d.id} className="relative ps-12">
                  <span
                    className={cn(
                      "absolute start-0 top-4 grid size-9 place-items-center rounded-full font-mono text-[11px] font-bold text-white ring-4 ring-space",
                      isCur ? "bg-signal" : "bg-night-4",
                    )}
                  >
                    {d.week ? String(d.week).padStart(2, "0") : "·"}
                  </span>
                  <div className="panel overflow-hidden">
                    <header className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-4">
                      <h2 className="text-lg font-bold">{d.label}</h2>
                      {d.dates && (
                        <span className="num font-mono text-xs text-ink-3" dir="ltr">
                          {d.dates}
                        </span>
                      )}
                    </header>
                    <div className="grid sm:grid-cols-2">
                      {SECTIONS.map((s, i) => (
                        <div
                          key={s.key}
                          className={cn(
                            "p-5",
                            i % 2 === 1 && "sm:border-s sm:border-line",
                            i >= 1 && "border-t border-line",
                            i === 1 && "sm:border-t-0",
                          )}
                        >
                          <p className="font-mono text-[10px] tracking-[0.18em] text-signal" dir="ltr">
                            {s.code}
                          </p>
                          <p className="mb-1.5 text-sm font-medium">{s.label}</p>
                          <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{d[s.key] || "—"}</p>
                        </div>
                      ))}
                    </div>
                    {d.extras.length > 0 && (
                      <div className="grid gap-4 border-t border-line p-5 sm:grid-cols-2">
                        {d.extras.map((x) => (
                          <Field key={x.label} label={x.label}>
                            {x.value}
                          </Field>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-night-3 to-night-2 p-5 text-white">
            <Sparkles className="size-5 text-signal" />
            <p className="mt-3 font-medium">טיוטת תחקיר מ-AI</p>
            <p className="mt-1 text-sm leading-relaxed text-white/60">
              בשלב הבא: כפתור שמייצר טיוטת תחקיר מתוך המשימות שתועדו השבוע. אתם עורכים, והתחקיר נשמר בגיליון.
            </p>
            <span className="mt-4 inline-block rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-white/50" dir="ltr">
              COMING NEXT
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}
