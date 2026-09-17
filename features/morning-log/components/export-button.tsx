"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { canExport, exportFileName, toCsv } from "../export";
import { toDateKey, type MorningLog } from "../record";
import { markExported } from "../store";

/**
 * 파일은 자녀가 따로 보관한다. 앱은 되읽지 않으므로 스프레드시트에서 바로 열리는
 * 형식으로 내려준다. BOM이 없으면 Excel이 한글을 깨뜨린다.
 */
function download(logs: MorningLog[]) {
  const blob = new Blob([`﻿${toCsv(logs)}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = exportFileName(logs);
  anchor.click();
  URL.revokeObjectURL(url);

  markExported(toDateKey(new Date()));
}

export function ExportButton({
  logs,
  className,
}: {
  logs: MorningLog[];
  className?: string;
}) {
  return (
    <Button
      onClick={() => download(logs)}
      disabled={!canExport(logs)}
      className={cn(
        "h-auto w-full gap-2.5 rounded-[var(--radius)] py-4 text-[21px] font-extrabold tracking-[-0.01em]",
        // 잠긴 동안에도 버튼 모양을 유지한다. 흐려지기만 하면 눌리지 않는 이유가 보이지 않는다.
        "disabled:opacity-100 disabled:text-muted-foreground",
        "disabled:[background:color-mix(in_oklab,var(--muted-foreground)_25%,var(--background))]",
        className,
      )}
    >
      <Download aria-hidden className="size-[21px]" />
      기록 내보내기
    </Button>
  );
}
