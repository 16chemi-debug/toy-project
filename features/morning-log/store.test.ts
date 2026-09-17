import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveLog, type MorningLog } from "./index";

const entry: MorningLog = {
  date: "2026-09-17",
  systolic: 138,
  diastolic: 86,
  pulse: 64,
  glucose: 127,
  dose: 14,
  note: "",
};

function blockStorage() {
  return vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("exceeded the quota", "QuotaExceededError");
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("saveLog", () => {
  it("저장에 성공하면 true를 돌려주고 기록이 남는다", () => {
    expect(saveLog(entry)).toBe(true);
    expect(window.localStorage.getItem("morning-logs")).toContain("2026-09-17");
  });

  it("저장소가 막히면 false를 돌려준다", () => {
    const blocked = blockStorage();

    expect(saveLog(entry)).toBe(false);

    blocked.mockRestore();
  });

  it("저장소가 막히면 기록이 남지 않는다", () => {
    const blocked = blockStorage();

    saveLog(entry);
    blocked.mockRestore();

    expect(window.localStorage.getItem("morning-logs")).toBeNull();
  });
});
