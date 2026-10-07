import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { pool } from "../../../../lib/db";
import { getUserIsAdmin } from "../../../../lib/getUserIsAdmin";
import { PdfReport } from "../../../../lib/pdf-report";

type ReportRow = RowDataPacket & {
    booking_id: number;
    booked_date: string;
    booked_time: string;
    court_name: string;
    sport: string;
    first_name: string;
    last_name: string;
    email: string;
    booking_status: string;
    payment_status: string;
    payment_method: string;
    payment_proof: string | null;
    price: number;
};

const money = (value: number) => `$${value.toFixed(2)}`;
const bookingLabel: Record<string, string> = {
    pending: "Pendiente", confirmed: "Confirmada", completed: "Completada",
    cancelled: "Cancelada", no_show: "No asistió",
};
const paymentLabel: Record<string, string> = {
    pending: "Pendiente", paid: "Pagado", refunded: "Reembolsado",
};
const methodLabel = (value: string) => value === "transferencia_bancaria" ? "Transferencia bancaria" : value === "efectivo" ? "Efectivo" : value;
const sportLabel = (value: string) => value === "futbol5" ? "Fútbol 5" : value;

export async function GET(req: NextRequest) {
    if (!await getUserIsAdmin(req)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const validDate = (value: string | null) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value);
    if (!validDate(from) || !validDate(to) || from! > to!) {
        return NextResponse.json({ error: "Rango de fechas no válido" }, { status: 400 });
    }

    try {
        const [rows] = await pool.execute<ReportRow[]>(`
            SELECT b.booking_id, DATE_FORMAT(b.booked_date, '%Y-%m-%d') AS booked_date,
                DATE_FORMAT(b.booked_time, '%H:%i') AS booked_time,
                c.court_name, c.sport, u.first_name, u.last_name, u.email,
                b.booking_status, b.payment_status, b.payment_method, b.payment_proof, b.price
            FROM bookings b
            JOIN courts c ON c.court_id = b.court_id
            JOIN users u ON u.user_id = b.user_id
            WHERE b.booked_date BETWEEN ? AND ?
            ORDER BY b.booked_date, b.booked_time, b.booking_id
        `, [from, to]);

        const courts = new Map<string, { bookings: number; paid: number }>();
        const statuses = new Map<string, number>();
        const sports = new Map<string, number>();
        const methods = new Map<string, number>();
        let paid = 0;
        let pending = 0;
        let refunded = 0;
        let paidCount = 0;
        for (const row of rows) {
            const price = Number(row.price ?? 0);
            const court = courts.get(row.court_name) ?? { bookings: 0, paid: 0 };
            court.bookings++;
            statuses.set(row.booking_status, (statuses.get(row.booking_status) ?? 0) + 1);
            sports.set(row.sport, (sports.get(row.sport) ?? 0) + 1);
            if (row.payment_status === "paid") {
                paid += price;
                paidCount++;
                court.paid += price;
                methods.set(row.payment_method || "Sin especificar", (methods.get(row.payment_method || "Sin especificar") ?? 0) + price);
            } else if (row.payment_status === "refunded") {
                refunded += price;
            } else if (row.booking_status === "pending") {
                pending += price;
            }
            courts.set(row.court_name, court);
        }

        const pdf = new PdfReport();
        const period = `Turnos: ${from} al ${to}`;
        pdf.title("Informe de alquileres", period, `${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`);
        pdf.section("Resumen financiero (USD)");
        pdf.metrics([
            { label: "Ingresos cobrados", value: money(paid) },
            { label: "Por cobrar", value: money(pending) },
            { label: "Reembolsos", value: money(refunded) },
            { label: "Ticket promedio", value: money(paidCount ? paid / paidCount : 0) },
        ]);
        pdf.note(`${rows.length} reservas en el período  |  ${paidCount} pagadas. Los ingresos incluyen solo pagos marcados como pagados.`);

        const summaryWidths = [260, 250, 260];
        pdf.startTable("Actividad de reservas", [
            { label: "Estado de reserva", width: summaryWidths[0] },
            { label: "Deporte: TOTAL DE RESERVA", width: summaryWidths[1] },
            { label: "Cobros por método", width: summaryWidths[2] },
        ]);
        const statusItems = [...statuses.entries()].map(([status, count]) => `${bookingLabel[status] || status}: ${count}`);
        const sportItems = [...sports.entries()].map(([sport, count]) => `${sportLabel(sport)}: ${count}`);
        const methodItems = [...methods.entries()].map(([method, amount]) => `${methodLabel(method)}: ${money(amount)}`);
        const summaryCount = Math.max(statusItems.length, sportItems.length, methodItems.length, 1);
        for (let i = 0; i < summaryCount; i++) {
            pdf.tableRow([statusItems[i] || "", sportItems[i] || "", methodItems[i] || ""], summaryWidths, i % 2 === 1);
        }

        const courtWidths = [330, 210, 230];
        pdf.startTable("Rendimiento por cancha", [
            { label: "Cancha", width: courtWidths[0] },
            { label: "Reservas", width: courtWidths[1] },
            { label: "Ingresos cobrados", width: courtWidths[2] },
        ], true);
        [...courts.entries()].forEach(([name, court], index) => {
            pdf.tableRow([name, String(court.bookings), money(court.paid)], courtWidths, index % 2 === 1);
        });
        if (!courts.size) pdf.tableRow(["Sin registros en este período", "0", money(0)], courtWidths);

        pdf.startDetails([
            { label: "ID", width: 38 }, { label: "Fecha y hora", width: 95 },
            { label: "Cancha", width: 95 }, { label: "Cliente", width: 130 },
            { label: "Reserva", width: 85 }, { label: "Pago", width: 70 },
            { label: "Método", width: 150 }, { label: "USD", width: 107 },
        ]);
        for (const row of rows) {
            pdf.detailRow([
                String(row.booking_id), `${row.booked_date} ${row.booked_time}`,
                row.court_name, `${row.first_name} ${row.last_name}`,
                bookingLabel[row.booking_status] || row.booking_status,
                paymentLabel[row.payment_status] || row.payment_status,
                methodLabel(row.payment_method ?? ""), money(Number(row.price ?? 0)),
            ], row.email, row.payment_proof || "N/A");
        }
        if (!rows.length) pdf.note("No hay reservas registradas en este período.");

        return new NextResponse(new Uint8Array(pdf.toBuffer()), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="estadisticas_alquileres_${from}_${to}.pdf"`,
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("Error al generar PDF de estadísticas:", error);
        return NextResponse.json({ error: "No se pudo generar el informe" }, { status: 500 });
    }
}
