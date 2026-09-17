"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import {
  EXPORT_MIN_RECORDS,
  ExportButton,
  TREND_DAYS,
  canExport,
  TrendNotes,
  TrendStack,
  formatDay,
  sliceDays,
  toDateKey,
  useMorningLogs,
  useMounted,
} from "@/features/morning-log";

const SHELL =
  "mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-3 pb-0 pt-4 text-[19px] leading-[1.5]";
const FOOTER =
  "sticky bottom-0 z-10 bg-background pb-5 pt-3 shadow-[0_-14px_16px_-6px_var(--background)]";
const CARD_SHELL =
  "mb-[7px] rounded-[var(--radius)] border px-[13px] shadow-[0_1px_3px_oklch(0.145_0_0_/_0.05)]";

export default function TrendPage() {
  const mounted = useMounted();
  const stored = useMorningLogs();

  if (!mounted) return <main className={SHELL} />;

  const logs = sliceDays(stored, toDateKey(new Date()), TREND_DAYS);

  return (
    <main className={SHELL}>
      <div className="flex-1 pb-3">
        <h1 className="mb-px mt-0 text-[26px] font-extrabold tracking-[-0.02em]">최근 3개월</h1>


        {logs.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyTitle className="text-[23px] font-extrabold">아직 기록이 없습니다</EmptyTitle>
              <EmptyDescription className="text-[18px]">
                아침 기록을 남기시면 여기에 추이가 그려집니다.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {/* 홈의 날짜 머리와 같은 방식으로, 머리글 아래에 줄을 긋는다. */}
            <p className="mb-2.5 mt-0 border-b border-foreground/15 pb-1.5 text-[17px] text-muted-foreground">
              {formatDay(logs[0].date)}부터 {formatDay(logs[logs.length - 1].date)}까지,{" "}
              {logs.length}일 기록
            </p>

            <Card className={CARD_SHELL + " py-3"}>
              <TrendStack logs={logs} withAxis />
            </Card>

            <Card className={CARD_SHELL + " py-3"}>
              <h2 className="mb-1.5 mt-0 text-[21px] font-extrabold tracking-[-0.02em]">
                특이사항
              </h2>
              <TrendNotes logs={logs} />
            </Card>

            <ExportButton logs={stored} className="mt-3" />
            <p className="mt-2 text-[16px] text-muted-foreground">
              {canExport(stored)
                ? `쌓인 기록 ${stored.length}일치를 파일 하나로 내려받아 별도 관리합니다.`
                : `기록이 ${EXPORT_MIN_RECORDS}일치를 넘으면 파일로 내려받아 별도 관리할 수 있습니다. 지금은 ${stored.length}일치입니다.`}
            </p>
          </>
        )}
      </div>

      <div className={FOOTER}>
        {/* 다른 화면으로 가는 길이라 초록이 아닌 파랑을 쓴다. */}
        <Link
          href="/"
          className={cn(
            buttonVariants(),
            "h-auto w-full rounded-[var(--radius)] py-4 text-[21px] font-extrabold tracking-[-0.01em]",
            "bg-[var(--navigate)] text-[var(--navigate-foreground)] hover:bg-[color-mix(in_oklab,var(--navigate)_88%,var(--foreground))]",
          )}
        >
          오늘 기록으로
        </Link>
      </div>
    </main>
  );
}
