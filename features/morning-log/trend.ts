import { fromDateKey, type MorningLog } from "./record";

const DAY_MS = 24 * 60 * 60 * 1000;

/** 양쪽으로 창을 펼친 이동평균. 가장자리에서는 창이 줄어 길이가 보존된다. */
export function movingAverage(values: number[], window: number): number[] {
  const half = Math.floor(window / 2);

  return values.map((_, index) => {
    const from = Math.max(0, index - half);
    const to = Math.min(values.length - 1, index + half);
    let sum = 0;
    for (let cursor = from; cursor <= to; cursor += 1) sum += values[cursor];
    return sum / (to - from + 1);
  });
}

/** 두 날짜 키 사이의 일수. b가 뒤면 양수다. */
export function daysBetween(from: string, to: string): number {
  return Math.round((fromDateKey(to).getTime() - fromDateKey(from).getTime()) / DAY_MS);
}

/** 끝 날짜에서 days일만큼 거슬러 센 구간의 기록만 남긴다. 끝날과 첫날을 모두 포함한다. */
export function sliceDays(logs: MorningLog[], endKey: string, days: number): MorningLog[] {
  return logs.filter((log) => {
    const offset = daysBetween(log.date, endKey);
    return offset >= 0 && offset < days;
  });
}
