"use client";

import { useSyncExternalStore } from "react";

import { isMorningLog, upsertLog, type MorningLog } from "./record";

const STORAGE_KEY = "morning-logs";
const EXPORT_KEY = "morning-logs-exported-at";
const EMPTY: MorningLog[] = [];

const listeners = new Set<() => void>();

/** 마지막으로 읽은 원문과 그 해석 결과. useSyncExternalStore가 같은 참조를 받아야 한다. */
let lastRaw: string | null = null;
let lastLogs: MorningLog[] = EMPTY;

function parse(raw: string | null): MorningLog[] {
  if (!raw) return EMPTY;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;

    return parsed
      .filter(isMorningLog)
      .map((log) => ({ ...log, note: typeof log.note === "string" ? log.note : "" }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return EMPTY;
  }
}

/**
 * 기록은 이 브라우저에만 남는다(docs/decisions/data-and-auth.md).
 * 사생활 보호 모드처럼 저장소를 읽을 수 없는 환경에서는 기록 없음으로 다룬다.
 */
function snapshot(): MorningLog[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }

  if (raw !== lastRaw) {
    lastRaw = raw;
    lastLogs = parse(raw);
  }
  return lastLogs;
}

function serverSnapshot(): MorningLog[] {
  return EMPTY;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMorningLogs(): MorningLog[] {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** 브라우저에 들어선 뒤인지. 저장소를 읽기 전에 빈 화면을 내보이지 않으려고 쓴다. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function lastExportSnapshot(): string | null {
  try {
    return window.localStorage.getItem(EXPORT_KEY);
  } catch {
    return null;
  }
}

/** 마지막으로 내보낸 날. 한 번도 내보낸 적이 없으면 null이다. */
export function useLastExport(): string | null {
  return useSyncExternalStore(subscribe, lastExportSnapshot, () => null);
}

export function markExported(dateKey: string): void {
  try {
    window.localStorage.setItem(EXPORT_KEY, dateKey);
  } catch {
    // 저장소를 쓸 수 없는 환경. 다음에 열면 다시 권하게 된다.
  }

  listeners.forEach((listener) => listener());
}

/**
 * 저장에 성공했는지 돌려준다. 실패를 조용히 삼키면 화면이 입력 폼 그대로 남아
 * 버튼이 안 눌린 것처럼 보인다. 부르는 쪽이 실패를 알리게 한다.
 */
export function saveLog(entry: MorningLog): boolean {
  const next = upsertLog(snapshot(), entry);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false;
  }

  listeners.forEach((listener) => listener());
  return true;
}
