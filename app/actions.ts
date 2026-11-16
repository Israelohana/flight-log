"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { SHEET_TAG } from "@/lib/data";
import { milestonesToText, parseDate, weekOf } from "@/lib/normalize";
import { appendLogRow, writeGoalMilestones, writesEnabled, type NewLogEntry } from "@/lib/sheets";
import type { Milestone } from "@/lib/types";

const COOKIE = "fl_crew";

export async function refreshSheet() {
  revalidateTag(SHEET_TAG);
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string; needsPasscode?: boolean };

function token() {
  return createHash("sha256")
    .update(`flight-log:${process.env.WRITE_PASSCODE ?? ""}:${process.env.GOOGLE_SHEET_ID ?? ""}`)
    .digest("hex");
}

/** Every write goes through here: writes on, passcode configured, and this browser unlocked. */
async function guard(passcode?: string): Promise<ActionResult | null> {
  if (!writesEnabled()) {
    return { ok: false, error: "שמירה לגיליון כבויה. כדי להפעיל: ENABLE_WRITES=true והרשאת Editor ל-Service Account." };
  }
  if (!process.env.WRITE_PASSCODE) {
    return { ok: false, error: "חסר WRITE_PASSCODE במשתני הסביבה. בלי קוד, כל מי שיש לו את הקישור יוכל לכתוב לגיליון." };
  }
  const jar = await cookies();
  const expected = Buffer.from(token());
  const saved = Buffer.from(jar.get(COOKIE)?.value ?? "");
  if (saved.length === expected.length && timingSafeEqual(saved, expected)) return null;

  if (passcode) {
    const given = Buffer.from(passcode);
    const real = Buffer.from(process.env.WRITE_PASSCODE);
    if (given.length === real.length && timingSafeEqual(given, real)) {
      jar.set(COOKIE, token(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 180, path: "/" });
      return null;
    }
    return { ok: false, error: "קוד הגישה שגוי.", needsPasscode: true };
  }
  return { ok: false, error: "נדרש קוד גישה לשמירה (פעם אחת במכשיר).", needsPasscode: true };
}

export async function canWrite(): Promise<{ enabled: boolean; unlocked: boolean }> {
  if (!writesEnabled() || !process.env.WRITE_PASSCODE) return { enabled: false, unlocked: false };
  const jar = await cookies();
  return { enabled: true, unlocked: jar.get(COOKIE)?.value === token() };
}

function todayIL() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", day: "2-digit", month: "2-digit", year: "numeric" }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}.${get("month")}.${get("year")}`;
}

export async function addEntry(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const blocked = await guard(String(form.get("passcode") ?? "") || undefined);
  if (blocked) return blocked;

  const str = (k: string) => String(form.get(k) ?? "").trim();
  const title = str("title");
  if (!title) return { ok: false, error: "חסר שם למשימה." };

  const date = str("date") || todayIL();
  const start = parseDate(process.env.COURSE_START ?? "2026-11-09") ?? Date.UTC(2026, 10, 9);
  const week = weekOf(parseDate(date), start);

  const entry: NewLogEntry = {
    date,
    week: week ? String(week) : "",
    title,
    tool: form.getAll("tool").map(String).concat(str("toolOther") ? [str("toolOther")] : []).filter(Boolean).join(", "),
    request: str("request"),
    worked: str("worked"),
    notWorked: str("notWorked"),
    changed: str("changed"),
    learned: str("learned"),
    status: str("status") || "הושלם",
    link: str("link"),
  };

  try {
    await appendLogRow(entry);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "השמירה נכשלה" };
  }
  revalidateTag(SHEET_TAG);
  revalidatePath("/", "layout");
  return { ok: true, message: "נרשם ביומן הטיסה" };
}

export async function saveMilestones(goalRow: number, list: Milestone[], passcode?: string): Promise<ActionResult> {
  const blocked = await guard(passcode);
  if (blocked) return blocked;
  try {
    await writeGoalMilestones(goalRow, milestonesToText(list.filter((m) => m.label.trim())));
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "השמירה נכשלה" };
  }
  revalidateTag(SHEET_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}
