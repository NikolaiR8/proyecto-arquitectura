"use client";

import { useState } from "react";
import { 
    ClipboardCheck, 
    Search, 
    Download, 
    Calendar, 
    Clock, 
    User, 
    DollarSign, 
    CheckCircle2, 
    AlertCircle, 
    XCircle,
    FileSpreadsheet,
    ShieldCheck
} from "lucide-react";

interface AuditSectionProps {
    auditData?: AuditBookingItem[];
    currentPeriodLabel: string;
    onPeriodChange: (days: number, customFromTo?: { from: string; to: string } | null) => void;
    activePeriodDays: number;
}

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
    confirmed: { label: "Confirmada", class: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" /> },
    completed: { label: "Completada", class: "bg-blue-100 text-blue-800 border-blue-200", icon: <CheckCircle2 className="w-3 h-3 text-blue-600" /> },
    pending: { label: "Pendiente", class: "bg-amber-100 text-amber-800 border-amber-200", icon: <Clock className="w-3 h-3 text-amber-600" /> },
    cancelled: { label: "Cancelada", class: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="w-3 h-3 text-red-600" /> },
    no_show: { label: "No asistió", class: "bg-gray-100 text-gray-800 border-gray-200", icon: <AlertCircle className="w-3 h-3 text-gray-500" /> },
};

const PAYMENT_CONFIG: Record<string, { label: string; class: string }> = {
    paid: { label: "Pagado", class: "bg-emerald-600 text-white font-bold" },
    pending: { label: "Por Validar", class: "bg-amber-500 text-white font-bold" },
    refunded: { label: "Reembolsado", class: "bg-gray-200 text-gray-700 font-semibold" },
};

export default function AuditSection({ auditData = [], currentPeriodLabel, onPeriodChange, activePeriodDays }: AuditSectionProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");

    // Filter audit records based on search and filters
    const filteredRecords = auditData.filter((item) => {
        const matchesSearch = 
            item.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.court_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(item.booking_id).includes(searchTerm);

        const matchesStatus = statusFilter === "all" || item.booking_status === statusFilter;
        const matchesPayment = paymentFilter === "all" || item.payment_status === paymentFilter;

        return matchesSearch && matchesStatus && matchesPayment;
    });

    const totalAuditedAmount = filteredRecords.reduce((acc, curr) => {
        if (curr.payment_status === "paid" || curr.booking_status === "confirmed" || curr.booking_status === "completed") {
            return acc + Number(curr.price || 15);
        }
        return acc;
    }, 0);

    // Export to CSV Function
    const handleExportCSV = () => {
        if (filteredRecords.length === 0) return;

        const headers = ["ID Reserva", "Cancha", "Deporte", "Cliente", "Email", "Fecha Turno", "Hora Turno", "Monto (USD)", "Estado Reserva", "Estado Pago", "Método Pago", "Comprobante", "Fecha Registro BD"];
        const rows = filteredRecords.map(r => [
            r.booking_id,
            `"${r.court_name}"`,
            `"${r.sport}"`,
            `"${r.first_name} ${r.last_name}"`,
            `"${r.email}"`,
            r.booked_date,
            r.booked_time,
            r.price,
            r.booking_status,
            r.payment_status,
            `"${r.payment_method}"`,
            `"${r.payment_proof || 'N/A'}"`,
            `"${r.created_at}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `auditoria_reservas_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <section className="w-full max-w-7xl p-6 sm:p-8 bg-white rounded-3xl border border-gray-200 shadow-xs mb-10 flex flex-col">
            {/* Header with Period Tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                            Auditoría de Reservas y Transacciones
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Historial verificado y persistido en base de datos para control de ingresos y trazabilidad.
                    </p>
                </div>

                {/* Period Quick Switch Tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-500 mr-1">Filtrar período:</span>
                    <div className="inline-flex rounded-xl border border-gray-200 p-1 bg-gray-50 text-xs font-bold">
                        <button
                            onClick={() => onPeriodChange(1, null)}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                activePeriodDays === 1 ? "bg-emerald-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Diario (1D)
                        </button>
                        <button
                            onClick={() => onPeriodChange(7, null)}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                activePeriodDays === 7 ? "bg-emerald-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Semanal (7D)
                        </button>
                        <button
                            onClick={() => onPeriodChange(30, null)}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                activePeriodDays === 30 ? "bg-emerald-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Mensual (30D)
                        </button>
                        <button
                            onClick={() => onPeriodChange(365, null)}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                activePeriodDays === 365 ? "bg-emerald-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Anual (365D)
                        </button>
                    </div>

                    <button
                        onClick={handleExportCSV}
                        disabled={filteredRecords.length === 0}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 text-white hover:bg-black text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Audit Summary Mini Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-black text-gray-800 text-sm">
                        {filteredRecords.length}
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Registros Auditados</p>
                        <p className="text-xs text-gray-700 font-semibold">{currentPeriodLabel}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-black text-sm">
                        $
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Monto Conciliado</p>
                        <p className="text-sm font-black text-emerald-700">${totalAuditedAmount.toFixed(2)} USD</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-black text-sm">
                        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Integridad de BD</p>
                        <p className="text-xs font-semibold text-gray-700">Sincronizado con MySQL</p>
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, correo, ID o cancha..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 w-full sm:w-auto"
                    >
                        <option value="all">Estado: Todos</option>
                        <option value="confirmed">Confirmadas</option>
                        <option value="completed">Completadas</option>
                        <option value="pending">Pendientes</option>
                        <option value="cancelled">Canceladas</option>
                        <option value="no_show">No Show</option>
                    </select>

                    <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 w-full sm:w-auto"
                    >
                        <option value="all">Pago: Todos</option>
                        <option value="paid">Pagado</option>
                        <option value="pending">Por Validar</option>
                        <option value="refunded">Reembolsado</option>
                    </select>
                </div>
            </div>

            {/* Audit Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                            <th className="py-3 px-4">ID</th>
                            <th className="py-3 px-4">Cancha</th>
                            <th className="py-3 px-4">Turno & Fecha</th>
                            <th className="py-3 px-4">Cliente</th>
                            <th className="py-3 px-4 text-right">Tarifa</th>
                            <th className="py-3 px-4 text-center">Método Pago</th>
                            <th className="py-3 px-4 text-center">Estado Pago</th>
                            <th className="py-3 px-4 text-center">Estado Turno</th>
                            <th className="py-3 px-4">Fecha Creación BD</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                        {filteredRecords.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-12 text-center text-gray-400 font-medium">
                                    No se encontraron registros de auditoría que coincidan con los filtros aplicados.
                                </td>
                            </tr>
                        ) : (
                            filteredRecords.map((item) => {
                                const statusCfg = STATUS_CONFIG[item.booking_status] || {
                                    label: item.booking_status,
                                    class: "bg-gray-100 text-gray-700",
                                    icon: null,
                                };
                                const paymentCfg = PAYMENT_CONFIG[item.payment_status] || {
                                    label: item.payment_status,
                                    class: "bg-gray-100 text-gray-700",
                                };
                                const isCash = item.payment_method === "efectivo";

                                return (
                                    <tr key={item.booking_id} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                                             #{item.booking_id}
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap">
                                            {item.court_name}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-800">{item.booked_date}</div>
                                            <div className="text-[11px] text-gray-500 flex items-center gap-1 font-mono">
                                                <Clock className="w-3 h-3" />
                                                {item.booked_time}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-gray-900 whitespace-nowrap">
                                                {item.first_name} {item.last_name}
                                            </div>
                                            <div className="text-[11px] text-gray-400 truncate max-w-[160px]">
                                                {item.email}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-black text-emerald-700 whitespace-nowrap">
                                            ${Number(item.price || 15).toFixed(2)}
                                        </td>
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                isCash 
                                                    ? "bg-amber-50 text-amber-800 border-amber-200" 
                                                    : "bg-blue-50 text-blue-800 border-blue-200"
                                            }`}>
                                                {isCash ? "💵 Efectivo" : "🏛️ Transferencia"}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] ${paymentCfg.class}`}>
                                                {paymentCfg.label}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.class}`}>
                                                {statusCfg.icon}
                                                {statusCfg.label}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                                            {item.created_at}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
