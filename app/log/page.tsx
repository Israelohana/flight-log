import { getFlightData } from "@/lib/data";
import { canWrite } from "@/app/actions";
import { NewEntryButton } from "@/components/new-entry";
import { splitTools } from "@/lib/normalize";
import { LogExplorer } from "@/components/log-explorer";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "יומן הטיסה" };

export default async function LogPage() {
  const [{ entries }, write] = await Promise.all([getFlightData(), canWrite()]);
  const sheetUrl = process.env.GOOGLE_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}/edit` : null;
  return (
    <>
      <PageHeader
        code="FLIGHT LOG · ALL ENTRIES"
        title="יומן הטיסה"
        subtitle="כל ההתנסויות שלי עם AI. לחיצה על כרטיס פותחת את הפירוט המלא: מה ביקשתי, מה עבד, מה שיניתי ומה למדתי."
        action={<NewEntryButton tools={Array.from(new Set(entries.flatMap((e) => splitTools(e.tool))))} write={write} sheetUrl={sheetUrl} variant="page" />}
      />
      <LogExplorer entries={entries} />
    </>
  );
}
