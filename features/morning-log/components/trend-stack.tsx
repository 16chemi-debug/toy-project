import { formatDay, fromDateKey, type MorningLog } from "../record";
import { daysBetween } from "../trend";
import {
  TREND_PAD_LEFT,
  TREND_PAD_RIGHT,
  TREND_WIDTH,
  TrendPanel,
  type Point,
} from "./trend-panel";

type TrendStackProps = {
  logs: MorningLog[];
  /** 아침 직후의 짧은 확인용. 판을 줄이고 창을 좁힌다. */
  compact?: boolean;
  /** 날짜 축과 표식 설명을 붙일지. 진료실에서 보이는 화면에만 붙인다. */
  withAxis?: boolean;
};

const HEIGHTS = { bloodPressure: 96, glucose: 86, pulse: 74, dose: 64 };

export function TrendStack({ logs, compact = false, withAxis = false }: TrendStackProps) {
  if (logs.length === 0) return null;

  const scale = compact ? 0.74 : 1;
  const smoothWindow = compact ? 3 : 7;
  const first = logs[0];
  const latest = logs[logs.length - 1];
  const span = daysBetween(first.date, latest.date) + 1;

  const points = (read: (log: MorningLog) => number): Point[] =>
    logs.map((log) => ({ offset: daysBetween(first.date, log.date), value: read(log) }));

  return (
    <div>
      <Panel name="혈압" latest={`${latest.systolic} / ${latest.diastolic}`}>
        <TrendPanel
          label="혈압 추이"
          span={span}
          points={points((log) => log.systolic)}
          secondPoints={points((log) => log.diastolic)}
          height={Math.round(HEIGHTS.bloodPressure * scale)}
          min={60}
          max={160}
          ticks={[80, 120, 160]}
          smoothWindow={smoothWindow}
          normal={[[90, 130]]}
        />
      </Panel>

      <Panel name="혈당" latest={String(latest.glucose)}>
        <TrendPanel
          label="혈당 추이"
          span={span}
          points={points((log) => log.glucose)}
          height={Math.round(HEIGHTS.glucose * scale)}
          min={90}
          max={190}
          ticks={[140, 180]}
          smoothWindow={smoothWindow}
          targets={[[100, "100"]]}
        />
      </Panel>

      {compact ? null : (
        <>
          <Panel name="맥박" latest={String(latest.pulse)}>
            <TrendPanel
              label="맥박 추이"
              span={span}
              points={points((log) => log.pulse)}
              height={HEIGHTS.pulse}
              min={50}
              max={90}
              ticks={[60, 80]}
              smoothWindow={smoothWindow}
            />
          </Panel>

          <Panel name="인슐린" latest={`${latest.dose} 단위`}>
            <TrendPanel
              label="인슐린 투약 단위"
              span={span}
              points={points((log) => log.dose)}
              height={HEIGHTS.dose}
              min={0}
              max={20}
              ticks={[10, 20]}
              smoothWindow={smoothWindow}
              kind="bars"
            />
          </Panel>
        </>
      )}

      {withAxis ? <Axis logs={logs} span={span} /> : null}
    </div>
  );
}

function Panel({
  name,
  latest,
  children,
}: {
  name: string;
  latest: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-0.5">
      <div className="mb-px flex items-baseline justify-between gap-2.5">
        <span className="text-[19px] font-extrabold tracking-tight">{name}</span>
        <span className="text-[16px] font-semibold text-muted-foreground">
          오늘 <b className="text-[20px] font-extrabold text-foreground">{latest}</b>
        </span>
      </div>
      {children}
    </div>
  );
}

const AXIS_HEIGHT = 40;

function Axis({ logs, span }: { logs: MorningLog[]; span: number }) {
  const first = logs[0];
  const scaleX = (offset: number) => {
    const inner = TREND_WIDTH - TREND_PAD_LEFT - TREND_PAD_RIGHT;
    if (span <= 1) return TREND_PAD_LEFT + inner / 2;
    return TREND_PAD_LEFT + (offset / (span - 1)) * inner;
  };

  const noted = logs.filter((log) => log.note !== "");
  const start = fromDateKey(first.date);
  const monthMarks: { offset: number; text: string }[] = [];
  let lastX = -99;

  for (let offset = 0; offset < span; offset += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
    if (offset !== 0 && date.getDate() !== 1) continue;
    const x = scaleX(offset);
    if (x - lastX < 34) continue;
    lastX = x;
    monthMarks.push({ offset, text: `${date.getMonth() + 1}월` });
  }

  return (
    <div className="mt-0.5 border-t pt-0.5">
      <svg
        viewBox={`0 0 ${TREND_WIDTH} ${AXIS_HEIGHT}`}
        className="block h-auto w-full overflow-visible"
        role="img"
        aria-label="기간과 특이사항을 적은 날"
      >
        {noted.map((log) => {
          const x = scaleX(daysBetween(first.date, log.date));
          return (
            <path
              key={`note-${log.date}`}
              d={`M${x.toFixed(1)} 1 l4 7 h-8 Z`}
              fill="var(--trend-strong)"
            />
          );
        })}
        <line
          x1={TREND_PAD_LEFT}
          x2={TREND_WIDTH - TREND_PAD_RIGHT}
          y1={15}
          y2={15}
          stroke="var(--border)"
          strokeWidth={1}
        />
        {monthMarks.map((mark) => (
          <text
            key={`month-${mark.offset}`}
            x={scaleX(mark.offset)}
            y={32}
            textAnchor={mark.offset === 0 ? "start" : "middle"}
            className="fill-muted-foreground text-[13px] font-semibold"
          >
            {mark.text}
          </text>
        ))}
      </svg>

      <p className="mt-0.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[15px] font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <i
            aria-hidden
            className="inline-block h-[11px] w-[18px] rounded-[2px] border"
            style={{ background: "color-mix(in oklab, var(--foreground) 7%, var(--card))" }}
          />
          혈압 정상 범위 90–130
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i
            aria-hidden
            className="inline-block h-0 w-[18px] border-t-2 border-dashed border-muted-foreground"
          />
          혈당 정상 기준 100
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="13" height="11" viewBox="0 0 10 9" aria-hidden>
            <path fill="var(--trend-strong)" d="M5 0l4 7H1z" />
          </svg>
          특이사항을 적은 날
        </span>
      </p>
    </div>
  );
}

export function TrendNotes({ logs }: { logs: MorningLog[] }) {
  const noted = logs.filter((log) => log.note !== "").slice(-5).reverse();

  if (noted.length === 0) {
    return <p className="text-[18px] text-muted-foreground">적어두신 특이사항이 없습니다.</p>;
  }

  return (
    <div>
      {noted.map((log) => (
        <div key={log.date} className="border-b py-2.5 last:border-b-0">
          <b className="block text-[16px] font-bold text-muted-foreground">
            {formatDay(log.date)}
          </b>
          <p className="mt-px text-[18px]">{log.note}</p>
        </div>
      ))}
    </div>
  );
}
