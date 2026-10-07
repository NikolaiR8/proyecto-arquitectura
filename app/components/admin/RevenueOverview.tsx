"use client";

import { DollarSign, Clock, CheckCircle2, TrendingUp, Receipt, AlertCircle } from "lucide-react";

interface RevenueOverviewProps {
    revenueData?: RevenueData;
}

export default function RevenueOverview({ revenueData }: RevenueOverviewProps) {
    if (!revenueData) return null;

    const totalRevenue = Number(revenueData.total_revenue || 0);
    const pendingRevenue = Number(revenueData.pending_revenue || 0);
    const refundedRevenue = Number(revenueData.refunded_revenue || 0);
    const totalPaidBookings = Number(revenueData.total_paid_bookings || 0);
    const avgTicket = Number(revenueData.average_ticket || 0);
    const potentialRevenue = totalRevenue + pendingRevenue;
    const collectionEfficiency = potentialRevenue > 0 ? ((totalRevenue / potentialRevenue) * 100).toFixed(0) : "100";

    return (
        <section className="w-full max-w-7xl mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                            <DollarSign className="w-5 h-5" />
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                            Resumen Financiero y Control de Ingresos
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Monitoreo de recaudación directa en base de datos, pagos confirmados y saldos pendientes.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center bg-white px-3.5 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-700 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Efectividad de Cobro: <span className="text-emerald-600 font-black">{collectionEfficiency}%</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Ingresos Totales Recaudados */}
                <div className="relative overflow-hidden bg-linear-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white p-6 rounded-3xl shadow-lg shadow-emerald-700/20 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-100/90">
                                Total Recaudado
                            </span>
                            <span className="p-1.5 bg-white/15 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                            </span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-black tracking-tight flex items-baseline gap-1">
                            <span>${totalRevenue.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-sm font-semibold text-emerald-200">USD</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100">
                        <span>Turnos pagados</span>
                        <span className="font-bold bg-white/20 px-2 py-0.5 rounded-md">{totalPaidBookings} turnos</span>
                    </div>
                </div>

                {/* 2. Ingresos Pendientes por Cobrar */}
                <div className="bg-white border border-amber-200 p-6 rounded-3xl shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                                Por Cobrar / En Revisión
                            </span>
                            <span className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                                <Clock className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight flex items-baseline gap-1">
                            <span>${pendingRevenue.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-sm font-semibold text-gray-400">USD</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>Comprobantes pendientes</span>
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {Math.round(pendingRevenue / 15)} solicitudes
                        </span>
                    </div>
                </div>

                {/* 3. Ticket Promedio */}
                <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs flex flex-col justify-between hover:border-gray-300 transition-colors">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                                Tarifa Promedio por Turno
                            </span>
                            <span className="p-1.5 bg-gray-100 rounded-lg text-gray-700">
                                <Receipt className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight flex items-baseline gap-1">
                            <span>${avgTicket.toFixed(2)}</span>
                            <span className="text-sm font-semibold text-gray-400">USD / h</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>Precio base establecido</span>
                        <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">$15.00</span>
                    </div>
                </div>

                {/* 4. Cancelaciones / Saldo Reembolsado */}
                <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs flex flex-col justify-between hover:border-gray-300 transition-colors">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                                Reembolsado
                            </span>
                            <span className="p-1.5 bg-red-50 rounded-lg text-red-600">
                                <AlertCircle className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight flex items-baseline gap-1">
                            <span>${refundedRevenue.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-sm font-semibold text-gray-400">USD</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>Pagos reembolsados</span>
                        <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                            ${refundedRevenue.toFixed(0)} reembolsados
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
