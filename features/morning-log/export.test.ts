import { describe, expect, it } from "vitest";

import {
  EXPORT_MIN_RECORDS,
  canExport,
  exportFileName,
  needsExport,
  toCsv,
  type MorningLog,
} from "./index";

function log(date: string, note = ""): MorningLog {
  return { date, systolic: 138, diastolic: 86, pulse: 64, glucose: 127, dose: 14, note };
}

/** 마지막 날에서 거슬러 count일치를 만든다. */
function series(count: number, lastDate = "2026-09-17"): MorningLog[] {
  const [year, month, day] = lastDate.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, month - 1, day - (count - 1 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;
    return log(key);
  });
}

describe("toCsv", () => {
  it("머리글을 맨 앞에 둔다", () => {
    const [header] = toCsv([log("2026-09-17")]).split("\r\n");

    expect(header).toBe("날짜,수축기 혈압,이완기 혈압,맥박,혈당,인슐린 단위,특이사항");
  });

  it("기록 한 줄을 일곱 칸으로 적는다", () => {
    const [, row] = toCsv([log("2026-09-17")]).split("\r\n");

    expect(row).toBe("2026-09-17,138,86,64,127,14,");
  });

  it("쉼표가 든 특이사항을 따옴표로 감싼다", () => {
    const [, row] = toCsv([log("2026-09-17", "어지럽고, 손이 저림")]).split("\r\n");

    expect(row).toContain('"어지럽고, 손이 저림"');
  });

  it("따옴표가 든 특이사항은 따옴표를 겹쳐 적는다", () => {
    const [, row] = toCsv([log("2026-09-17", '의사가 "괜찮다"고 함')]).split("\r\n");

    expect(row).toContain('"의사가 ""괜찮다""고 함"');
  });

  it("줄바꿈이 든 특이사항도 한 칸에 담는다", () => {
    const csv = toCsv([log("2026-09-17", "어지러움\n아침 거름")]);

    expect(csv.split("\r\n")).toHaveLength(2);
  });

  it("기록이 없으면 머리글만 남는다", () => {
    expect(toCsv([])).toBe("날짜,수축기 혈압,이완기 혈압,맥박,혈당,인슐린 단위,특이사항");
  });
});

describe("exportFileName", () => {
  it("첫 날과 마지막 날을 담는다", () => {
    expect(exportFileName([log("2026-06-18"), log("2026-09-17")])).toBe(
      "건강기록_2026-06-18_2026-09-17.csv",
    );
  });

  it("기록이 없어도 이름을 돌려준다", () => {
    expect(exportFileName([])).toBe("건강기록.csv");
  });
});

describe("canExport", () => {
  it(`${EXPORT_MIN_RECORDS}일치가 모이기 전에는 내보낼 수 없다`, () => {
    expect(canExport(series(EXPORT_MIN_RECORDS - 1))).toBe(false);
  });

  it(`${EXPORT_MIN_RECORDS}일치가 모이면 내보낼 수 있다`, () => {
    expect(canExport(series(EXPORT_MIN_RECORDS))).toBe(true);
  });

  it("기록이 없으면 내보낼 수 없다", () => {
    expect(canExport([])).toBe(false);
  });
});

describe("needsExport", () => {
  const enough = series(92);

  it("기록이 없으면 권하지 않는다", () => {
    expect(needsExport([], null, "2026-09-17")).toBe(false);
  });

  it("내보낼 수 없는 동안에는 권하지 않는다", () => {
    expect(needsExport(series(EXPORT_MIN_RECORDS - 1), null, "2026-09-17")).toBe(false);
  });

  it("한 번도 내보낸 적이 없으면 첫 기록에서 센다", () => {
    expect(needsExport(enough, null, "2026-09-17")).toBe(true);
  });

  it("마지막으로 내보낸 날에서 30일이 지나면 권한다", () => {
    expect(needsExport(enough, "2026-08-19", "2026-09-17")).toBe(false);
    expect(needsExport(enough, "2026-08-18", "2026-09-17")).toBe(true);
  });

  it("방금 내보냈으면 권하지 않는다", () => {
    expect(needsExport(enough, "2026-09-17", "2026-09-17")).toBe(false);
  });
});
