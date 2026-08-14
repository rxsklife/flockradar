export default function Legend() {
  return (
    <div className="absolute bottom-24 right-4 z-[1000] hidden w-44 rounded-lg border border-navy-600 bg-navy-900 p-2.5 shadow-lg sm:block">
      <h3 className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-steel-400">
        Legend
      </h3>
      <div className="space-y-2 text-xs text-steel-300">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative icon */}
          <img
            src="/police-marker.png"
            alt=""
            className="h-8 w-8 shrink-0"
            draggable={false}
          />
          <span className="leading-tight">Law Enforcement Deployed</span>
        </div>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative icon */}
          <img
            src="/flock-marker.png"
            alt=""
            className="flock-legend-icon h-8 w-8 shrink-0"
            draggable={false}
          />
          <span className="leading-tight">Community Reported</span>
        </div>
      </div>
    </div>
  );
}
