"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "../../components/ui/sonner";
import { Hourglass, CheckCircle2, XCircle, Clock, Banknote, User, Calendar, Coins } from "lucide-react";

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function AdminPendingPayments() {
    const [bookings, setBookings] = useState<AdminBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchPending = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/bookings?all=true");
            if (res.ok) {
                const { bookings: fetched }: { bookings: AdminBooking[] } = await res.json();
                fetched.forEach(b => {
                    b.booked_time = b.booked_time?.slice(0, 5) ?? "";
                    b.first_name = b.first_name?.charAt(0).toUpperCase() + b.first_name?.slice(1);
                    b.last_name = b.last_name?.charAt(0).toUpperCase() + b.last_name?.slice(1);
                });
                setBookings(fetched);
            } else {
                toast.error("No se pudieron cargar las solicitudes pendientes.");
            }
        } catch {
            toast.error("Error de conexión al cargar solicitudes.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    const handleAction = async (bookingId: number, action: "confirmed" | "cancelled", method?: "transferencia_bancaria" | "efectivo") => {
        setProcessingId(bookingId);
        try {
            const res = await fetch("/api/admin/bookings/status", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    bookingId, 
                    status: action,
                    payment_method: method,
                    payment_proof: method === "efectivo" ? "Cobro en Efectivo Presencial (Admin)" : undefined
                }),
            });
            if (res.ok) {
                if (action === "confirmed") {
                    toast.success(method === "efectivo" ? "💵 Reserva confirmada con Pago en Efectivo." : "✅ Transferencia confirmada exitosamente.");
                } else {
                    toast.success("❌ Reserva rechazada y cancelada.");
                }
                await fetchPending();
            } else {
                toast.error("No se pudo actualizar el estado.");
            }
        } catch {
            toast.error("Error de conexión.");
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "–";
        const d = new Date(dateStr + "T00:00:00");
        return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    };

    return (
        <main className="min-h-screen bg-gray-50 font-sans py-8">
            <div className="px-6 max-w-5xl mx-auto">
                <div className="mb-8">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Panel de Administración</p>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <Hourglass className="w-8 h-8 text-amber-500" />
                        Verificación de Comprobantes
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Revisa los comprobantes de transferencia y confirma o rechaza cada solicitud de reserva.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white border border-amber-200 rounded-2xl p-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">Pendientes</p>
                        <p className="text-3xl font-black text-gray-900">{loading ? "–" : bookings.length}</p>
                        <p className="text-xs text-gray-500 mt-1">Solicitudes por verificar</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Cuentas Banco Pichincha</p>
                        <p className="text-sm font-bold text-gray-800 font-mono">2213399388</p>
                        <p className="text-sm font-bold text-gray-800 font-mono">2213028280</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col justify-center">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Precio por turno</p>
                        <p className="text-3xl font-black text-emerald-700">$15 <span className="text-lg font-bold">USD</span></p>
                        <p className="text-xs text-emerald-600 mt-1">Transferencia bancaria Ecuador</p>
                    </div>
                </div>

                {/* Pending list */}
                {loading ? (
                    <div className="flex flex-col gap-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-28 bg-white border border-gray-200 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-xs">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                        <p className="text-lg font-bold text-gray-700">¡Todo al día!</p>
                        <p className="text-sm text-gray-400 mt-1">No hay solicitudes de reserva pendientes de verificación.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {bookings.map((booking) => (
                            <div
                                key={booking.booking_id}
                                className="bg-white border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    {/* Date badge */}
                                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl shrink-0 border bg-amber-50 border-amber-200">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                                            {booking.booked_date ? MONTH_NAMES[new Date(booking.booked_date + "T00:00:00").getMonth()] : "–"}
                                        </span>
                                        <span className="text-xl font-black leading-tight text-gray-900">
                                            {booking.booked_date ? new Date(booking.booked_date + "T00:00:00").getDate() : "–"}
                                        </span>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="font-bold text-gray-900">{booking.court_name}</span>
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                                                <Hourglass className="w-3 h-3" /> Revisión Pendiente
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                {formatDate(booking.booked_date)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                {booking.booked_time} – {String((parseInt(booking.booked_time) + 1) % 24).padStart(2, "0")}:00
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3.5 h-3.5 text-gray-400" />
                                                {booking.first_name} {booking.last_name}
                                            </span>
                                            <span className="text-gray-400">{booking.email}</span>
                                        </div>

                                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                <Banknote className="w-3.5 h-3.5" />
                                                ${Number(booking.price ?? 15).toFixed(2)} USD
                                            </span>
                                            {booking.payment_proof ? (
                                                <span className="text-xs font-mono bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg text-gray-700">
                                                    Comprobante: <strong>{booking.payment_proof}</strong>
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg text-red-600">
                                                    Sin comprobante
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2 shrink-0 self-end sm:self-center">
                                    <button
                                        disabled={processingId === booking.booking_id}
                                        onClick={() => handleAction(booking.booking_id, "cancelled")}
                                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                                        title="Rechazar y cancelar solicitud"
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                        Rechazar
                                    </button>
                                    <button
                                        disabled={processingId === booking.booking_id}
                                        onClick={() => handleAction(booking.booking_id, "confirmed", "efectivo")}
                                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                        title="Confirmar como cobrado en efectivo"
                                    >
                                        <Coins className="w-3.5 h-3.5" />
                                        Cobro en Efectivo
                                    </button>
                                    <button
                                        disabled={processingId === booking.booking_id}
                                        onClick={() => handleAction(booking.booking_id, "confirmed", "transferencia_bancaria")}
                                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                        title="Confirmar con comprobante de transferencia"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {processingId === booking.booking_id ? "Procesando..." : "Confirmar Transferencia"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Toaster position="top-center" />
        </main>
    );
}
