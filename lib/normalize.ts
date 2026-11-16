import type { Debrief, Extra, Goal, LogEntry, Milestone, StatusTone } from "./types";

/** Strip emoji, punctuation and spacing so headers like "✈️ מה עבד?" match "מה עבד". */
export function norm(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/[\p{Extended_Pictographic}️‍]/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

type FieldSpec<K extends string> = Record<K, string[]>;

/**
 * Map each field to a column index by header synonyms.
 * Longer synonyms are tried first so "מה לא עבד" never lands on "מה עבד".
 */
export function mapHeaders<K extends string>(headers: string[], spec: FieldSpec<K>) {
  const normalized = headers.map(norm);
  const used = new Set<number>();
  const map = {} as Record<K, number>;
  const entries = (Object.entries(spec) as [K, string[]][])
    .flatMap(([field, syns]) => syns.map((syn) => ({ field, syn: norm(syn) })))
    .sort((a, b) => b.syn.length - a.syn.length);

  // pass 1: exact header match, pass 2: header contains synonym
  for (const exact of [true, false]) {
    for (const { field, syn } of entries) {
      if (map[field] !== undefined) continue;
      const idx = normalized.findIndex(
        (h, i) => !used.has(i) && h !== "" && (exact ? h === syn : h.includes(syn)),
      );
      if (idx >= 0) {
        map[field] = idx;
        used.add(idx);
      }
    }
  }
  return { map, used };
}

function cell(row: string[], idx: number | undefined) {
  return idx === undefined ? "" : (row[idx] ?? "").toString().trim();
}

function extras(headers: string[], row: string[], used: Set<number>): Extra[] {
  return headers
    .map((label, i) => ({ label: label.trim(), value: cell(row, i), i }))
    .filter((x) => !used.has(x.i) && x.label && x.value)
    .map(({ label, value }) => ({ label, value }));
}

/** Find the header row: the first row within the top 6 with at least 2 non-empty cells. */
export function splitTable(rows: string[][]) {
  const start = rows.findIndex((r, i) => i < 6 && r.filter((c) => (c ?? "").toString().trim()).length >= 2);
  if (start < 0) return { headers: [] as string[], body: [] as { row: string[]; n: number }[] };
  const headers = rows[start].map((h) => (h ?? "").toString());
  const body = rows
    .slice(start + 1)
    .map((row, i) => ({ row, n: start + i + 2 }))
    .filter(({ row }) => row.some((c) => (c ?? "").toString().trim()));
  return { headers, body };
}

export function toneOf(status: string): StatusTone {
  const s = norm(status);
  if (!s) return "unknown";
  // negative / pending phrases first, so "טרם בוצע" never reads as done
  if (/(תקוע|נתקע|חסום|עיכוב|בעיה|blocked|stuck|delayed)/.test(s)) return "delayed";
  if (/(מתוכנן|טרם|לא התחיל|לא הושלם|ממתין|לביצוע|todo|to do|planned|pending|next)/.test(s)) return "boarding";
  if (/(בתהליך|פעיל|בעבודה|בביצוע|in progress|active|ongoing|wip)/.test(s)) return "inflight";
  if (/(בוצע|הושלם|הסתיים|נחת|הושג|done|complete|completed|landed)/.test(s)) return "landed";
  return "unknown";
}

/** Parses dd/mm/yyyy, dd.mm.yy, yyyy-mm-dd and Google serial numbers. */
export function parseDate(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const serial = Number(s);
    return Date.UTC(1899, 11, 30) + serial * 86400000;
  }
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  // ranges such as "12–15.11.2026" or "9–15.11": use the end of the range
  m = s.match(/(\d{1,2})\s*[–-]\s*(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/);
  if (m) {
    const year = m[4] ? (m[4].length === 2 ? 2000 + +m[4] : +m[4]) : new Date().getFullYear();
    return Date.UTC(year, +m[3] - 1, +m[2]);
  }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);
  if (m) {
    const year = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : new Date().getFullYear();
    return Date.UTC(year, +m[2] - 1, +m[1]);
  }
  return null;
}

export function weekOf(ms: number | null, courseStart: number): number | null {
  if (ms === null) return null;
  const w = Math.floor((ms - courseStart) / (7 * 86400000)) + 1;
  return w >= 1 ? w : null;
}

function weekFrom(raw: string): number | null {
  const m = raw.match(/\d+/);
  return m ? Number(m[0]) : null;
}

export const LOG_SPEC = {
  title: ["שם המשימה", "המשימה", "משימה", "כותרת", "task", "title"],
  date: ["תאריך", "date"],
  week: ["שבוע", "week"],
  tool: ["כלי ai", "כלי", "tool", "פלטפורמה"],
  status: ["סטטוס", "מצב", "status"],
  description: ["תיאור קצר", "תיאור", "description", "תקציר"],
  request: ["מה ביקשתי", "הבקשה", "פרומפט", "prompt", "בקשה"],
  worked: ["מה עבד", "worked"],
  notWorked: ["מה לא עבד", "לא עבד", "didnt work", "not worked"],
  changed: ["מה שיניתי", "שינויים", "שיניתי", "changed"],
  learned: ["מה למדתי", "למדתי", "תובנה", "תובנות", "learned"],
  link: ["קישור לתוצר", "קישור", "תוצר", "link", "url"],
};

export function toEntries(rows: string[][], courseStart: number): LogEntry[] {
  const { headers, body } = splitTable(rows);
  if (!headers.length) return [];
  const { map, used } = mapHeaders(headers, LOG_SPEC);
  return body
    .map(({ row, n }) => {
      const date = cell(row, map.date);
      const dateValue = parseDate(date);
      const weekRaw = cell(row, map.week);
      const status = cell(row, map.status);
      return {
        id: `r${n}`,
        row: n,
        title: cell(row, map.title) || cell(row, map.description).slice(0, 60) || `רשומה ${n}`,
        date,
        dateValue,
        week: weekRaw ? weekFrom(weekRaw) : weekOf(dateValue, courseStart),
        tool: cell(row, map.tool),
        status,
        tone: toneOf(status),
        description: cell(row, map.description),
        request: cell(row, map.request),
        worked: cell(row, map.worked),
        notWorked: cell(row, map.notWorked),
        changed: cell(row, map.changed),
        learned: cell(row, map.learned),
        link: cell(row, map.link),
        extras: extras(headers, row, used),
      } satisfies LogEntry;
    })
    // the sheet is written chronologically, so the last row is the newest
    .sort((a, b) => b.row - a.row);
}

export const GOAL_SPEC = {
  num: ["מס", "מספר", "#"],
  title: ["מטרה אישית", "המטרה", "מטרה", "goal", "יעד אישי"],
  why: ["למה זה חשוב", "למה", "why"],
  metric: ["איך מודדים הצלחה", "מדד הצלחה", "מודדים", "מדד", "איך אדע", "metric", "kpi"],
  status: ["סטטוס", "מצב", "status"],
  // only a column that is explicitly a percentage; "התקדמות / הערות" is notes
  progress: ["אחוז התקדמות", "progress %", "אחוז"],
  notes: ["התקדמות הערות", "הערות", "התקדמות", "notes"],
  milestones: ["אבני דרך", "אבן דרך", "צעדים", "milestones"],
  target: ["תאריך יעד", "דדליין", "עד מתי", "target", "deadline"],
};

const DONE_MARK = /^\s*(?:✓|✔|✅|☑|\[x\]|v\s)\s*/i;

/** One milestone per line (or separated by ";" / "←" / "→"). A leading ✓ marks it done. */
export function parseMilestones(raw: string): Milestone[] {
  return raw
    .split(/\n|;|•|←|→|\s\|\s/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const done = DONE_MARK.test(s);
      const label = s.replace(DONE_MARK, "").replace(/^[-*\d.)\s]+/, "").trim();
      return { label, done };
    })
    .filter((m) => m.label);
}

/** Back to the sheet: one per line, "✓ " in front of the completed ones. */
export function milestonesToText(list: Milestone[]): string {
  return list.map((m) => (m.done ? `✓ ${m.label}` : m.label)).join("\n");
}

function numberFrom(raw: string): number | null {
  const m = raw.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  let v = Number(m[0]);
  if (!raw.includes("%") && v > 0 && v <= 1) v *= 100;
  return v >= 0 && v <= 100 ? Math.round(v) : null;
}

export function toGoals(rows: string[][]): Goal[] {
  const { headers, body } = splitTable(rows);
  if (!headers.length) return [];
  const { map, used } = mapHeaders(headers, GOAL_SPEC);
  return body.map(({ row, n }) => {
    const status = cell(row, map.status);
    const progressRaw = cell(row, map.progress);
    return {
      id: `g${n}`,
      title: cell(row, map.title) || `מטרה ${n}`,
      metric: cell(row, map.metric),
      status,
      tone: toneOf(status),
      progress: /^\s*\d+(\.\d+)?\s*%?\s*$/.test(progressRaw) ? numberFrom(progressRaw) : null,
      why: cell(row, map.why),
      notes: cell(row, map.notes),
      row: n,
      milestones: parseMilestones(cell(row, map.milestones)),
      target: cell(row, map.target),
      extras: extras(headers, row, used),
    } satisfies Goal;
  });
}

const DEBRIEF_SPEC = {
  week: ["שבוע", "week"],
  dates: ["טווח תאריכים", "תאריכים", "תאריך", "dates", "date"],
  tried: ["מה ניסיתי", "ניסיתי", "tried"],
  stuck: ["איפה נתקעתי", "נתקעתי", "תקיעות", "stuck"],
  learned: ["התובנה המרכזית", "מה למדתי", "תובנה", "למדתי", "learned"],
  next: ["מה אנסה בשבוע הבא", "מה אנסה", "שבוע הבא", "הצעד הבא", "next"],
};

export function toDebriefs(rows: string[][]): Debrief[] {
  const { headers, body } = splitTable(rows);
  if (!headers.length) return [];
  const { map, used } = mapHeaders(headers, DEBRIEF_SPEC);
  return body
    .map(({ row, n }) => {
      const label = cell(row, map.week);
      return {
        id: `d${n}`,
        week: label ? weekFrom(label) : null,
        label: label || `רשומה ${n}`,
        dates: cell(row, map.dates),
        tried: cell(row, map.tried),
        stuck: cell(row, map.stuck),
        learned: cell(row, map.learned),
        next: cell(row, map.next),
        extras: extras(headers, row, used),
      } satisfies Debrief;
    })
    .sort((a, b) => (b.week ?? 0) - (a.week ?? 0));
}

const TOOL_CODES: [RegExp, string][] = [
  [/claude/i, "CLD"],
  [/chat\s*gpt|gpt|openai/i, "GPT"],
  [/gemini|ג׳מיני|גמיני/i, "GEM"],
  [/perplexity/i, "PPX"],
  [/notebook/i, "NLM"],
  [/lovable/i, "LOV"],
  [/base\s*44/i, "B44"],
  [/higgs/i, "HGF"],
  [/figjam/i, "FJM"],
  [/figma/i, "FIG"],
  [/strava/i, "STV"],
  [/skills?/i, "SKL"],
  [/cursor/i, "CUR"],
  [/midjourney/i, "MJY"],
];

export function toolCode(tool: string): string {
  if (!tool) return "---";
  tool = splitTools(tool)[0] ?? tool;
  for (const [re, code] of TOOL_CODES) if (re.test(tool)) return code;
  const latin = tool.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return (latin || "AI").slice(0, 3).padEnd(3, "·");
}

/** Split a multi-tool cell ("Claude, ChatGPT") into separate tools for filtering. */
export function splitTools(tool: string): string[] {
  return tool
    .split(/[,/+|]|\s&\s|\sו(?=[A-Za-z])/)
    .map((t) => t.trim())
    .filter(Boolean);
}
