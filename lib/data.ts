import "server-only";
import { unstable_cache } from "next/cache";
import { demoDebrief, demoGoals, demoLog } from "./demo";
import { parseDate, toDebriefs, toEntries, toGoals, weekOf } from "./normalize";
import { readTabs, sheetsConfigured } from "./sheets";
import type { FlightData } from "./types";

export const SHEET_TAG = "flight-sheet";

function courseStart() {
  return parseDate(process.env.COURSE_START ?? "2026-11-09") ?? Date.UTC(2026, 10, 9);
}

const fetchSheet = unstable_cache(
  async () => {
    const { tabs, values } = await readTabs();
    return { tabs, values, fetchedAt: new Date().toISOString() };
  },
  ["flight-sheet-v1"],
  { revalidate: 60, tags: [SHEET_TAG] },
);

async function readSnapshot() {
  // Local design work only: render a saved copy of the sheet without Google credentials.
  const file = process.env.SHEET_SNAPSHOT_FILE;
  if (!file) return null;
  const { readFile } = await import("node:fs/promises");
  return JSON.parse(await readFile(file, "utf8")) as { tabs: string[]; values: Record<"log" | "goals" | "debrief", string[][]> };
}

export async function getFlightData(): Promise<FlightData> {
  const start = courseStart();
  const courseWeek = weekOf(Date.now(), start) ?? 1;

  const snap = await readSnapshot();
  if (snap) {
    return {
      source: { kind: "live", fetchedAt: new Date().toISOString(), tabs: snap.tabs },
      entries: toEntries(snap.values.log, start),
      goals: toGoals(snap.values.goals),
      debriefs: toDebriefs(snap.values.debrief),
      courseWeek,
    };
  }

  if (!sheetsConfigured()) {
    return {
      source: { kind: "demo", reason: "not-configured" },
      entries: toEntries(demoLog, start),
      goals: toGoals(demoGoals),
      debriefs: toDebriefs(demoDebrief),
      courseWeek,
    };
  }

  try {
    const { tabs, values, fetchedAt } = await fetchSheet();
    return {
      source: { kind: "live", fetchedAt, tabs },
      entries: toEntries(values.log, start),
      goals: toGoals(values.goals),
      debriefs: toDebriefs(values.debrief),
      courseWeek,
    };
  } catch (e) {
    return {
      source: { kind: "error", message: e instanceof Error ? e.message : "שגיאה לא ידועה" },
      entries: [],
      goals: [],
      debriefs: [],
      courseWeek,
    };
  }
}
