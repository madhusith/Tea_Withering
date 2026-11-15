"use client";

interface AnalogGaugeProps {
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
  sublabel?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}

export function AnalogGauge({
  value,
  min = 0,
  max = 50,
  unit = "°C",
  label,
  sublabel,
  color = "#1B4332",
}: AnalogGaugeProps) {
  // Clamped percentage [0, 1]
  const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);

  // Sweep angle: -120° (min, bottom-left) to +120° (max, bottom-right). Total 240°
  const startAngleDeg = -120;
  const sweepAngleDeg = 240;
  const currentAngleDeg = startAngleDeg + percentage * sweepAngleDeg;

  // Geometry parameters (center at 100, 100)
  const cx = 100;
  const cy = 100;
  const rTrack = 74;

  // Helper to convert polar to cartesian (0° is 12 o'clock, clockwise)
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: centerX + radius * Math.sin(angleInRadians),
      y: centerY - radius * Math.cos(angleInRadians),
    };
  };

  const startPt = polarToCartesian(cx, cy, rTrack, startAngleDeg);
  const endPt = polarToCartesian(cx, cy, rTrack, startAngleDeg + sweepAngleDeg);
  const currentPt = polarToCartesian(cx, cy, rTrack, currentAngleDeg);

  // Background track arc path (240° arc, large-arc-flag = 1)
  const bgPath = `M ${startPt.x.toFixed(2)} ${startPt.y.toFixed(2)} A ${rTrack} ${rTrack} 0 1 1 ${endPt.x.toFixed(2)} ${endPt.y.toFixed(2)}`;

  // Value arc path
  const valueArcDeg = percentage * sweepAngleDeg;
  const largeArcFlag = valueArcDeg > 180 ? 1 : 0;
  const valuePath =
    percentage > 0.005
      ? `M ${startPt.x.toFixed(2)} ${startPt.y.toFixed(2)} A ${rTrack} ${rTrack} 0 ${largeArcFlag} 1 ${currentPt.x.toFixed(2)} ${currentPt.y.toFixed(2)}`
      : "";

  // Needle pointer geometry
  const rTip = 62;
  const rTail = 12;
  const baseWidth = 4.5;
  const currentRad = (currentAngleDeg * Math.PI) / 180;

  const tipX = cx + rTip * Math.sin(currentRad);
  const tipY = cy - rTip * Math.cos(currentRad);
  const tailX = cx - rTail * Math.sin(currentRad);
  const tailY = cy + rTail * Math.cos(currentRad);
  const leftX = cx + baseWidth * Math.cos(currentRad);
  const leftY = cy + baseWidth * Math.sin(currentRad);
  const rightX = cx - baseWidth * Math.cos(currentRad);
  const rightY = cy - baseWidth * Math.sin(currentRad);

  // Ticks
  const tickAngles = [-120, -96, -72, -48, -24, 0, 24, 48, 72, 96, 120];

  return (
    <div className="flex flex-col items-center justify-between w-full">
      <div className="relative w-48 h-44 flex items-center justify-center">
        <svg
          viewBox="0 0 200 180"
          className="w-full h-full overflow-visible"
          aria-label={`${label || "Temperature"} analog dial reading ${value}${unit}`}
        >
          {/* Background Track */}
          <path
            d={bgPath}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Active Filled Value Arc */}
          {valuePath && (
            <path
              d={valuePath}
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeLinecap="round"
            />
          )}

          {/* Tick Lines */}
          <g stroke="#94A3B8">
            {tickAngles.map((deg) => {
              const isMajor = deg % 48 === 0 || deg === 0;
              const rOuter = rTrack - 8;
              const rInner = rOuter - (isMajor ? 7 : 4);
              const pOuter = polarToCartesian(cx, cy, rOuter, deg);
              const pInner = polarToCartesian(cx, cy, rInner, deg);
              return (
                <line
                  key={deg}
                  x1={pInner.x.toFixed(2)}
                  y1={pInner.y.toFixed(2)}
                  x2={pOuter.x.toFixed(2)}
                  y2={pOuter.y.toFixed(2)}
                  strokeWidth={isMajor ? 1.75 : 1}
                  opacity={isMajor ? 0.9 : 0.5}
                />
              );
            })}
          </g>

          {/* Needle Pointer Arrow & Pivot (Pure SVG Coordinates) */}
          <g>
            {/* Tapered Needle Polygon */}
            <polygon
              points={`${leftX.toFixed(2)},${leftY.toFixed(2)} ${tipX.toFixed(2)},${tipY.toFixed(2)} ${rightX.toFixed(2)},${rightY.toFixed(2)} ${tailX.toFixed(2)},${tailY.toFixed(2)}`}
              fill={color}
              stroke={color}
              strokeWidth="1"
              strokeLinejoin="round"
            />
            {/* Pivot Base Hub */}
            <circle cx={cx} cy={cy} r="6.5" fill="#0B1C30" />
            <circle cx={cx} cy={cy} r="2.5" fill="#FFFFFF" />
          </g>
        </svg>

        {/* Dial Scale Numbers */}
        <span className="absolute bottom-4 left-6 text-[11px] font-semibold text-slate-400">
          {min}{unit}
        </span>
        <span className="absolute top-2 text-[11px] font-semibold text-slate-400">
          {(min + max) / 2}{unit}
        </span>
        <span className="absolute bottom-4 right-6 text-[11px] font-semibold text-slate-400">
          {max}{unit}
        </span>
      </div>

      {/* Numeric readout below dial */}
      <div className="flex flex-col items-center -mt-1">
        <span
          className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight"
          style={{ color }}
        >
          {value.toFixed(1)}
          {unit}
        </span>
        {label && (
          <span className="text-[12px] text-slate-500 font-medium">{label}</span>
        )}
        {sublabel && (
          <span className="text-[11px] text-slate-400">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
