export type StatusTone = "landed" | "inflight" | "boarding" | "delayed" | "unknown";

export type Extra = { label: string; value: string };

export type LogEntry = {
  id: string;
  row: number;
  title: string;
  date: string; // raw as written in the sheet
  dateValue: number | null; // epoch ms, if parseable
  week: number | null;
  tool: string;
  status: string;
  tone: StatusTone;
  description: string;
  request: string;
  worked: string;
  notWorked: string;
  changed: string;
  learned: string;
  link: string;
  extras: Extra[];
};

export type Milestone = { label: string; done: boolean };

export type Goal = {
  id: string;
  row: number; // sheet row, for writing milestones back
  title: string;
  metric: string;
  status: string;
  tone: StatusTone;
  progress: number | null; // only when the sheet has an explicit percentage
  why: string;
  notes: string;
  milestones: Milestone[];
  target: string;
  extras: Extra[];
};

export type Debrief = {
  id: string;
  week: number | null;
  label: string;
  dates: string;
  tried: string;
  stuck: string;
  learned: string;
  next: string;
  extras: Extra[];
};

export type SourceState =
  | { kind: "live"; fetchedAt: string; tabs: string[] }
  | { kind: "demo"; reason: "not-configured" }
  | { kind: "error"; message: string };

export type FlightData = {
  source: SourceState;
  entries: LogEntry[];
  goals: Goal[];
  debriefs: Debrief[];
  courseWeek: number;
};
