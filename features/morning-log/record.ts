/** 아침 측정 한 번을 담는 하루 한 묶음. */
export type MorningLog = {
  /** 로컬 기준 YYYY-MM-DD. 하루 한 묶음이라 이 값이 곧 식별자다. */
  date: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  glucose: number;
  dose: number;
  note: string;
};

/** 화면에서 들어오는 날것의 입력. 숫자 칸도 문자열로 다룬다. */
export type MorningLogDraft = {
  systolic: string;
  diastolic: string;
  pulse: string;
  glucose: string;
  dose: string;
  note: string;
};

const MEASURES = ["systolic", "diastolic", "pulse", "glucose", "dose"] as const;

export const EMPTY_DRAFT: MorningLogDraft = {
  systolic: "",
  diastolic: "",
  pulse: "",
  glucose: "",
  dose: "",
  note: "",
};

const pad = (value: number) => String(value).padStart(2, "0");

/** 기기의 로컬 날짜를 쓴다. UTC로 바꾸면 자정 무렵 기록이 하루 밀린다. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isComplete(draft: MorningLogDraft): boolean {
  return MEASURES.every((field) => {
    const value = draft[field].trim();
    return value !== "" && Number.isFinite(Number(value));
  });
}

export function toLog(draft: MorningLogDraft, date: string): MorningLog {
  return {
    date,
    systolic: Number(draft.systolic),
    diastolic: Number(draft.diastolic),
    pulse: Number(draft.pulse),
    glucose: Number(draft.glucose),
    dose: Number(draft.dose),
    note: draft.note.trim(),
  };
}

export function toDraft(log: MorningLog): MorningLogDraft {
  return {
    systolic: String(log.systolic),
    diastolic: String(log.diastolic),
    pulse: String(log.pulse),
    glucose: String(log.glucose),
    dose: String(log.dose),
    note: log.note,
  };
}

export function isMorningLog(value: unknown): value is MorningLog {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.date !== "string") return false;
  return MEASURES.every((field) => typeof candidate[field] === "number");
}

/** 같은 날짜는 덮어쓰고, 새 날짜는 더한 뒤 날짜 오름차순으로 돌려준다. */
export function upsertLog(logs: MorningLog[], entry: MorningLog): MorningLog[] {
  const others = logs.filter((log) => log.date !== entry.date);
  return [...others, entry].sort((a, b) => a.date.localeCompare(b.date));
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDay(key: string): string {
  const date = fromDateKey(key);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatDayWithWeekday(key: string): string {
  const date = fromDateKey(key);
  return `${formatDay(key)} ${WEEKDAYS[date.getDay()]}요일`;
}
