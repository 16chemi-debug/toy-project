"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  EMPTY_DRAFT,
  MorningLogForm,
  RECENT_DAYS,
  TodaySummary,
  TrendStack,
  formatDay,
  formatDayWithWeekday,
  isComplete,
  needsExport,
  saveLog,
  sliceDays,
  toDateKey,
  toDraft,
  toLog,
  useLastExport,
  useMorningLogs,
  useMounted,
  type MorningLogDraft,
} from "@/features/morning-log";

const SHELL =
  "mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-3 pb-0 pt-4 text-[19px] leading-[1.5]";
const FOOTER =
  "sticky bottom-0 z-10 bg-background pb-5 pt-3 shadow-[0_-14px_16px_-6px_var(--background)]";
const ACTION =
  "h-auto w-full rounded-[var(--radius)] py-4 text-[21px] font-extrabold tracking-[-0.01em]";
/* 흰 카드가 바닥 위에 떠 있는 모양. 배경이 대비를 만들어 주니 테두리는 1px이면 된다. */
const CARD_SHELL =
  "mb-[7px] rounded-[var(--radius)] border px-[13px] shadow-[0_1px_3px_oklch(0.145_0_0_/_0.05)]";

export default function TodayPage() {
  const mounted = useMounted();
  const logs = useMorningLogs();
  const lastExport = useLastExport();
  const [draft, setDraft] = useState<MorningLogDraft>(EMPTY_DRAFT);
  const [editing, setEditing] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  if (!mounted) return <main className={SHELL} />;

  const today = toDateKey(new Date());
  const todayLog = logs.find((log) => log.date === today);
  const showForm = editing || !todayLog;

  const change = (field: keyof MorningLogDraft, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));

  const save = () => {
    if (!saveLog(toLog(draft, today))) {
      setSaveFailed(true);
      return;
    }

    setSaveFailed(false);
    setEditing(false);
    window.scrollTo({ top: 0 });
  };

  const edit = () => {
    if (todayLog) setDraft(toDraft(todayLog));
    setEditing(true);
  };

  const recent = sliceDays(logs, today, RECENT_DAYS);

  return (
    <main className={SHELL}>
      <div className="flex-1 pb-3">
        {/* 수첩의 날짜 페이지처럼 날짜 아래에 줄을 긋는다. 오늘 한 장이라는 표시다. */}
        <h1 className="mb-2.5 mt-0 border-b border-foreground/15 pb-1.5 text-[26px] font-extrabold tracking-[-0.02em]">
          {formatDayWithWeekday(today)}
        </h1>

        {showForm ? (
          <MorningLogForm draft={draft} onChange={change} />
        ) : (
          <>
            <p className="mb-2.5 mt-0 text-[17px] text-muted-foreground">
              오늘 아침 기록을 남기셨습니다.
            </p>

            <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[17px] font-extrabold text-primary [background:color-mix(in_oklab,var(--primary)_12%,var(--background))]">
              <Check aria-hidden className="size-[17px] stroke-[3.4]" />
              저장했습니다
            </span>

            <Card className={CARD_SHELL + " py-2.5"}>
              <TodaySummary log={todayLog} />
            </Card>

            <Card className={CARD_SHELL + " py-3"}>
              <div className="mb-px flex items-baseline justify-between gap-2.5">
                <span className="text-[19px] font-extrabold tracking-tight">최근 2주</span>
                <span className="text-[16px] font-semibold text-muted-foreground">
                  {formatDay(recent[0].date)} – {formatDay(recent[recent.length - 1].date)}
                </span>
              </div>
              <TrendStack logs={recent} compact />
            </Card>

            {needsExport(logs, lastExport, today) ? (
              <Link
                href="/trend"
                className="mb-[7px] block rounded-[var(--radius)] border-2 border-dashed px-[13px] py-3"
              >
                <span className="block text-[19px] font-extrabold tracking-[-0.01em]">
                  기록을 내보낼 때가 됐습니다
                </span>
                <span className="mt-0.5 block text-[16px] font-medium text-muted-foreground">
                  3개월 추이 화면에서 파일로 내려받으세요
                </span>
              </Link>
            ) : null}

            <button
              type="button"
              onClick={edit}
              className="w-full p-2.5 text-[18px] font-bold text-muted-foreground underline"
            >
              기록 고치기
            </button>
          </>
        )}
      </div>

      <div className={FOOTER}>
        {showForm && saveFailed ? (
          <p
            role="alert"
            className="mb-2 rounded-[var(--radius)] border-2 border-destructive px-[13px] py-2.5 text-destructive [background:color-mix(in_oklab,var(--destructive)_10%,var(--background))]"
          >
            <span className="block text-[20px] font-extrabold tracking-[-0.01em]">
              지금은 저장할 수 없습니다
            </span>
            <span className="mt-0.5 block text-[17px] font-medium">
              종이에 적어두셨다가 다시 기록해 주세요.
            </span>
          </p>
        ) : null}

        {showForm ? (
          <Button className={ACTION} disabled={!isComplete(draft)} onClick={save}>
            저장하기
          </Button>
        ) : (
          <Link
            href="/trend"
            className={cn(
              buttonVariants(),
              ACTION,
              "bg-[var(--navigate)] text-[var(--navigate-foreground)] hover:bg-[color-mix(in_oklab,var(--navigate)_88%,var(--foreground))]",
            )}
          >
            3개월 추이 보기
          </Link>
        )}
      </div>
    </main>
  );
}
