import { expect, test } from "@playwright/test";

test("아침 기록을 남기면 3개월 추이 화면에서 그래프로 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("어머니 건강 수첩");
  await expect(page.getByRole("button", { name: "저장하기" })).toBeDisabled();

  await page.getByLabel("혈압", { exact: false }).first().fill("138");
  await page.getByLabel("아래 혈압").fill("86");
  await page.getByLabel("맥박").fill("64");
  await page.getByLabel("혈당", { exact: false }).fill("127");
  await page.getByLabel("인슐린").fill("14");

  await page.getByRole("button", { name: "저장하기" }).click();

  await expect(page.getByText("저장했습니다")).toBeVisible();
  await expect(page.getByLabel("오늘 기록 요약").getByText("138 / 86")).toBeVisible();

  await page.getByRole("link", { name: "3개월 추이 보기" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toContainText("최근 3개월");
  await expect(page.getByRole("img", { name: "혈압 추이" })).toBeVisible();
  await expect(page.getByRole("img", { name: "혈당 추이" })).toBeVisible();
  await expect(page.getByRole("img", { name: "맥박 추이" })).toBeVisible();
  await expect(page.getByRole("img", { name: "인슐린 투약 단위" })).toBeVisible();
  await expect(page.getByText("혈압 정상 범위 90–130")).toBeVisible();
  await expect(page.getByText("혈당 정상 기준 100")).toBeVisible();
  await expect(page.getByRole("button", { name: "기록 내보내기" })).toBeDisabled();
  await expect(page.getByText("기록이 80일치를 넘으면", { exact: false })).toBeVisible();
});

/** 80일치가 모이기 전에는 내보내기가 잠기므로, 쌓인 상태를 만들어 두고 연다. */
async function seedLogs(page: import("@playwright/test").Page, count: number) {
  await page.addInitScript(
    ([days]) => {
      const pad = (value: number) => String(value).padStart(2, "0");
      const today = new Date();
      const logs = Array.from({ length: days as number }, (_, index) => {
        const date = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - ((days as number) - 1 - index),
        );
        return {
          date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
          systolic: 132,
          diastolic: 84,
          pulse: 66,
          glucose: 128,
          dose: 14,
          note: "",
        };
      });
      window.localStorage.setItem("morning-logs", JSON.stringify(logs));
    },
    [count],
  );
}

test("기록이 80일치를 넘으면 내보내 파일을 받을 수 있다", async ({ page }) => {
  await seedLogs(page, 92);
  await page.goto("/trend");

  await expect(page.getByText("쌓인 기록 92일치", { exact: false })).toBeVisible();

  const download = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "기록 내보내기" }).click(),
  ]).then(([event]) => event);

  expect(download.suggestedFilename()).toMatch(/^건강기록_.*\.csv$/);
});

test("기록이 없으면 추이 화면이 비어 있다고 알린다", async ({ page }) => {
  await page.goto("/trend");

  await expect(page.getByText("아직 기록이 없습니다")).toBeVisible();
});
