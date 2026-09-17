import type { MorningLog } from "./record";
import { daysBetween } from "./trend";

/** 마지막으로 내보낸 뒤 이만큼 지나면 다시 권한다. */
export const EXPORT_REMINDER_DAYS = 30;

/** 이만큼 쌓이기 전에는 내보낼 수 없다. 진료 주기 한 번치에 가까워졌을 때 내보낸다. */
export const EXPORT_MIN_RECORDS = 80;

const HEADER = [
  "날짜",
  "수축기 혈압",
  "이완기 혈압",
  "맥박",
  "혈당",
  "인슐린 단위",
  "특이사항",
];

function cell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** 자녀가 스프레드시트로 열어보는 파일이다. 앱이 되읽지 않으므로 사람이 읽는 형식으로 쓴다. */
export function toCsv(logs: MorningLog[]): string {
  const rows = logs.map((log) =>
    [log.date, log.systolic, log.diastolic, log.pulse, log.glucose, log.dose, log.note]
      .map(cell)
      .join(","),
  );

  return [HEADER.join(","), ...rows].join("\r\n");
}

export function exportFileName(logs: MorningLog[]): string {
  if (logs.length === 0) return "건강기록.csv";
  return `건강기록_${logs[0].date}_${logs[logs.length - 1].date}.csv`;
}

export function canExport(logs: MorningLog[]): boolean {
  return logs.length >= EXPORT_MIN_RECORDS;
}

/**
 * 한 번도 내보낸 적이 없으면 첫 기록에서부터 센다.
 * 내보낼 수 없는 동안에는 권하지 않는다. 권해놓고 버튼이 잠겨 있으면 막다른 길이 된다.
 */
export function needsExport(
  logs: MorningLog[],
  lastExport: string | null,
  today: string,
): boolean {
  if (!canExport(logs)) return false;
  return daysBetween(lastExport ?? logs[0].date, today) >= EXPORT_REMINDER_DAYS;
}
