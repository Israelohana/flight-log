import { CloudOff, FlaskConical } from "lucide-react";
import type { SourceState } from "@/lib/types";

export function SourceBanner({ source }: { source: SourceState }) {
  if (source.kind === "live") return null;

  if (source.kind === "demo")
    return (
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/25 bg-gold/[.07] px-4 py-3 text-sm">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-gold" />
        <p className="text-ink-2">
          <strong className="font-semibold text-gold">מצב תצוגה.</strong> הנתונים כאן הם דוגמה לבניית הממשק בלבד, לא היומן
          האמיתי. ברגע שמגדירים את החיבור ל-Google Sheets, האפליקציה תציג את הגיליון שלך.
        </p>
      </div>
    );

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose/30 bg-rose/[.08] px-4 py-3 text-sm">
      <CloudOff className="mt-0.5 size-4 shrink-0 text-rose" />
      <p className="text-ink-2">
        <strong className="font-semibold text-rose">אין קשר עם הגיליון.</strong> {source.message}
      </p>
    </div>
  );
}
