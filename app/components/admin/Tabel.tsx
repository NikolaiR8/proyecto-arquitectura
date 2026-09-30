import StatusButton from "./StatusButton";
import StatusCard from "./StatusCard";

interface TabelProps {
    courts: Court[];
    times: string[];
    activeCell: number | null;
    getBooking: (court: Court, time: string) => AdminBooking | undefined;
    setActiveCell: (id: number | null) => void;
    updateStatus: (bookingId: number, status: string) => void;
}

export default function Tabel({ courts, times, activeCell, getBooking, setActiveCell, updateStatus }: TabelProps) {
    return (
        <div className="bg-white">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80">
                        <th className="text-left px-4 py-3.5 text-gray-500 font-bold text-xs uppercase tracking-wider w-20 sticky left-0 bg-gray-50 z-10">
                            Horario
                        </th>
                        {courts.map((court) => (
                            <th key={court.court_id} className="text-left px-3 py-3.5 text-gray-800 font-bold text-xs uppercase tracking-wider whitespace-nowrap min-w-36 border-l border-gray-100">
                                {court.court_name}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {times.map((time, i) => (
                        <tr key={time} className={`border-b border-gray-100 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-emerald-50/20`}>
                            <td className="px-4 py-3 text-gray-500 font-mono text-xs font-semibold sticky left-0 bg-white shadow-xs z-10">{time}</td>

                            {courts.map((court) => {
                                const booking = getBooking(court, time);
                                if (!booking) return <td key={court.court_id} className="px-3 py-2 border-l border-gray-100/60" />;

                                const isActive = activeCell === booking.booking_id;

                                return (
                                    <td key={court.court_id} className="px-3 py-2 relative border-l border-gray-100/60">
                                        <StatusCard bookingId={booking.booking_id} bookingStatus={booking.booking_status} customerName={`${booking.first_name} ${booking.last_name}`} isActive={isActive} setActiveCell={setActiveCell} />

                                        {/* Inline action panel */}
                                        {isActive && (
                                            <div className="absolute z-30 top-full left-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 min-w-56">
                                                <div className="text-xs font-semibold text-gray-800">{booking.first_name} {booking.last_name}</div>
                                                <div className="text-xs text-gray-500 mb-0.5">{booking.email}</div>
                                                <div className="text-xs font-bold text-emerald-700">{booking.court_name} · {booking.booked_time}</div>
                                                <div className="text-[11px] font-semibold text-gray-600 mb-3">
                                                    {booking.payment_method === "efectivo" ? "💵 Pago en Efectivo" : "🏛️ Transferencia"} · ${Number(booking.price || 15).toFixed(2)} USD
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <StatusButton variant="completed" disabled={booking.booking_status === "completed"} onClick={() => updateStatus(booking.booking_id, "completed")} />
                                                    <StatusButton variant="no_show" disabled={booking.booking_status === "no_show"} onClick={() => updateStatus(booking.booking_id, "no_show")} />
                                                    <StatusButton variant="confirmed" disabled={booking.booking_status === "confirmed"} onClick={() => updateStatus(booking.booking_id, "confirmed")} />
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}