"use client";

import { useEffect, useState, useCallback } from "react";
import DonutChart from "../../components/admin/DonutChart";
import { bookingsToDonut, sportsToDonut } from "../../lib/donut-chart-utils";
import KpiOverview from "../../components/admin/KpiOverview";
import HeatMap from "../../components/admin/HeatMap";
import DaysDropDown from "../../components/admin/DaysDropDown";
import RevenueOverview from "../../components/admin/RevenueOverview";
import CourtsHeatmapSection from "../../components/admin/CourtsHeatmapSection";
import AuditSection from "../../components/admin/AuditSection";
import { 
    BarChart3, 
    Flame, 
    ShieldCheck, 
    DollarSign, 
    PieChart, 
    RefreshCw,
    Clock,
    LayoutDashboard,
    Download
} from "lucide-react";

export default function AdminStatsPage() {
    const [adminData, setAdminData] = useState<AdminData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "revenue" | "courts" | "audit">("all");
    
    const [days, setDays] = useState<number>(() => {
        if (typeof window === "undefined") return 30;
        const stored = localStorage.getItem("admin_stats_days");
        return stored ? Number(stored) : 30;
    });

    const [customFromTo, setCustomFromTo] = useState<{ from: string; to: string } | null>(() => {
        if (typeof window === "undefined") return null;
        const stored = localStorage.getItem("admin_stats_customFromTo");
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const to = customFromTo?.to ?? new Date().toISOString().split("T")[0];
            const from = customFromTo?.from ?? (days === 1 ? to : new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
            
            const res = await fetch(`/api/admin/stats?from=${from}&to=${to}`);
            if (res.ok) {
                const data: AdminData = await res.json();
                setAdminData(data);
            } else {
                setAdminData(null);
            }
        } catch (err) {
            console.error("Error al cargar estadísticas de administración:", err);
            setAdminData(null);
        } finally {
            setLoading(false);
        }
    }, [days, customFromTo]);

    const handleDownloadPDF = async () => {
        setDownloading(true);
        setDownloadError("");
        try {
            const to = customFromTo?.to ?? new Date().toISOString().split("T")[0];
            const from = customFromTo?.from ?? (days === 1 ? to : new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
            const res = await fetch(`/api/admin/stats/pdf?from=${from}&to=${to}`);
            if (!res.ok) throw new Error("No se pudo descargar el informe.");
            const url = URL.createObjectURL(await res.blob());
            const link = document.createElement("a");
            link.href = url;
            link.download = `estadisticas_alquileres_${from}_${to}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            setDownloadError(error instanceof Error ? error.message : "No se pudo descargar el informe.");
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        localStorage.setItem("admin_stats_days", String(days));
    }, [days]);

    useEffect(() => {
        if (customFromTo === null) {
            localStorage.removeItem("admin_stats_customFromTo");
        } else {
            localStorage.setItem("admin_stats_customFromTo", JSON.stringify(customFromTo));
        }
    }, [customFromTo]);

    const handlePeriodChange = (newDays: number, customRange?: { from: string; to: string } | null) => {
        setDays(newDays);
        setCustomFromTo(customRange ?? null);
    };

    const getPeriodLabel = () => {
        if (customFromTo) {
            return `Rango personalizado (${customFromTo.from} al ${customFromTo.to})`;
        }
        if (days === 1) return "Diario (Hoy)";
        if (days === 7) return "Últimos 7 días (Semanal)";
        if (days === 30) return "Últimos 30 días (Mensual)";
        if (days === 90) return "Últimos 90 días (Trimestral)";
        if (days === 365) return "Últimos 365 días (Anual)";
        return `Últimos ${days} días`;
    };

    const bookingsChart = adminData?.bookingsBreakdownData ? bookingsToDonut(adminData.bookingsBreakdownData) : null;
    const sportsChart = adminData?.sportsBreakdownData ? sportsToDonut(adminData.sportsBreakdownData) : null;

    return (
        <main className="flex flex-col items-center w-full min-h-screen bg-gray-50/80 py-8 px-4 sm:px-8 font-sans">
            {/* Top Header Bar */}
            <div className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-extrabold tracking-widest bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                            Módulo de Administración
                        </span>
                        <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {getPeriodLabel()}
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mt-1">
                        Estadísticas, Auditoría e Ingresos
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Control de ingresos, mapa de calor de ocupación de canchas y auditoría general en base de datos.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={loading || downloading || !adminData}
                        className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white text-xs font-bold rounded-2xl hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        {downloading ? "Generando PDF..." : "Descargar PDF"}
                    </button>
                    <button
                        onClick={() => fetchStats()}
                        disabled={loading}
                        className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors text-gray-700 shadow-xs cursor-pointer disabled:opacity-50"
                        title="Actualizar datos"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
                    </button>
                    <DaysDropDown 
                        setDays={setDays} 
                        days={days} 
                        setCustomFromTo={setCustomFromTo}
                        customFromTo={customFromTo} 
                    />
                </div>
            </div>

            {downloadError && <p role="alert" className="w-full max-w-7xl text-sm text-red-700 mb-4">{downloadError}</p>}

            {/* Quick Navigation Filter Tabs */}
            <div className="w-full max-w-7xl flex items-center gap-2 overflow-x-auto pb-2 mb-8">
                <button
                    onClick={() => setActiveTab("all")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === "all"
                            ? "bg-gray-900 text-white shadow-md shadow-gray-900/10"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Panel Completo
                </button>
                <button
                    onClick={() => setActiveTab("revenue")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === "revenue"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                >
                    <DollarSign className="w-4 h-4" />
                    Ingresos & Finanzas
                </button>
                <button
                    onClick={() => setActiveTab("courts")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === "courts"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                >
                    <Flame className="w-4 h-4" />
                    Mapa de Calor Canchas
                </button>
                <button
                    onClick={() => setActiveTab("audit")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === "audit"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                >
                    <ShieldCheck className="w-4 h-4" />
                    Auditoría de Reservas
                </button>
            </div>

            {/* Loading Indicator */}
            {loading && !adminData && (
                <div className="w-full max-w-7xl py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-200 shadow-xs">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
                    <p className="text-sm font-bold text-gray-700">Cargando métricas y registros de auditoría...</p>
                    <p className="text-xs text-gray-400 mt-1">Consultando base de datos en tiempo real</p>
                </div>
            )}

            {adminData && (
                <>
                    {/* SECTION 1: Financial & Revenue Overview */}
                    {(activeTab === "all" || activeTab === "revenue") && (
                        <RevenueOverview revenueData={adminData.revenueData} />
                    )}

                    {/* SECTION 2: General KPIs & Donut Charts */}
                    {(activeTab === "all" || activeTab === "revenue") && (
                        <>
                            {adminData.kpiData && <KpiOverview kpiData={adminData.kpiData} />}

                            <section className="flex flex-wrap justify-center gap-6 w-full max-w-7xl mb-10">
                                <DonutChart
                                    label="Desglose por Estado de Reservas"
                                    data={bookingsChart?.data ?? []}
                                    config={bookingsChart?.config ?? {}}
                                />
                                <DonutChart
                                    label="Desglose por Categoría Deportiva"
                                    data={sportsChart?.data ?? []}
                                    config={sportsChart?.config ?? {}}
                                />
                            </section>
                        </>
                    )}

                    {/* SECTION 3: Court Heatmap & Usage Distribution with Pitch Visuals */}
                    {(activeTab === "all" || activeTab === "courts") && (
                        <>
                            <CourtsHeatmapSection courtsUsage={adminData.courtUsageData} />

                            {/* Weekly Hourly Occupancy Matrix */}
                            <div className="w-full max-w-7xl p-6 sm:p-8 bg-white rounded-3xl border border-gray-200 shadow-xs flex flex-col items-center mb-10">
                                <div className="self-start mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                                            <BarChart3 className="w-5 h-5 text-emerald-600" />
                                        </span>
                                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                                            Mapa de Calor de Ocupación por Horarios
                                        </h2>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                        Distribución de turnos ocupados a lo largo de los días de la semana y horas del día
                                    </p>
                                </div>
                                {adminData.heatMapData && (
                                    <HeatMap 
                                        heatMapMatrix={adminData.heatMapData.heatMapMatrix} 
                                        totalCourts={adminData.heatMapData.totalCourts} 
                                    />
                                )}
                            </div>
                        </>
                    )}

                    {/* SECTION 4: Database Audit Section */}
                    {(activeTab === "all" || activeTab === "audit") && (
                        <AuditSection 
                            auditData={adminData.auditData}
                            currentPeriodLabel={getPeriodLabel()}
                            onPeriodChange={handlePeriodChange}
                            activePeriodDays={days}
                        />
                    )}
                </>
            )}
        </main>
    );
}
