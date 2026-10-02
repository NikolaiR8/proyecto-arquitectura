"use client";

import { useState, useEffect, useRef } from "react";
import ReservationCard from "./ReservationCard";
import StatCard from "../admin/StatCard";
import Link from "next/link";
import { toast } from "sonner";
import { Toaster } from "../ui/sonner";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

type Tab = "upcoming" | "past";

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function ReservationsComponent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const hasShownToast = useRef(false);
    const success = searchParams.get("success");
    const amount = searchParams.get("amount");
    const method = searchParams.get("method");

    const [loadingCancel, setLoadingCancel] = useState(false);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>("upcoming");

    const getReservations = async () => {
        try {
            const res = await fetch("/api/reservations");
            if (res.status === 401) {
                router.push(`/login?redirectTo=${encodeURIComponent("/reservations")}`);
                return;
            }
            if (!res.ok) {
                setLoading(false);
                return;
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                data.forEach(reservation => {
                    if (reservation.booked_time) {
                        reservation.booked_time = reservation.booked_time.slice(0, 5);
                    }
                });
                setReservations(data);
            }
        } catch (error) {
            console.error("Error al cargar reservas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getReservations();
        if (success && !hasShownToast.current) {
            hasShownToast.current = true;
            if (method === "admin") {
                toast.success(`¡${amount || 1} turno(s) confirmado(s) exitosamente por el administrador!`);
            } else {
                toast.success(`¡Solicitud enviada! ${amount || 1} turno(s) en Revisión Pendiente. El administrador verificará tu comprobante pronto.`);
            }
            router.replace(pathname, { scroll: false });
        }
    }, []);

    const handleCancel = async (bookingId: number) => {
        setLoadingCancel(true);
        try {
            const res = await fetch("/api/bookings/cancel", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ bookingId })
            });

            if (res.ok) {
                toast.success("¡Reserva cancelada exitosamente!");
                await getReservations();
            } else {
                toast.error("No se pudo cancelar la reserva. Por favor intenta de nuevo.");
            }
        } catch {
            toast.error("Error de conexión al intentar cancelar.");
        } finally {
            setLoadingCancel(false);
        }
    };

    const todayStr = new Date().toISOString().split("T")[0];

    const upcoming = reservations.filter(r => 
        (r.booking_status === 'pending' || r.booking_status === 'confirmed') && 
        r.booked_date >= todayStr
    );
    const past = reservations.filter(r => 
        r.booking_status === 'cancelled' || 
        r.booking_status === 'no_show' || 
        r.booking_status === 'completed' ||
        r.booked_date < todayStr
    );

    const nextReservation = upcoming[0];
    let nextDate = "Ninguna programada";
    if (nextReservation) {
        const d = new Date(nextReservation.booked_date + "T00:00:00");
        nextDate = `${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`;
    }

    const displayed = activeTab === "upcoming" ? upcoming : past;

    return (
        <main className="min-h-[calc(100vh-80px)] bg-gray-50 font-sans py-8">

            <div className="max-w-5xl mx-auto px-4 sm:px-8">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
                            Panel de Usuario
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
                            Mis Reservas
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Consulta y administra tus turnos reservados de fútbol 5</p>
                    </div>
                    <Link
                        href="/booking"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-3 rounded-full transition-all shadow-md hover:shadow-emerald-600/30 hidden sm:block cursor-pointer"
                    >
                        + Reservar Cancha
                    </Link>
                </div>

                {/* Stat cards */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <StatCard
                        label="Próximas Reservas"
                        value={loading ? "–" : upcoming.length}
                        sub={`Próximo partido: ${nextDate}`}
                        green
                    />
                    <StatCard
                        label="Total Horas Jugadas"
                        value={loading ? "–" : `${past.filter(r => r.booking_status === "completed").length}h`}
                        sub="Historial acumulado"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab("upcoming")}
                        className={`text-sm font-bold px-4 py-3 border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-2 ${
                            activeTab === "upcoming"
                                ? "text-emerald-700 border-emerald-600"
                                : "text-gray-500 border-transparent hover:text-gray-800"
                        }`}
                    >
                        Próximas Reservas
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            activeTab === "upcoming" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                        }`}>
                            {upcoming.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab("past")}
                        className={`text-sm font-bold px-4 py-3 border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-2 ${
                            activeTab === "past"
                                ? "text-emerald-700 border-emerald-600"
                                : "text-gray-500 border-transparent hover:text-gray-800"
                        }`}
                    >
                        Historial y Pasadas
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            activeTab === "past" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                        }`}>
                            {past.length}
                        </span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col gap-3">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="h-20 bg-white border border-gray-200 rounded-2xl animate-pulse"
                            />
                        ))}
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-xs">
                        <span className="text-4xl">⚽</span>
                        <p className="text-base font-semibold text-gray-700 mt-3">
                            {activeTab === "upcoming"
                                ? "No tienes reservas próximas activas."
                                : "No tienes reservas registradas en tu historial."}
                        </p>
                        <p className="text-sm text-gray-400 mt-1 mb-6">
                            {activeTab === "upcoming"
                                ? "¡Elige un horario en cualquiera de nuestras 10 canchas de fútbol 5 y arma tu partido!"
                                : "Cuando juegues partidos o canceles turnos, aparecerán aquí."}
                        </p>
                        {activeTab === "upcoming" && (
                            <Link
                                href="/booking"
                                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-full transition-colors shadow-sm"
                            >
                                Reservar un Turno
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {displayed.map((r, index) => (
                            <ReservationCard
                                key={`${r.booking_id}-${r.court_id}-${r.booked_date}-${r.booked_time}`}
                                index={index}
                                reservation={r}
                                isPast={activeTab === "past"}
                                onCancel={handleCancel}
                                loadingCancel={loadingCancel}
                            />
                        ))}
                    </div>
                )}
            </div>
            <Toaster position="top-center" />
        </main>
    );
}