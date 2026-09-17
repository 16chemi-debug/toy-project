"use client";

import { useRef, useState } from "react";
import { Droplet, Gauge, Heart, MessageSquare, Syringe } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { MorningLogDraft } from "../record";

type MorningLogFormProps = {
  draft: MorningLogDraft;
  onChange: (field: keyof MorningLogDraft, value: string) => void;
};

/* 배경이 종이를 올려둔 바닥이라 카드는 흰색으로 떠오른다. 테두리를 굵게 두를 필요가
   없어져 1px로 줄이고, 대신 아주 옅은 그림자로 들어올린다. */
const CARD =
  "mb-[7px] rounded-[var(--radius)] border bg-card px-[13px] pb-[11px] pt-[9px] shadow-[0_1px_3px_oklch(0.145_0_0_/_0.05)]";
/* 글자 말고도 어느 칸인지 알아볼 단서를 하나 더 준다. 네 아이콘은 서로 확실히
   다른 모양이어야 구실을 한다. */
const LABEL =
  "mb-[5px] flex items-center gap-2 text-[38px] font-bold leading-[1.12] tracking-[-0.02em]";
const ICON = "size-[30px] shrink-0 text-primary";
const HINT = "text-[22px] font-medium text-muted-foreground";
const FIELD =
  "h-auto w-full min-w-0 flex-1 rounded-[calc(var(--radius)*0.8)] border-2 p-[6px] text-center text-[32px] font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const UNIT = "min-w-[56px] text-[17px] font-bold text-muted-foreground whitespace-nowrap";

export function MorningLogForm({ draft, onChange }: MorningLogFormProps) {
  const [noteOpen, setNoteOpen] = useState(draft.note !== "");
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const openNote = () => {
    setNoteOpen(true);
    // 펼친 칸이 아래 고정된 저장 버튼에 가리지 않도록 화면 끝까지 내린다.
    requestAnimationFrame(() => {
      noteRef.current?.scrollIntoView({ block: "end" });
      noteRef.current?.focus({ preventScroll: true });
    });
  };

  return (
    <div>
      <div className={CARD}>
        <label className={LABEL} htmlFor="systolic">
          <Gauge aria-hidden strokeWidth={2.4} className={ICON} />
          혈압 <span className={HINT}>위 / 아래</span>
        </label>
        <div className="flex items-center gap-[9px]">
          <Input
            id="systolic"
            className={FIELD}
            type="number"
            inputMode="numeric"
            placeholder="140"
            value={draft.systolic}
            onChange={(event) => onChange("systolic", event.target.value)}
          />
          <span aria-hidden className="text-[27px] font-bold text-muted-foreground">
            /
          </span>
          <Input
            id="diastolic"
            aria-label="아래 혈압"
            className={FIELD}
            type="number"
            inputMode="numeric"
            placeholder="90"
            value={draft.diastolic}
            onChange={(event) => onChange("diastolic", event.target.value)}
          />
        </div>
      </div>

      <div className={CARD}>
        <label className={LABEL} htmlFor="pulse">
          <Heart aria-hidden strokeWidth={2.4} className={ICON} />
          맥박
        </label>
        <div className="flex items-center gap-[9px]">
          <Input
            id="pulse"
            className={FIELD}
            type="number"
            inputMode="numeric"
            placeholder="60"
            value={draft.pulse}
            onChange={(event) => onChange("pulse", event.target.value)}
          />
          <span className={UNIT}>회 / 분</span>
        </div>
      </div>

      <div className={CARD}>
        <label className={LABEL} htmlFor="glucose">
          <Droplet aria-hidden strokeWidth={2.4} className={ICON} />
          혈당 <span className={HINT}>기상 후</span>
        </label>
        <div className="flex items-center gap-[9px]">
          <Input
            id="glucose"
            className={FIELD}
            type="number"
            inputMode="numeric"
            placeholder="130"
            value={draft.glucose}
            onChange={(event) => onChange("glucose", event.target.value)}
          />
          <span className={UNIT}>mg/dL</span>
        </div>
      </div>

      <div className={CARD}>
        <label className={LABEL} htmlFor="dose">
          <Syringe aria-hidden strokeWidth={2.4} className={ICON} />
          인슐린
        </label>
        <div className="flex items-center gap-[9px]">
          <Input
            id="dose"
            className={FIELD}
            type="number"
            inputMode="numeric"
            placeholder="14"
            value={draft.dose}
            onChange={(event) => onChange("dose", event.target.value)}
          />
          <span className={UNIT}>단위</span>
        </div>
      </div>

      {noteOpen ? (
        <div className={CARD}>
          <label className={LABEL} htmlFor="note">
            <MessageSquare aria-hidden strokeWidth={2.4} className={ICON} />
            특이사항
          </label>
          <Textarea
            id="note"
            ref={noteRef}
            // 아래 고정된 저장 버튼만큼 여백을 두어야 scrollIntoView가 칸을 가리지 않는다.
            className="min-h-[76px] w-full scroll-mb-[110px] rounded-[calc(var(--radius)*0.8)] border-2 p-2.5 text-[18px] leading-[1.45]"
            placeholder="몸 상태나 남길 말"
            value={draft.note}
            onChange={(event) => onChange("note", event.target.value)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={openNote}
          className="mb-[7px] flex w-full items-baseline justify-between gap-2.5 rounded-[var(--radius)] border bg-card px-[13px] py-3 text-left text-[38px] font-bold leading-[1.12] tracking-[-0.02em] shadow-[0_1px_3px_oklch(0.145_0_0_/_0.05)]"
        >
          <span className="flex items-center gap-2"><MessageSquare aria-hidden strokeWidth={2.4} className={ICON} />특이사항</span>
          <span aria-hidden className="text-[30px] font-medium text-muted-foreground">
            ＋
          </span>
        </button>
      )}
    </div>
  );
}
