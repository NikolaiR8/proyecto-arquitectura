"use client";

import { useEffect, useState } from "react";
import BookingConfirmation from "../../components/booking/BookingConfirmation";
import Link from "next/link";
import { BookingSummary } from "../../components/booking/BookingSummary";
import { useRouter } from "next/navigation";
import { Toaster } from "../../components/ui/sonner";
import { toast } from "sonner";
import { Banknote, ShieldCheck, Clock, Copy, CheckCircle2, AlertCircle, Coins, Crown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const PRICE_PER_SLOT = 15; // USD

const BANK_ACCOUNTS = [
    { banco: "Banco Pichincha", tipo: "Ahorros", numero: "2213399388" },
    { banco: "Banco Pichincha", tipo: "Ahorros", numero: "2213028280" },
];

export default function ConfirmBooking() {
    const router = useRouter();
    const { userRole } = useAuth();
    const isAdmin = userRole === "admin";

    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<UserBooking[] | null>(null);
    const [loadingFetch, setLoadingFetch] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"transferencia_bancaria" | "efectivo">("transferencia_bancaria");
    const [paymentProof, setPaymentProof] = useState("");
    const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
    const [customerName, setCustomerName] = useState("");
    const [customerId, setCustomerId] = useState("");

    useEffect(() => {
        const getBookings = () => {
            const storage = localStorage.getItem("pendingBookings");
            setBookings(storage ? JSON.parse(storage) : null);
            setLoading(false);
        };
        getBookings();

        window.addEventListener("focus", getBookings);
        return () => window.removeEventListener("focus", getBookings);
    }, []);

    useEffect(() => {
        if (!loading && (!bookings || bookings.length === 0)) {
            const timeout = setTimeout(() => router.push("/booking"), 500);
            return () => clearTimeout(timeout);
        }
    }, [bookings, loading, router]);

    const handleRemove = (booking: Omit<UserBooking, "court_id">) => {
        setBookings(prev => {
            if (!prev) return null;
            return prev.filter(b => !(
                b.court_name === booking.court_name && 
                b.booked_time === booking.booked_time && 
                b.booked_date === booking.booked_date
            ));
        });
        const storage = localStorage.getItem("pendingBookings");
        if (storage) {
            const parsed: UserBooking[] = JSON.parse(storage);
            const updated = parsed.filter(b => !(
                b.court_name === booking.court_name &&
                b.booked_time === booking.booked_time && 
                b.booked_date === booking.booked_date
            ));
            localStorage.setItem("pendingBookings", JSON.stringify(updated));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedAccount(text);
            setTimeout(() => setCopiedAccount(null), 2000);
        });
    };

    const handleEnviarSolicitud = async () => {
        if (!bookings || bookings.length === 0) return;

        // Si es usuario regular o si es admin y eligió transferencia con comprobante
        if (!isAdmin && paymentMethod === "transferencia_bancaria" && !paymentProof.trim()) {
            toast.error("Por favor ingresa el número de comprobante de transferencia para continuar.");
            return;
        }

        setLoadingFetch(true);
        try {
            const isBulk = bookings.length > 1;
            
            const payloadBookings = bookings.map(b => ({
                court_id: b.court_id,
                booked_date: b.booked_date,
                booked_time: b.booked_time,
                payment_method: paymentMethod,
                payment_proof: paymentProof.trim() || (paymentMethod === "efectivo" ? "Cobro en Efectivo (Admin)" : (isAdmin ? "TRANSFERENCIA-ADMIN" : "")),
            }));

            const extraAdminFields = isAdmin ? {
                customer_name: customerName.trim() || null,
                customer_id: customerId.trim() || null,
            } : {};

            const res = await fetch(isBulk ? "/api/bookings/bulk" : "/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    isBulk 
                        ? { bookings: payloadBookings, payment_method: paymentMethod, payment_proof: paymentProof.trim() || null, ...extraAdminFields }
                        : { ...payloadBookings[0], ...extraAdminFields }
                )
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.removeItem("pendingBookings");
                if (isAdmin) {
                    toast.success(paymentMethod === "efectivo" 
                        ? "¡Reserva registrada y cobro en efectivo confirmado!"
                        : `¡Reserva confirmada exitosamente! ${bookings.length} turno(s) registrado(s).`);
                } else {
                    toast.success("¡Solicitud enviada! Tu reserva está en revisión.");
                }
                setTimeout(() => {
                    router.push(`/reservations?success=true&amount=${bookings.length}&method=${isAdmin ? "admin" : "pending"}`);
                }, 750);
            } else if (res.status === 401) {
                toast.error("Debes iniciar sesión para confirmar tu reserva.");
                setTimeout(() => {
                    router.push(`/login?redirectTo=${encodeURIComponent("/booking/confirm")}`);
                }, 1200);
            } else if (res.status === 409) {
                toast.error(data.error || "Uno o más turnos ya fueron reservados por otro usuario.");
            } else {
                toast.error(data.error || "Hubo un error al procesar la reserva. Intenta de nuevo.");
            }
        } catch {
            toast.error("Error de conexión al procesar la reserva.");
        } finally {
            setLoadingFetch(false);
        }
    };
    
    if (loading) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
                <p className="text-gray-500 font-medium">Cargando turnos seleccionados...</p>
            </div>
        );
    }

    const totalAmount = (bookings?.length ?? 0) * PRICE_PER_SLOT;

    return (
        <main className="min-h-[calc(100vh-80px)] bg-gray-50 py-6 px-4 sm:px-8 font-sans">
            {bookings && bookings.length > 0 && (
                <section className="max-w-7xl mx-auto flex rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden min-h-[calc(100vh-120px)]">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 w-full">
                        
                        {/* Summary side */}
                        <BookingSummary bookings={bookings} />

                        <div className="hidden md:block self-stretch w-px bg-gray-100" />

                        {/* Instrucciones de pago y confirmación */}
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <div className="mb-6">
                                    <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                                        Paso Final
                                    </h2>
                                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                                        Confirmar y Enviar Solicitud
                                    </h1>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Realiza la transferencia bancaria y envía tu comprobante. El administrador verificará y confirmará tu reserva.
                                    </p>
                                </div>

                                {/* Turnos seleccionados */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                                        Turnos a Solicitar ({bookings.length})
                                    </h3>
                                    <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-2">
                                        {bookings.map((booking, index) => (
                                            <div key={`${booking.court_id}-${booking.booked_date}-${booking.booked_time}`}>
                                                <BookingConfirmation
                                                    index={index}
                                                    courtName={booking.court_name}
                                                    date={booking.booked_date}
                                                    time={booking.booked_time}
                                                    handleRemove={handleRemove}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Role Banner if Admin */}
                                {isAdmin && (
                                    <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/80 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                                                <Crown className="w-4 h-4" />
                                            </span>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-wider text-amber-900">
                                                    Modo Administrador Activo
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    Puedes registrar pagos en efectivo directamente o ingresar comprobantes de transferencia.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Admin: Datos del cliente */}
                                {isAdmin && (
                                    <div className="mb-6 p-4 rounded-2xl bg-white border border-gray-200">
                                        <p className="text-xs font-black uppercase tracking-wider text-gray-600 mb-3 flex items-center gap-1.5">
                                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                                            Datos del Cliente (Opcional)
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                                                    Nombre del Cliente:
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: Juan Pérez"
                                                    value={customerName}
                                                    onChange={(e) => setCustomerName(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                                                    Cédula / ID del Cliente:
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: 1712345678"
                                                    value={customerId}
                                                    onChange={(e) => setCustomerId(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-all font-mono"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-2">
                                            Si se deja vacío, la reserva quedará a nombre del usuario autenticado. Las reservas existentes sin ID mantienen el usuario del sistema.
                                        </p>
                                    </div>
                                )}

                                {/* Payment Method Switcher (Only for Admin) */}
                                {isAdmin && (
                                    <div className="mb-6">
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-2">
                                            Seleccionar Método de Pago:
                                        </label>
                                        <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100 rounded-2xl border border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod("transferencia_bancaria")}
                                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                                    paymentMethod === "transferencia_bancaria"
                                                        ? "bg-white text-emerald-800 shadow-sm border border-emerald-200"
                                                        : "text-gray-600 hover:text-gray-900"
                                                }`}
                                            >
                                                <Banknote className="w-4 h-4 text-emerald-600" />
                                                🏛️ Transferencia Bancaria
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod("efectivo")}
                                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                                    paymentMethod === "efectivo"
                                                        ? "bg-white text-emerald-800 shadow-sm border border-emerald-200"
                                                        : "text-gray-600 hover:text-gray-900"
                                                }`}
                                            >
                                                <Coins className="w-4 h-4 text-amber-600" />
                                                💵 Pago en Efectivo (Admin)
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Cash Payment Admin Box */}
                                {isAdmin && paymentMethod === "efectivo" ? (
                                    <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200 mb-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Coins className="w-5 h-5 text-amber-700" />
                                            <h3 className="text-base font-bold text-amber-900">
                                                Cobro Presencial en Efectivo
                                            </h3>
                                            <span className="ml-auto text-xs font-bold px-2.5 py-1 bg-amber-200 text-amber-900 rounded-full flex items-center gap-1">
                                                Confirmación Inmediata
                                            </span>
                                        </div>
                                        <p className="text-xs text-amber-800 mb-4">
                                            Al registrar la reserva con pago en efectivo, la reserva quedará marcada como <strong>Confirmada</strong> y <strong>Pagada</strong> automáticamente en el sistema sin requerir validación posterior.
                                        </p>

                                        <div>
                                            <label className="text-xs font-bold text-gray-700 block mb-1.5">
                                                Número de Recibo / Nota de Caja (Opcional):
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej: REC-00941 o Cobro en Mostrador"
                                                value={paymentProof}
                                                onChange={(e) => setPaymentProof(e.target.value)}
                                                className="w-full border border-gray-300 rounded-xl p-3 text-xs bg-white outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 font-mono transition-all"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Datos bancarios */}
                                        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 mb-5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Banknote className="w-5 h-5 text-emerald-700" />
                                                <h3 className="text-base font-bold text-emerald-900">
                                                    Datos para Transferencia Bancaria
                                                </h3>
                                                <span className="ml-auto text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    Ecuador
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                {BANK_ACCOUNTS.map((acc) => (
                                                    <div
                                                        key={acc.numero}
                                                        className="bg-white rounded-xl border border-emerald-200 px-4 py-3 flex items-center justify-between gap-3"
                                                    >
                                                        <div>
                                                            <p className="text-xs text-gray-500 font-medium">{acc.banco} · Cuenta {acc.tipo}</p>
                                                            <p className="text-base font-black text-gray-900 font-mono tracking-wider">{acc.numero}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => copyToClipboard(acc.numero)}
                                                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                                        >
                                                            {copiedAccount === acc.numero ? (
                                                                <><CheckCircle2 className="w-3.5 h-3.5" />Copiado</>
                                                            ) : (
                                                                <><Copy className="w-3.5 h-3.5" />Copiar</>
                                                            )}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4 flex items-start gap-2 text-xs text-emerald-800 bg-emerald-100 rounded-xl p-3">
                                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                                                <span>
                                                    Transfiere exactamente <strong>${totalAmount.toFixed(2)} USD</strong> a cualquiera de las cuentas y guarda el número de comprobante. Tu reserva quedará en estado <strong>Revisión Pendiente</strong> hasta que el administrador verifique el pago.
                                                </span>
                                            </div>
                                        </div>

                                        {/* Comprobante */}
                                        <div className="mb-5">
                                            <label className="text-sm font-bold text-gray-800 block mb-2">
                                                Número de Comprobante de Transferencia {!isAdmin && <span className="text-red-500">*</span>}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej: 00123456789"
                                                value={paymentProof}
                                                onChange={(e) => setPaymentProof(e.target.value)}
                                                className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-mono transition-all"
                                            />
                                            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                El administrador revisará tu comprobante y confirmará la reserva en menos de 24 horas.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Botones */}
                            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div>
                                    <span className="text-xs text-gray-500 uppercase font-semibold">Total a transferir:</span>
                                    <div className="text-2xl font-black text-gray-900">
                                        ${totalAmount.toFixed(2)} <span className="text-base font-bold text-gray-500">USD</span>
                                    </div>
                                    <p className="text-xs text-gray-400">${PRICE_PER_SLOT} por hora × {bookings.length} turno(s)</p>
                                </div>

                                <div className="flex gap-3 w-full sm:w-auto">
                                    <Link
                                        href="/booking"
                                        className="flex-1 sm:flex-none text-center px-5 py-3 text-sm font-bold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </Link>

                                    <button
                                        disabled={loadingFetch}
                                        onClick={handleEnviarSolicitud}
                                        className="flex-1 sm:flex-none px-7 py-3 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {!loadingFetch ? `Enviar Solicitud de Reserva` : "Enviando..."}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Toaster position="top-center" />
                </section>
            )}
        </main>
    );
}