import type { MorningLog } from "../record";

const ROW = "flex items-baseline justify-between gap-3 border-b py-1.5 last:border-b-0";
const NAME = "m-0 text-[38px] font-bold tracking-[-0.02em]";
const VALUE = "m-0 text-[32px] font-extrabold tracking-[-0.02em]";
const UNIT = "ml-[3px] text-[16px] font-semibold text-muted-foreground";

export function TodaySummary({ log }: { log: MorningLog }) {
  return (
    <dl className="m-0" aria-label="오늘 기록 요약">
      <div className={ROW}>
        <dt className={NAME}>혈압</dt>
        <dd className={VALUE}>
          {log.systolic} / {log.diastolic}
        </dd>
      </div>
      <div className={ROW}>
        <dt className={NAME}>맥박</dt>
        <dd className={VALUE}>
          {log.pulse}
          <small className={UNIT}>회/분</small>
        </dd>
      </div>
      <div className={ROW}>
        <dt className={NAME}>혈당</dt>
        <dd className={VALUE}>
          {log.glucose}
          <small className={UNIT}>mg/dL</small>
        </dd>
      </div>
      <div className={ROW}>
        <dt className={NAME}>인슐린</dt>
        <dd className={VALUE}>
          {log.dose}
          <small className={UNIT}>단위</small>
        </dd>
      </div>
    </dl>
  );
}
