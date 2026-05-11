import { postcodes } from "@/data/postcodes";

// Stylized Bangladesh map with division zones (SVG). Click zones to lookup.
const zones = [
  { id: "Dhaka", color: "var(--chart-1)", path: "M 200,180 L 270,170 L 290,210 L 280,260 L 230,280 L 195,250 Z", label: "Dhaka", x: 240, y: 220 },
  { id: "Chattogram", color: "var(--chart-2)", path: "M 290,260 L 360,250 L 400,330 L 380,420 L 320,400 L 285,330 Z", label: "Chattogram", x: 340, y: 330 },
  { id: "Sylhet", color: "var(--chart-3)", path: "M 290,210 L 380,190 L 400,250 L 360,250 L 290,260 Z", label: "Sylhet", x: 345, y: 225 },
  { id: "Rajshahi", color: "var(--chart-4)", path: "M 100,180 L 200,180 L 195,250 L 130,260 L 90,230 Z", label: "Rajshahi", x: 145, y: 215 },
  { id: "Rangpur", color: "var(--chart-5)", path: "M 110,80 L 220,90 L 200,180 L 100,180 L 90,130 Z", label: "Rangpur", x: 155, y: 130 },
  { id: "Khulna", color: "var(--chart-3)", path: "M 130,260 L 195,250 L 230,280 L 220,360 L 160,360 L 120,310 Z", label: "Khulna", x: 175, y: 310 },
  { id: "Barishal", color: "var(--chart-4)", path: "M 220,360 L 285,330 L 320,400 L 270,420 L 220,400 Z", label: "Barishal", x: 265, y: 380 },
  { id: "Mymensingh", color: "var(--chart-5)", path: "M 220,90 L 290,110 L 290,210 L 200,180 Z", label: "Mymensingh", x: 250, y: 150 },
];

type Props = {
  onSelect?: (division: string) => void;
  highlight?: string;
  layer?: "standard" | "satellite" | "boundary";
  className?: string;
};

export function BangladeshMap({ onSelect, highlight, layer = "standard", className }: Props) {
  const isSat = layer === "satellite";
  const isBoundary = layer === "boundary";
  return (
    <div className={className}>
      <svg viewBox="0 0 500 500" className="w-full h-full" role="img" aria-label="Map of Bangladesh divisions">
        <defs>
          <pattern id="sat" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="oklch(0.30 0.04 150)" />
            <circle cx="3" cy="3" r="1" fill="oklch(0.40 0.06 150)" />
          </pattern>
          <linearGradient id="water" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.85 0.05 220)" />
            <stop offset="100%" stopColor="oklch(0.75 0.07 220)" />
          </linearGradient>
        </defs>

        <rect width="500" height="500" fill={isSat ? "url(#sat)" : "url(#water)"} />

        {zones.map((z) => {
          const active = highlight === z.id;
          const fill = isBoundary ? "transparent" : z.color;
          return (
            <g key={z.id} className="cursor-pointer transition-opacity hover:opacity-90" onClick={() => onSelect?.(z.id)}>
              <path d={z.path} fill={fill} fillOpacity={active ? 0.9 : 0.65} stroke="white" strokeWidth={active ? 3 : 1.5} />
              <text x={z.x} y={z.y} textAnchor="middle" className="pointer-events-none" fill={isSat ? "white" : "oklch(0.18 0.02 150)"} fontSize="12" fontWeight="600">
                {z.label}
              </text>
              {/* sample postcode dots */}
              {postcodes.filter((p) => p.division === z.id).slice(0, 3).map((p, i) => (
                <circle key={p.id} cx={z.x + (i - 1) * 14} cy={z.y + 14} r={3} fill="white" stroke="oklch(0.18 0.02 150)" strokeWidth="1" />
              ))}
            </g>
          );
        })}

        {/* compass */}
        <g transform="translate(450, 40)">
          <circle r="18" fill="white" stroke="oklch(0.18 0.02 150)" />
          <text textAnchor="middle" y="-4" fontSize="10" fontWeight="700">N</text>
          <polygon points="0,-12 4,4 0,0 -4,4" fill="oklch(0.58 0.20 25)" />
        </g>
      </svg>
    </div>
  );
}

export const mapZones = zones;
