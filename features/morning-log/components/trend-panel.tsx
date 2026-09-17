import { movingAverage } from "../trend";

/**
 * 한 수치의 판. 날짜 축은 형제 판들과 공유하므로 좌표계를 고정한다.
 * ui-composition의 데이터 시각화 예외에 따라 직접 그린다.
 */
const WIDTH = 330;
const PAD_LEFT = 34;
const PAD_RIGHT = 4;
const PAD_TOP = 7;
const PAD_BOTTOM = 5;

export type Point = { offset: number; value: number };

type TrendPanelProps = {
  label: string;
  /** 축 전체의 일수. 기록이 빠진 날이 있어도 가로 위치는 달력을 따른다. */
  span: number;
  points: Point[];
  /** 혈압처럼 한 판에 두 선이 필요할 때의 아래쪽 계열. */
  secondPoints?: Point[];
  height: number;
  min: number;
  max: number;
  ticks: number[];
  smoothWindow: number;
  kind?: "line" | "bars";
  /** 옅게 깔 참고 구간. 판정이 아니라 눈으로 견줄 기준이다. */
  normal?: [number, number][];
  targets?: [number, string][];
};

export function TrendPanel({
  label,
  span,
  points,
  secondPoints,
  height,
  min,
  max,
  ticks,
  smoothWindow,
  kind = "line",
  normal,
  targets,
}: TrendPanelProps) {
  const scaleX = (offset: number) => {
    const inner = WIDTH - PAD_LEFT - PAD_RIGHT;
    if (span <= 1) return PAD_LEFT + inner / 2;
    return PAD_LEFT + (offset / (span - 1)) * inner;
  };

  const scaleY = (value: number) =>
    PAD_TOP + (1 - (value - min) / (max - min)) * (height - PAD_TOP - PAD_BOTTOM);

  const toPath = (series: Point[], values: number[]) =>
    series
      .map(
        (point, index) =>
          `${index ? "L" : "M"}${scaleX(point.offset).toFixed(1)} ${scaleY(values[index]).toFixed(1)}`,
      )
      .join(" ");

  const mainRaw = points.map((point) => point.value);
  const mainAverage = movingAverage(mainRaw, smoothWindow);
  const secondRaw = secondPoints?.map((point) => point.value) ?? [];
  const secondAverage = secondPoints ? movingAverage(secondRaw, smoothWindow) : [];

  /**
   * 막대 폭은 기록 개수가 아니라 하루가 차지하는 자리에서 나온다. 개수로 나누면
   * 기록이 하루뿐일 때 막대 하나가 판 전체를 덮어 그래프가 보이지 않는다.
   * 며칠 안 되는 구간에서도 벽처럼 보이지 않도록 상한을 둔다.
   */
  const daySlot = (WIDTH - PAD_LEFT - PAD_RIGHT) / Math.max(span, 1);
  const barWidth = Math.min(Math.max(daySlot - 0.9, 1.5), 14);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      className="block h-auto w-full overflow-visible"
      role="img"
      aria-label={label}
    >
      {normal?.map(([low, high]) => (
        <rect
          key={`normal-${low}-${high}`}
          x={PAD_LEFT}
          width={WIDTH - PAD_LEFT - PAD_RIGHT}
          y={scaleY(high)}
          height={Math.abs(scaleY(low) - scaleY(high))}
          fill="var(--foreground)"
          opacity="var(--trend-normal-opacity)"
        />
      ))}

      {ticks.map((tick) => (
        <g key={`tick-${tick}`}>
          <line
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT}
            y1={scaleY(tick)}
            y2={scaleY(tick)}
            stroke="var(--border)"
            strokeWidth={1}
          />
          <text
            x={PAD_LEFT - 6}
            y={scaleY(tick) + 4.5}
            textAnchor="end"
            className="fill-muted-foreground text-[13px] font-semibold"
          >
            {tick}
          </text>
        </g>
      ))}

      {kind === "bars"
        ? points.map((point) => (
            <rect
              key={`bar-${point.offset}`}
              x={scaleX(point.offset) - barWidth / 2}
              y={scaleY(point.value)}
              width={barWidth}
              height={Math.max(1, scaleY(min) - scaleY(point.value))}
              rx={0.8}
              fill="var(--trend-bar)"
            />
          ))
        : null}

      {kind === "line" && secondPoints ? (
        <>
          <path
            d={`${toPath(points, mainAverage)} ${secondPoints
              .map(
                (point, index) =>
                  `L${scaleX(point.offset).toFixed(1)} ${scaleY(secondAverage[index]).toFixed(1)}`,
              )
              .reverse()
              .join(" ")} Z`}
            fill="var(--trend-band)"
            opacity="var(--trend-band-opacity)"
          />
          <path
            d={toPath(secondPoints, secondRaw)}
            fill="none"
            stroke="var(--trend-daily)"
            strokeWidth={1.1}
            strokeLinejoin="round"
            opacity={0.5}
          />
          <path
            d={toPath(secondPoints, secondAverage)}
            fill="none"
            stroke="var(--trend-strong)"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      ) : null}

      {kind === "line" ? (
        <>
          <path
            d={toPath(points, mainRaw)}
            fill="none"
            stroke="var(--trend-daily)"
            strokeWidth={1.1}
            strokeLinejoin="round"
            opacity={0.5}
          />
          <path
            d={toPath(points, mainAverage)}
            fill="none"
            stroke="var(--trend-strong)"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      ) : null}

      {/* 두 점보다 적으면 선이 그려지지 않아 판이 빈다. 그럴 때는 값을 점으로 찍는다. */}
      {kind === "line" && points.length <= 2
        ? [
            ...points.map((point, index) => [point, mainRaw[index], "main"] as const),
            ...(secondPoints ?? []).map((point, index) => [point, secondRaw[index], "second"] as const),
          ].map(([point, value, series]) => (
            <circle
              key={`dot-${series}-${point.offset}`}
              cx={scaleX(point.offset)}
              cy={scaleY(value)}
              r={3.2}
              fill="var(--trend-strong)"
            />
          ))
        : null}

      {/* 참고 구간의 회색은 위아래 혈압 사이의 띠에 가려지므로 경계를 다시 긋는다. */}
      {[
        ...(normal?.flatMap(([low, high]): [number, string][] => [
          [high, String(high)],
          [low, String(low)],
        ]) ?? []),
        ...(targets ?? []),
      ].map(([value, text]) => (
        <g key={`reference-${value}`}>
          <line
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT - 34}
            y1={scaleY(value)}
            y2={scaleY(value)}
            stroke="var(--muted-foreground)"
            strokeWidth={1.4}
            strokeDasharray="5 4"
          />
          <text
            x={WIDTH - PAD_RIGHT - 30}
            y={scaleY(value) + 4}
            className="fill-muted-foreground text-[12.5px] font-bold"
          >
            {text}
          </text>
        </g>
      ))}
    </svg>
  );
}

export { WIDTH as TREND_WIDTH, PAD_LEFT as TREND_PAD_LEFT, PAD_RIGHT as TREND_PAD_RIGHT };
