"use client";

import { useState } from "react";
import { Clock } from "lucide-react";

const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const dayShort = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function HeatMap({ heatMapMatrix, totalCourts }: { heatMapMatrix: Array<number[]>, totalCourts: number }) {
    const [tooltip, setTooltip] = useState<{
        count: number,
        dayName: string,
        hour: number,
        x: number,
        y: number
    } | null>(null);

    return (
        <section className="flex flex-col gap-3 overflow-x-auto max-w-full pb-2 w-full">
            <div className="flex gap-2 items-center">
                <div className="w-12 sm:w-16 shrink-0" /> {/* spacer to align with day labels */}
                {Array.from({ length: 14 }, (_, i) => (
                    <div key={i} className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold text-gray-400">
                        {String(i + 8).padStart(2, "0")}h
                    </div>
                ))}
            </div>

            {heatMapMatrix.map((dayTimes, dayIndex) => (
                <div key={dayIndex} className="flex items-center gap-2">
                    <span className="w-12 sm:w-16 text-left font-bold text-xs text-gray-700 shrink-0">
                        {dayShort[dayIndex]}
                    </span>
                    <div className="flex gap-2">
                        {dayTimes.map((amountOfBookings, hourIndex) => {
                            if (hourIndex < 8 || hourIndex > 21) return null;
                            const occupancyRatio = totalCourts > 0 ? (amountOfBookings / totalCourts) : 0;
                            const percentage = Math.round(occupancyRatio * 100);
                            
                            // Determine background color and opacity
                            let bgClass = "bg-gray-100 hover:bg-gray-200";
                            let opacity = 1;
                            
                            if (amountOfBookings > 0) {
                                if (occupancyRatio >= 0.8) {
                                    bgClass = "bg-emerald-800 text-white";
                                } else if (occupancyRatio >= 0.5) {
                                    bgClass = "bg-emerald-600 text-white";
                                } else if (occupancyRatio >= 0.2) {
                                    bgClass = "bg-emerald-400 text-white";
                                } else {
                                    bgClass = "bg-emerald-200 text-emerald-900";
                                }
                            }

                            return (
                                <div key={hourIndex} className="relative">
                                    <div 
                                        onMouseEnter={(e) => setTooltip({ 
                                            count: amountOfBookings, 
                                            dayName: days[dayIndex],
                                            hour: hourIndex,
                                            x: e.clientX, 
                                            y: e.clientY 
                                        })}
                                        onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                                        onMouseLeave={() => setTooltip(null)}
                                        className={`w-7 h-7 sm:w-10 sm:h-10 rounded-xl cursor-pointer transition-all duration-200 hover:scale-115 flex items-center justify-center text-[10px] font-bold shadow-2xs ${bgClass}`}
                                    >
                                        {amountOfBookings > 0 ? amountOfBookings : ""}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Heat Intensity Scale Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Horario de atención: <strong>08:00 a 22:00</strong></span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Intensidad:</span>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-md bg-gray-100 border border-gray-200" title="0 canchas" />
                        <span className="text-[10px]">0</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-md bg-emerald-200" title="1-2 canchas" />
                        <span className="text-[10px]">Baja</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-md bg-emerald-400" title="3-4 canchas" />
                        <span className="text-[10px]">Media</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-md bg-emerald-600" title="5-7 canchas" />
                        <span className="text-[10px]">Alta</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-md bg-emerald-800" title="8-10 canchas" />
                        <span className="text-[10px]">Pico</span>
                    </div>
                </div>
            </div>

            {tooltip && (
                <div 
                    className="fixed bg-gray-950 text-white text-xs font-bold rounded-2xl p-3 pointer-events-none shadow-2xl z-50 border border-gray-800 flex flex-col gap-0.5"
                    style={{ left: Math.min(tooltip.x + 12, window.innerWidth - 180), top: tooltip.y - 60 }}
                >
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                        {tooltip.dayName} a las {String(tooltip.hour).padStart(2, "0")}:00
                    </div>
                    <div className="text-emerald-400 font-extrabold text-sm">
                        {tooltip.count} de {totalCourts} canchas ocupadas
                    </div>
                    <div className="text-[10px] text-gray-300">
                        {totalCourts > 0 ? Math.round((tooltip.count / totalCourts) * 100) : 0}% de ocupación
                    </div>
                </div>
            )}
        </section>
    );
}