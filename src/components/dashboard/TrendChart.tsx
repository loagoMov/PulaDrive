"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DataPoint {
    date: string;   // ISO date string "YYYY-MM-DD"
    count: number;
}

export interface TrendChartProps {
    data: DataPoint[];
    title?: string;
    color?: string;          // hex or css colour for the primary accent
    type?: "line" | "bar" | "pie";
    height?: number;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatDate(iso: string): string {
    // Check if the label matches a YYYY-MM-DD format.
    // If not, it is a category or action label, so return it directly.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        return iso;
    }
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function clamp(val: number, min: number, max: number) {
    return Math.min(Math.max(val, min), max);
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

function LineChart({ data, color, height }: { data: DataPoint[]; color: string; height: number }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; point: DataPoint } | null>(null);
    const [dims, setDims] = useState({ w: 400, h: height });

    useEffect(() => {
        const obs = new ResizeObserver((entries) => {
            const el = entries[0].contentRect;
            setDims({ w: el.width || 400, h: height });
        });
        if (svgRef.current?.parentElement) obs.observe(svgRef.current.parentElement);
        return () => obs.disconnect();
    }, [height]);

    if (!data.length) return <p className="text-slate-400 text-sm text-center py-8">No data available.</p>;

    const pad = { top: 12, right: 16, bottom: 36, left: 40 };
    const W = dims.w - pad.left - pad.right;
    const H = dims.h - pad.top - pad.bottom;

    const maxVal = Math.max(...data.map((d) => d.count), 1);
    const stepX = data.length > 1 ? W / (data.length - 1) : W;

    const pts = data.map((d, i) => ({
        x: pad.left + i * stepX,
        y: pad.top + H - (d.count / maxVal) * H,
        d,
    }));

    const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");

    // Filled area under the line
    const area =
        `M${pts[0].x},${pad.top + H} ` +
        pts.map((p) => `L${p.x},${p.y}`).join(" ") +
        ` L${pts[pts.length - 1].x},${pad.top + H} Z`;

    // Y-axis gridlines
    const ticks = 4;
    const gridLines = Array.from({ length: ticks + 1 }, (_, i) => {
        const val = Math.round((maxVal / ticks) * i);
        const y = pad.top + H - (val / maxVal) * H;
        return { val, y };
    });

    // X-axis labels: show max 7 evenly spaced
    const labelStep = Math.max(1, Math.floor(data.length / 7));
    const xLabels = pts.filter((_, i) => i % labelStep === 0 || i === pts.length - 1);

    return (
        <div className="relative w-full select-none" style={{ height: dims.h }}>
            <svg
                ref={svgRef}
                width="100%"
                height={dims.h}
                className="overflow-visible"
                onMouseLeave={() => setTooltip(null)}
            >
                <defs>
                    <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                    </linearGradient>
                </defs>

                {/* Grid lines */}
                {gridLines.map(({ val, y }, i) => (
                    <g key={i}>
                        <line x1={pad.left} x2={pad.left + W} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3,3" />
                        <text x={pad.left - 6} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={10} fontFamily="inherit">
                            {val}
                        </text>
                    </g>
                ))}

                {/* Area fill */}
                <path d={area} fill="url(#lg)" />

                {/* Line */}
                <polyline points={polyline} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

                {/* Dots + hit areas */}
                {pts.map((p, i) => (
                    <g key={i} onMouseEnter={() => setTooltip({ x: p.x, y: p.y, point: p.d })}>
                        <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
                        <circle cx={p.x} cy={p.y} r={tooltip?.point === p.d ? 5 : 3.5} fill={color} stroke="white" strokeWidth={2} />
                    </g>
                ))}

                {/* X axis labels */}
                {xLabels.map(({ x, d }, i) => (
                    <text key={i} x={x} y={pad.top + H + 20} textAnchor="middle" fill="#94a3b8" fontSize={10} fontFamily="inherit">
                        {formatDate(d.date)}
                    </text>
                ))}
            </svg>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="absolute pointer-events-none bg-slate-900 text-white rounded-xl px-3 py-2 text-xs font-bold shadow-xl -translate-x-1/2 -translate-y-full"
                    style={{
                        left: clamp(tooltip.x, 50, dims.w - 50),
                        top: tooltip.y - 10,
                    }}
                >
                    <p className="text-slate-400 font-medium">{formatDate(tooltip.point.date)}</p>
                    <p>{tooltip.point.count} events</p>
                </div>
            )}
        </div>
    );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data, color, height }: { data: DataPoint[]; color: string; height: number }) {
    const [hovered, setHovered] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerW, setContainerW] = useState(400);

    useEffect(() => {
        const obs = new ResizeObserver((entries) => {
            setContainerW(entries[0].contentRect.width || 400);
        });
        if (containerRef.current) obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    if (!data.length) return <p className="text-slate-400 text-sm text-center py-8">No data available.</p>;

    const pad = { top: 12, right: 8, bottom: 36, left: 40 };
    const W = containerW - pad.left - pad.right;
    const H = height - pad.top - pad.bottom;

    const maxVal = Math.max(...data.map((d) => d.count), 1);
    const totalBars = data.length;
    const gap = Math.max(2, W / totalBars * 0.2);
    const barW = (W - gap * (totalBars - 1)) / totalBars;

    const labelStep = Math.max(1, Math.floor(data.length / 7));

    return (
        <div ref={containerRef} className="relative w-full" style={{ height }}>
            <svg width="100%" height={height} className="overflow-visible">
                {/* Y ticks */}
                {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                    const val = Math.round(maxVal * frac);
                    const y = pad.top + H - H * frac;
                    return (
                        <g key={i}>
                            <line x1={pad.left} x2={pad.left + W} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3,3" />
                            <text x={pad.left - 6} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={10} fontFamily="inherit">{val}</text>
                        </g>
                    );
                })}

                {/* Bars */}
                {data.map((d, i) => {
                    const barH = (d.count / maxVal) * H;
                    const x = pad.left + i * (barW + gap);
                    const y = pad.top + H - barH;
                    const isHovered = hovered === i;
                    return (
                        <g key={i}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <rect
                                x={x} y={y} width={barW} height={barH}
                                rx={Math.min(4, barW / 3)}
                                fill={color}
                                opacity={isHovered ? 1 : 0.75}
                            />
                            {isHovered && (
                                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fill={color} fontSize={10} fontWeight="bold" fontFamily="inherit">
                                    {d.count}
                                </text>
                            )}
                            {i % labelStep === 0 || i === data.length - 1 ? (
                                <text x={x + barW / 2} y={pad.top + H + 20} textAnchor="middle" fill="#94a3b8" fontSize={9} fontFamily="inherit">
                                    {formatDate(d.date)}
                                </text>
                            ) : null}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

// ─── Pie / Donut Chart ────────────────────────────────────────────────────────

const PIE_COLOURS = [
    "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
    "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
];

interface PieSlice { label: string; value: number; color: string; }

function PieChart({ slices, height }: { slices: PieSlice[]; height: number }) {
    const [hovered, setHovered] = useState<number | null>(null);
    const R = height / 2 - 16;
    const cx = height / 2;
    const cy = height / 2;
    const total = slices.reduce((s, d) => s + d.value, 0) || 1;

    let cursor = -Math.PI / 2;
    const paths = slices.map((s, i) => {
        const angle = (s.value / total) * 2 * Math.PI;
        const x1 = cx + R * Math.cos(cursor);
        const y1 = cy + R * Math.sin(cursor);
        cursor += angle;
        const x2 = cx + R * Math.cos(cursor);
        const y2 = cy + R * Math.sin(cursor);
        const large = angle > Math.PI ? 1 : 0;
        return { path: `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} Z`, s, i, angle };
    });

    if (!slices.length) return <p className="text-slate-400 text-sm text-center py-8">No data available.</p>;

    return (
        <div className="flex items-center gap-6 flex-wrap">
            <svg width={height} height={height} className="shrink-0">
                {/* Donut hole */}
                <circle cx={cx} cy={cy} r={R * 0.42} fill="white" />
                {paths.map(({ path, s, i, angle }) => (
                    <path
                        key={i}
                        d={path}
                        fill={s.color}
                        opacity={hovered === i ? 1 : angle < 0.01 ? 0 : 0.85}
                        stroke="white"
                        strokeWidth={2}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                    />
                ))}
                {hovered !== null && (
                    <text x={cx} y={cy + 5} textAnchor="middle" dominantBaseline="middle" fontSize={13} fontWeight="bold" fill="#0f172a" fontFamily="inherit">
                        {Math.round((slices[hovered].value / total) * 100)}%
                    </text>
                )}
            </svg>
            <ul className="flex-1 space-y-1.5 min-w-0">
                {slices.map((s, i) => (
                    <li key={i} className={`flex items-center gap-2 text-xs transition-opacity ${hovered !== null && hovered !== i ? "opacity-40" : ""}`}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="font-semibold text-slate-700 truncate">{s.label}</span>
                        <span className="ml-auto font-black text-slate-900 shrink-0">{s.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ─── Main TrendChart export ───────────────────────────────────────────────────

export default function TrendChart({ data, title, color = "#6366f1", type = "line", height = 200 }: TrendChartProps) {
    return (
        <div className="w-full">
            {title && (
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{title}</p>
            )}
            {type === "line" && <LineChart data={data} color={color} height={height} />}
            {type === "bar" && <BarChart data={data} color={color} height={height} />}
            {type === "pie" && (
                <PieChart
                    slices={data.map((d, i) => ({ label: formatDate(d.date), value: d.count, color: PIE_COLOURS[i % PIE_COLOURS.length] }))}
                    height={height}
                />
            )}
        </div>
    );
}

// Re-export PIE_COLOURS for custom pie usage
export { PIE_COLOURS, PieChart };
export type { PieSlice };
