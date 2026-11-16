import "server-only";
import { JWT } from "google-auth-library";
import { GOAL_SPEC, LOG_SPEC, mapHeaders, norm } from "./normalize";

const API = "https://sheets.googleapis.com/v4/spreadsheets";

export type TabKey = "log" | "goals" | "debrief";

/** Tabs are matched by keyword, so renaming "✈️ יומן הטיסה" to "יומן טיסה" keeps working. */
const TAB_KEYWORDS: Record<TabKey, string[]> = {
  log: ["יומן", "log", "משימות"],
  goals: ["מטרות", "goals", "יעדים"],
  debrief: ["סיכום", "שבועי", "debrief", "weekly"],
};

export function sheetsConfigured() {
  return Boolean(
    process.env.GOOGLE_SHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY,
  );
}

function client(write = false) {
  return new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // Vercel stores the key with literal "\n"; turn them back into newlines.
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: [
      write
        ? "https://www.googleapis.com/auth/spreadsheets"
        : "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
  });
}

async function call<T>(path: string, init?: RequestInit & { write?: boolean }): Promise<T> {
  let token: string | null | undefined;
  try {
    ({ token } = await client(init?.write).getAccessToken());
  } catch {
    throw new Error("ההתחברות ל-Google נכשלה. בדקו את GOOGLE_SERVICE_ACCOUNT_EMAIL ואת GOOGLE_PRIVATE_KEY (כולל ה-\\n).");
  }
  const res = await fetch(`${API}/${process.env.GOOGLE_SHEET_ID}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 403)
      throw new Error("אין הרשאה לגיליון. שתפו אותו עם כתובת ה-Service Account (צפייה מספיקה לקריאה).");
    if (res.status === 404) throw new Error("הגיליון לא נמצא. בדקו את GOOGLE_SHEET_ID.");
    throw new Error(`Google Sheets ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function resolveTabs(): Promise<Record<TabKey, string | null> & { all: string[] }> {
  const meta = await call<{ sheets: { properties: { title: string } }[] }>(
    "?fields=sheets.properties.title",
  );
  const all = meta.sheets.map((s) => s.properties.title);
  const pick = (key: TabKey) =>
    all.find((t) => TAB_KEYWORDS[key].some((k) => norm(t).includes(norm(k)))) ?? null;
  return { log: pick("log"), goals: pick("goals"), debrief: pick("debrief"), all };
}

const quote = (title: string) => `'${title.replace(/'/g, "''")}'`;

export async function readTabs(): Promise<{ tabs: string[]; values: Record<TabKey, string[][]> }> {
  const tabs = await resolveTabs();
  const keys = (["log", "goals", "debrief"] as TabKey[]).filter((k) => tabs[k]);
  const values: Record<TabKey, string[][]> = { log: [], goals: [], debrief: [] };
  if (keys.length) {
    const ranges = keys.map((k) => `ranges=${encodeURIComponent(quote(tabs[k]!))}`).join("&");
    const res = await call<{ valueRanges: { values?: string[][] }[] }>(
      `/values:batchGet?${ranges}&valueRenderOption=FORMATTED_VALUE`,
    );
    keys.forEach((k, i) => (values[k] = res.valueRanges[i]?.values ?? []));
  }
  return { tabs: keys.map((k) => tabs[k]!), values };
}

export function writesEnabled() {
  return sheetsConfigured() && process.env.ENABLE_WRITES === "true";
}

function colLetter(i: number) {
  let n = i + 1;
  let out = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/** Reads the top of a tab and returns its header row (as written in the sheet) and its 1-based row number. */
async function headerOf(tab: string) {
  const top = await call<{ values?: string[][] }>(`/values/${encodeURIComponent(quote(tab) + "!1:6")}`);
  const rows = top.values ?? [];
  const idx = rows.findIndex((r) => r.filter((c) => (c ?? "").toString().trim()).length >= 2);
  if (idx < 0) throw new Error(`לא נמצאה שורת כותרות בלשונית "${tab}"`);
  return { headers: rows[idx].map(String), headerRow: idx + 1 };
}

export type NewLogEntry = Partial<Record<keyof typeof LOG_SPEC, string>>;

/** Pure: place each field under the matching header. Exported for tests. */
export function orderLogRow(headers: string[], entry: NewLogEntry) {
  const { map } = mapHeaders(headers, LOG_SPEC);
  const row = headers.map(() => "");
  (Object.keys(entry) as (keyof typeof LOG_SPEC)[]).forEach((field) => {
    const idx = map[field];
    if (idx !== undefined) row[idx] = entry[field] ?? "";
  });
  // trim trailing empties so the append range stays tight
  while (row.length && row[row.length - 1] === "") row.pop();
  return row;
}

/** Append a new row to the flight-log tab. Requires Editor access for the service account. */
export async function appendLogRow(entry: NewLogEntry) {
  const tabs = await resolveTabs();
  if (!tabs.log) throw new Error("לא נמצאה לשונית יומן הטיסה");
  const { headers } = await headerOf(tabs.log);
  const row = orderLogRow(headers, entry);
  return call(
    `/values/${encodeURIComponent(quote(tabs.log) + "!A1")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: [row] }), write: true },
  );
}

/**
 * Write the milestones cell of one goal row.
 * If the goals tab has no milestones column yet, one named "אבני דרך" is added after the last header.
 */
export async function writeGoalMilestones(sheetRow: number, text: string) {
  const tabs = await resolveTabs();
  if (!tabs.goals) throw new Error("לא נמצאה לשונית המטרות");
  const { headers, headerRow } = await headerOf(tabs.goals);
  const { map } = mapHeaders(headers, GOAL_SPEC);
  let col = map.milestones;
  if (col === undefined) {
    col = headers.length;
    await call(`/values/${encodeURIComponent(`${quote(tabs.goals)}!${colLetter(col)}${headerRow}`)}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: [["אבני דרך"]] }),
      write: true,
    });
  }
  const a1 = `${quote(tabs.goals)}!${colLetter(col)}${sheetRow}`;
  return call(`/values/${encodeURIComponent(a1)}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: [[text]] }),
    write: true,
  });
}
