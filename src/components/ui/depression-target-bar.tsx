"use client";

interface DepressionTargetBarProps {
  measuredDelta: number;
  minTarget?: number;
  maxTarget?: number;
  maxScale?: number;
}

export function DepressionTargetBar({
  measuredDelta,
  minTarget = 3.5,
  maxTarget = 4.8,
  maxScale = 8.0,
}: DepressionTargetBarProps) {
  const windowLeftPercent = (minTarget / maxScale) * 100;
  const windowWidthPercent = ((maxTarget - minTarget) / maxScale) * 100;
  const markerPercent = Math.min(Math.max((measuredDelta / maxScale) * 100, 0), 100);

  const isAbove = measuredDelta > maxTarget;
  const isBelow = measuredDelta < minTarget;
  const isOptimal = !isAbove && !isBelow;

  const variance = isAbove
    ? `+${(measuredDelta - maxTarget).toFixed(1)}°C Above Band`
    : isBelow
    ? `-${(minTarget - measuredDelta).toFixed(1)}°C Below Band`
    : "Optimal Target Window";

  return (
    <div className="flex flex-col gap-2 w-full bg-[#F0F5FA] p-4 rounded-xl border border-[#E2E8F0]">
      <div className="flex justify-between items-center text-[11px]">
        <span className="text-slate-600">
          Target Window:{" "}
          <strong className="text-[#1B4332]">
            {minTarget.toFixed(1)}°C – {maxTarget.toFixed(1)}°C
          </strong>
        </span>
        <span
          className={`font-semibold ${
            isOptimal ? "text-[#166534]" : "text-amber-800"
          }`}
        >
          {variance}
        </span>
      </div>

      {/* Range Track with Window and Current Marker */}
      <div className="relative w-full h-3 bg-[#E2E8F0] rounded-full overflow-hidden">
        {/* Optimal Green Window */}
        <div
          className="absolute h-full bg-[#86d7ad]"
          style={{
            left: `${windowLeftPercent}%`,
            width: `${windowWidthPercent}%`,
          }}
          title={`Optimal Window: ${minTarget}°C - ${maxTarget}°C`}
        />

        {/* Current Measured Value Marker */}
        <div
          className={`absolute -top-0.5 -bottom-0.5 w-2 rounded-full shadow-xs transition-all duration-500 ${
            isOptimal ? "bg-[#116c4a]" : "bg-amber-600"
          }`}
          style={{
            left: `calc(${markerPercent}% - 4px)`,
          }}
          title={`Measured Delta: ${measuredDelta}°C`}
        />
      </div>

      <div className="flex justify-between text-slate-400 text-[10px] pt-0.5">
        <span>0°C</span>
        <span className="text-[#1B4332] font-semibold">Optimal Window</span>
        <span>{maxScale.toFixed(1)}°C</span>
      </div>
    </div>
  );
}

