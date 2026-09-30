"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import DateTooltip from "./DateTooltip";
import { CheckCircle2, Clock, AlertCircle, Hourglass, XCircle } from "lucide-react";

interface ReservationCardProps {
    index: number;
    reservation: Reservation;
    isPast?: boolean;
    onCancel?: (bookingId: number) => void;
    loadingCancel: boolean;
}

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function ReservationCard({ index, reservation, isPast = false, onCancel, loadingCancel }: ReservationCardProps) {
    const [confirming, setConfirming] = useState(false);
    
    // Parse date safely
    const dateObj = new Date(reservation.booked_date + "T00:00:00");
    const day = dateObj.getDate();
    const month = MONTH_NAMES[dateObj.getMonth()] ?? "";
    const weekday = DAY_NAMES[dateObj.getDay()] ?? "";

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!confirming) return;
        const handler = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) {
                setConfirming(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [confirming]);

    const formattedTime = `${reservation.booked_time} - ${String((parseInt(reservation.booked_time) + 1) % 24).padStart(2, "0")}:00`;

    type StatusConfig = {
        label: string;
        bgCard: string;
        badge: string;
        icon: React.ReactNode;
    };

    const getStatusConfig = (status: string): StatusConfig => {
        switch (status) {
            case "pending":
                return {
                    label: "Revisión Pendiente",
                    bgCard: "border-amber-200 bg-amber-50/30",
                    badge: "bg-amber-100 text-amber-800",
                    icon: <Hourglass className="w-3.5 h-3.5" />,
                };
            case "confirmed":
                return {
                    label: "Confirmada",
                    bgCard: "border-emerald-200 shadow-xs",
                    badge: "bg-emerald-100 text-emerald-800",
                    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
                };
            case "completed":
                return {
                    label: "Completada",
                    bgCard: "border-blue-200 shadow-xs",
                    badge: "bg-blue-100 text-blue-800",
                    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
                };
            case "cancelled":
                return {
                    label: "Cancelada",
                    bgCard: "border-red-200 opacity-75",
                    badge: "bg-red-100 text-red-700",
                    icon: <XCircle className="w-3.5 h-3.5" />,
                };
            case "no_show":
                return {
                    label: "No Asistió",
                    bgCard: "border-gray-200 opacity-75",
                    badge: "bg-gray-100 text-gray-600",
                    icon: <AlertCircle className="w-3.5 h-3.5" />,
                };
            default:
                return {
                    label: status,
                    bgCard: "border-gray-200",
                    badge: "bg-gray-100 text-gray-600",
                    icon: null,
                };
        }
    };

    const statusConfig = getStatusConfig(reservation.booking_status);
    const isDatePast = reservation.booked_date < new Date().toISOString().split("T")[0];
    const cardIsDimmed = isPast || reservation.booking_status === "cancelled" || reservation.booking_status === "no_show";

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className={`bg-white border rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all hover:shadow-md ${statusConfig.bgCard}`}
        >
            <div className="flex items-center gap-4">
                <DateTooltip text={reservation.booked_date}>
                    <div className={`flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0 border ${
                        cardIsDimmed
                            ? "bg-gray-50 border-gray-200" 
                            : reservation.booking_status === "pending"
                            ? "bg-amber-50 border-amber-200"
                            : "bg-emerald-50 border-emerald-200"
                    }`}>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                            cardIsDimmed ? "text-gray-400" : reservation.booking_status === "pending" ? "text-amber-700" : "text-emerald-700"
                        }`}>
                            {month}
                        </span>

                        <span className="text-xl font-black leading-tight text-gray-900">
                            {day}
                        </span>

                        <span className="text-[11px] text-gray-500 font-medium">
                            {weekday}
                        </span>
                    </div>
                </DateTooltip>

                {/* Info */}
                <div className="flex flex-col items-start gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-gray-900">
                            {reservation.court_name}
                        </span>
                        
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${statusConfig.badge}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold font-mono bg-gray-100 px-2 py-0.5 rounded-md text-gray-800 text-xs">
                            {formattedTime}
                        </span>
                        <span className="text-xs text-gray-500">· 1 hora de juego</span>
                    </div>

                    {reservation.price && (
                        <span className="text-xs text-gray-500 font-medium">
                            ${Number(reservation.price).toFixed(2)} USD · {reservation.payment_method === "efectivo" ? "💵 Pago en Efectivo" : "🏛️ Transferencia Bancaria"}
                        </span>
                    )}

                    {reservation.booking_status === "pending" && reservation.payment_proof && (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg font-mono">
                            Comprobante: {reservation.payment_proof}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="relative" ref={ref}>
                {(reservation.booking_status === "confirmed" || reservation.booking_status === "pending") && !isDatePast && (
                    confirming ? (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-xl rounded-2xl p-4 flex flex-col gap-2.5 w-60 z-20">
                            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                ¿Cancelar esta solicitud?
                            </span>
                            <p className="text-xs text-gray-500">
                                {reservation.booking_status === "pending" 
                                    ? "Se cancelará tu solicitud pendiente de revisión."
                                    : "Se liberará el turno para otros jugadores."}
                            </p>
                            <div className="flex gap-2 mt-1">
                                <button
                                    disabled={loadingCancel}
                                    onClick={() => onCancel?.(reservation.booking_id)}
                                    className="flex-1 text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors py-2 rounded-xl cursor-pointer"
                                >
                                    {loadingCancel ? "Cancelando..." : "Sí, cancelar"}
                                </button>
                                <button
                                    onClick={() => setConfirming(false)}
                                    className="flex-1 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors py-2 rounded-xl cursor-pointer"
                                >
                                    Mantener
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors px-3.5 py-2 rounded-xl cursor-pointer"
                            onClick={() => setConfirming(true)}
                        >
                            Cancelar
                        </button>
                    )
                )}

                {reservation.booking_status === "cancelled" && (
                    <span className="text-xs font-bold text-red-500 px-3 py-1.5 bg-red-50 rounded-lg">
                        Cancelada
                    </span>
                )}
            </div>
        </motion.div>
    );
}