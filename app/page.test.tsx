import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import TodayPage from "@/app/page";

beforeEach(() => {
  window.localStorage.clear();
});

async function fillMeasures() {
  fireEvent.change(await screen.findByLabelText(/^혈압/), { target: { value: "138" } });
  fireEvent.change(screen.getByLabelText("아래 혈압"), { target: { value: "86" } });
  fireEvent.change(screen.getByLabelText("맥박"), { target: { value: "64" } });
  fireEvent.change(screen.getByLabelText(/^혈당/), { target: { value: "127" } });
  fireEvent.change(screen.getByLabelText("인슐린"), { target: { value: "14" } });
}

test("네 항목이 다 차기 전에는 저장할 수 없다", async () => {
  render(<TodayPage />);

  expect(await screen.findByRole("button", { name: "저장하기" })).toBeDisabled();
});

test("네 항목을 채우면 저장할 수 있다", async () => {
  render(<TodayPage />);
  await fillMeasures();

  expect(screen.getByRole("button", { name: "저장하기" })).toBeEnabled();
});

test("저장하면 오늘 값 요약과 3개월 추이로 가는 길이 보인다", async () => {
  render(<TodayPage />);
  await fillMeasures();
  fireEvent.click(screen.getByRole("button", { name: "저장하기" }));

  expect(await screen.findByText("저장했습니다")).toBeInTheDocument();

  const summary = screen.getByLabelText("오늘 기록 요약");
  expect(within(summary).getByText("138 / 86")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "3개월 추이 보기" })).toHaveAttribute("href", "/trend");
});

test("특이사항은 비워도 저장된다", async () => {
  render(<TodayPage />);
  await fillMeasures();
  fireEvent.click(screen.getByRole("button", { name: "저장하기" }));

  expect(await screen.findByText("저장했습니다")).toBeInTheDocument();
});

test("다시 열면 저장한 값이 채워진 채로 열린다", async () => {
  const { unmount } = render(<TodayPage />);
  await fillMeasures();
  fireEvent.click(screen.getByRole("button", { name: "저장하기" }));
  await screen.findByText("저장했습니다");
  unmount();

  render(<TodayPage />);

  expect(await screen.findByText("저장했습니다")).toBeInTheDocument();
  expect(within(screen.getByLabelText("오늘 기록 요약")).getByText("127")).toBeInTheDocument();
});

test("저장할 수 없으면 알리고 입력 화면에 머문다", async () => {
  const blocked = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("exceeded the quota", "QuotaExceededError");
  });

  render(<TodayPage />);
  await fillMeasures();
  fireEvent.click(screen.getByRole("button", { name: "저장하기" }));

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("지금은 저장할 수 없습니다");
  expect(screen.getByRole("button", { name: "저장하기" })).toBeInTheDocument();
  expect(screen.queryByText("저장했습니다")).not.toBeInTheDocument();

  blocked.mockRestore();
});

test("저장이 다시 되면 알림이 사라진다", async () => {
  const blocked = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("exceeded the quota", "QuotaExceededError");
  });

  render(<TodayPage />);
  await fillMeasures();
  fireEvent.click(screen.getByRole("button", { name: "저장하기" }));
  await screen.findByRole("alert");

  blocked.mockRestore();
  fireEvent.click(screen.getByRole("button", { name: "저장하기" }));

  expect(await screen.findByText("저장했습니다")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("기록 고치기를 누르면 저장한 값이 담긴 입력 화면으로 돌아간다", async () => {
  render(<TodayPage />);
  await fillMeasures();
  fireEvent.click(screen.getByRole("button", { name: "저장하기" }));
  fireEvent.click(await screen.findByRole("button", { name: "기록 고치기" }));

  expect(await screen.findByLabelText(/^혈당/)).toHaveValue(127);
});
