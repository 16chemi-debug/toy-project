import { describe, expect, it } from "vitest";

import {
  isComplete,
  movingAverage,
  sliceDays,
  toDateKey,
  upsertLog,
  type MorningLog,
} from "./index";

function log(date: string, glucose = 130): MorningLog {
  return {
    date,
    systolic: 130,
    diastolic: 85,
    pulse: 66,
    glucose,
    dose: 14,
    note: "",
  };
}

describe("toDateKey", () => {
  it("기기의 로컬 날짜를 쓴다", () => {
    expect(toDateKey(new Date(2026, 8, 17, 7, 30))).toBe("2026-09-17");
  });

  it("자정 직전에도 UTC로 밀리지 않는다", () => {
    expect(toDateKey(new Date(2026, 8, 17, 23, 59))).toBe("2026-09-17");
  });

  it("월과 일을 두 자리로 채운다", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("upsertLog", () => {
  it("같은 날짜의 기록은 덮어쓴다", () => {
    const next = upsertLog([log("2026-09-17", 130)], log("2026-09-17", 118));

    expect(next).toHaveLength(1);
    expect(next[0].glucose).toBe(118);
  });

  it("새 날짜는 더한다", () => {
    const next = upsertLog([log("2026-09-16")], log("2026-09-17"));

    expect(next.map((entry) => entry.date)).toEqual(["2026-09-16", "2026-09-17"]);
  });

  it("날짜 오름차순을 유지한다", () => {
    const next = upsertLog([log("2026-09-17"), log("2026-09-15")], log("2026-09-16"));

    expect(next.map((entry) => entry.date)).toEqual([
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
    ]);
  });
});

describe("movingAverage", () => {
  it("길이를 보존한다", () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toHaveLength(5);
  });

  it("가운데 값은 창 안의 평균이다", () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)[2]).toBe(3);
  });

  it("가장자리에서는 창이 줄어든다", () => {
    const smoothed = movingAverage([1, 2, 3, 4, 5], 3);

    expect(smoothed[0]).toBe(1.5);
    expect(smoothed[4]).toBe(4.5);
  });

  it("들쭉날쭉한 값을 눌러 흐름을 남긴다", () => {
    const spiky = [100, 200, 100, 200, 100, 200, 100];
    const smoothed = movingAverage(spiky, 7);

    expect(Math.max(...smoothed) - Math.min(...smoothed)).toBeLessThan(60);
  });

  it("빈 배열은 빈 배열이다", () => {
    expect(movingAverage([], 7)).toEqual([]);
  });
});

describe("sliceDays", () => {
  const logs = [
    log("2026-06-17"),
    log("2026-06-18"),
    log("2026-08-01"),
    log("2026-09-17"),
  ];

  it("끝 날짜에서 거슬러 센 범위만 남긴다", () => {
    const within = sliceDays(logs, "2026-09-17", 92);

    expect(within.map((entry) => entry.date)).toEqual([
      "2026-06-18",
      "2026-08-01",
      "2026-09-17",
    ]);
  });

  it("범위의 첫날을 포함한다", () => {
    expect(sliceDays(logs, "2026-09-17", 92)[0].date).toBe("2026-06-18");
  });

  it("끝 날짜보다 뒤의 기록은 뺀다", () => {
    const within = sliceDays(logs, "2026-08-01", 92);

    expect(within.map((entry) => entry.date)).toEqual([
      "2026-06-17",
      "2026-06-18",
      "2026-08-01",
    ]);
  });

  it("기록이 없으면 빈 배열이다", () => {
    expect(sliceDays([], "2026-09-17", 92)).toEqual([]);
  });
});

describe("isComplete", () => {
  it("다섯 수치가 모두 있으면 저장할 수 있다", () => {
    expect(
      isComplete({
        systolic: "138",
        diastolic: "86",
        pulse: "64",
        glucose: "127",
        dose: "14",
        note: "",
      }),
    ).toBe(true);
  });

  it("특이사항은 비어도 된다", () => {
    expect(
      isComplete({
        systolic: "138",
        diastolic: "86",
        pulse: "64",
        glucose: "127",
        dose: "0",
        note: "",
      }),
    ).toBe(true);
  });

  it("한 칸이라도 비면 저장할 수 없다", () => {
    expect(
      isComplete({
        systolic: "138",
        diastolic: "",
        pulse: "64",
        glucose: "127",
        dose: "14",
        note: "어지러웠음",
      }),
    ).toBe(false);
  });

  it("숫자가 아닌 값은 저장할 수 없다", () => {
    expect(
      isComplete({
        systolic: "높음",
        diastolic: "86",
        pulse: "64",
        glucose: "127",
        dose: "14",
        note: "",
      }),
    ).toBe(false);
  });
});
