"use client";

import { useState } from "react";
import { Flame, Trophy, Activity, TrendingUp, Sparkles } from "lucide-react";

interface CourtsHeatmapSectionProps {
    courtsUsage?: CourtUsageItem[];
}

export default function CourtsHeatmapSection({ courtsUsage = [] }: CourtsHeatmapSectionProps) {
    const [sortBy, setSortBy] = useState<"percentage" | "name" | "revenue">("percentage");

    if (!courtsUsage || courtsUsage.length === 0) {
        return (
            <section className="w-full max-w-7xl p-8 bg-white rounded-3xl border border-gray-200 shadow-xs mb-10 text-center">
                <p className="text-gray-500">No hay registros de ocupación de canchas en el período seleccionado.</p>
            </section>
        );
    }

    const totalBookings = courtsUsage.reduce((acc, c) => acc + c.booking_count, 0);
    const mostUsedCourt = [...courtsUsage].sort((a, b) => b.booking_count - a.booking_count)[0];

    const sortedCourts = [...courtsUsage].sort((a, b) => {
        if (sortBy === "percentage") return b.usage_percentage - a.usage_percentage;
        if (sortBy === "revenue") return b.total_court_revenue - a.total_court_revenue;
        return a.court_id - b.court_id;
    });

    // Helper for heat level visual styles
    const getHeatLevel = (percentage: number, isMostUsed: boolean) => {
        if (isMostUsed && percentage > 0) {
            return {
                badge: "🔥 Máxima Demanda",
                badgeClass: "bg-amber-500 text-white shadow-md shadow-amber-500/20 font-black",
                cardBorder: "border-emerald-500 shadow-md ring-2 ring-emerald-500/20 bg-emerald-50/20",
                pitchClass: "border-emerald-500 bg-emerald-800 text-emerald-100",
                barColor: "bg-emerald-600",
                heatIntensity: "Muy Alta",
            };
        }
        if (percentage >= 15) {
            return {
                badge: "⚡ Alta Demanda",
                badgeClass: "bg-emerald-600 text-white font-bold",
                cardBorder: "border-emerald-300 hover:border-emerald-400 bg-white",
                pitchClass: "border-emerald-400 bg-emerald-700 text-emerald-100",
                barColor: "bg-emerald-500",
                heatIntensity: "Alta",
            };
        }
        if (percentage >= 8) {
            return {
                badge: "🟢 Demanda Media",
                badgeClass: "bg-emerald-100 text-emerald-800 font-semibold",
                cardBorder: "border-gray-200 hover:border-emerald-200 bg-white",
                pitchClass: "border-emerald-300 bg-emerald-600/90 text-emerald-100",
                barColor: "bg-emerald-400",
                heatIntensity: "Media",
            };
        }
        return {
            badge: percentage > 0 ? "🔵 Demanda Baja" : "⚪ Sin Reservas",
            badgeClass: "bg-gray-100 text-gray-600 font-medium",
            cardBorder: "border-gray-200 hover:border-gray-300 bg-white",
            pitchClass: "border-gray-300 bg-slate-700/80 text-gray-200",
            barColor: "bg-gray-300",
            heatIntensity: "Baja",
        };
    };

    return (
        <section className="w-full max-w-7xl p-6 sm:p-8 bg-white rounded-3xl border border-gray-200 shadow-xs mb-10 flex flex-col">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                            <Flame className="w-5 h-5 text-emerald-600" />
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                            Mapa de Calor y Demanda por Cancha
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Distribución porcentual de uso y rendimiento de cada una de las canchas del complejo deportivo.
                    </p>
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2 self-start lg:self-center">
                    <span className="text-xs font-semibold text-gray-500">Ordenar por:</span>
                    <div className="inline-flex rounded-xl border border-gray-200 p-1 bg-gray-50 text-xs font-bold">
                        <button
                            onClick={() => setSortBy("percentage")}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                sortBy === "percentage"
                                    ? "bg-white text-emerald-700 shadow-xs"
                                    : "text-gray-500 hover:text-gray-800"
                            }`}
                        >
                            % De Uso
                        </button>
                        <button
                            onClick={() => setSortBy("revenue")}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                sortBy === "revenue"
                                    ? "bg-white text-emerald-700 shadow-xs"
                                    : "text-gray-500 hover:text-gray-800"
                            }`}
                        >
                            Ingresos ($)
                        </button>
                        <button
                            onClick={() => setSortBy("name")}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                sortBy === "name"
                                    ? "bg-white text-emerald-700 shadow-xs"
                                    : "text-gray-500 hover:text-gray-800"
                            }`}
                        >
                            Número de Cancha
                        </button>
                    </div>
                </div>
            </div>

            {/* Highlight Banner of the Most Used Court */}
            {mostUsedCourt && mostUsedCourt.booking_count > 0 && (
                <div className="my-6 p-5 sm:p-6 bg-linear-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/30 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                            <Trophy className="w-7 h-7 text-amber-400 animate-bounce" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400 text-gray-950">
                                    Cancha Estrella
                                </span>
                                <span className="text-xs text-emerald-300 font-semibold">
                                    Mayor preferencia de jugadores
                                </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                                {mostUsedCourt.court_name}
                            </h3>
                            <p className="text-xs text-gray-300 mt-0.5">
                                Ha concentrado el <strong className="text-emerald-400 font-bold">{mostUsedCourt.usage_percentage}%</strong> de todos los turnos jugados ({mostUsedCourt.booking_count} reservas activas).
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 sm:border-l sm:border-white/10 sm:pl-6 shrink-0">
                        <div>
                            <p className="text-[10px] uppercase font-extrabold tracking-wider text-gray-400">Total Generado</p>
                            <p className="text-2xl font-black text-emerald-400">
                                ${mostUsedCourt.total_court_revenue.toFixed(2)} <span className="text-xs font-semibold text-gray-400">USD</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid of Courts with Graphic Pitch Representation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {sortedCourts.map((court) => {
                    const heat = getHeatLevel(court.usage_percentage, court.is_most_used);

                    return (
                        <div
                            key={court.court_id}
                            className={`p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg flex flex-col justify-between ${heat.cardBorder}`}
                        >
                            {/* Court Graphic / Soccer Pitch Illustration */}
                            <div className="relative mb-3">
                                {/* Simulated realistic pitch graphic */}
                                <div className={`w-full h-28 rounded-xl overflow-hidden relative flex flex-col items-center justify-center p-2 shadow-inner border ${heat.pitchClass}`}>
                                    {/* Soccer Pitch Markings (SVG layer) */}
                                    <svg
                                        viewBox="0 0 200 120"
                                        className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
                                        preserveAspectRatio="none"
                                    >
                                        {/* Pitch outer lines */}
                                        <rect x="6" y="6" width="188" height="108" fill="none" stroke="currentColor" strokeWidth="2" />
                                        {/* Halfway line */}
                                        <line x1="100" y1="6" x2="100" y2="114" stroke="currentColor" strokeWidth="2" />
                                        {/* Center circle */}
                                        <circle cx="100" cy="60" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="100" cy="60" r="2.5" fill="currentColor" />
                                        {/* Left Penalty Area */}
                                        <rect x="6" y="30" width="30" height="60" fill="none" stroke="currentColor" strokeWidth="2" />
                                        {/* Right Penalty Area */}
                                        <rect x="164" y="30" width="30" height="60" fill="none" stroke="currentColor" strokeWidth="2" />
                                        {/* Left Goal Area */}
                                        <rect x="6" y="44" width="12" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                        {/* Right Goal Area */}
                                        <rect x="182" y="44" width="12" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                    </svg>

                                    {/* Center badge on pitch */}
                                    <div className="relative z-10 flex flex-col items-center text-center bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/20">
                                        <span className="text-xs font-black text-white tracking-wide">
                                            {court.court_name}
                                        </span>
                                        <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-widest">
                                            {court.sport === "futbol5" ? "Fútbol 5" : court.sport}
                                        </span>
                                    </div>
                                </div>

                                {/* Heat intensity badge */}
                                <div className="absolute top-2 right-2 z-20">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${heat.badgeClass}`}>
                                        {heat.badge}
                                    </span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div>
                                <div className="flex items-baseline justify-between mb-1">
                                    <span className="text-xs font-bold text-gray-500">Uso Total:</span>
                                    <span className="text-xl font-black text-gray-900">
                                        {court.usage_percentage}%
                                    </span>
                                </div>

                                {/* Usage Progress Bar */}
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-3">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${heat.barColor}`}
                                        style={{ width: `${Math.max(court.usage_percentage, 3)}%` }}
                                    />
                                </div>

                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Reservas</p>
                                        <p className="font-bold text-gray-800">{court.booking_count} turnos</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Recaudado</p>
                                        <p className="font-black text-emerald-600">${court.total_court_revenue.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
