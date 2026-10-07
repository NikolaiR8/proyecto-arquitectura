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
        pdf.line("CanchasDioguinho - Informe de alquileres", 18, true, 26);
        pdf.line(`Período de turnos: ${from} al ${to}`, 11, true);
        pdf.line(`Generado: ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`, 9);
        pdf.space();
        pdf.line("Resumen financiero (USD)", 13, true, 22);
        pdf.line(`Ingresos cobrados: ${money(paid)}  |  Reservas pagadas: ${paidCount}  |  Ticket promedio: ${money(paidCount ? paid / paidCount : 0)}`);
        pdf.line(`Por cobrar (reservas pendientes): ${money(pending)}  |  Reembolsos registrados: ${money(refunded)}`);
        pdf.line("Los ingresos incluyen solo pagos marcados como pagados; los reembolsos se muestran por separado.", 9);
        pdf.space();
        pdf.line(`Reservas del periodo: ${rows.length}`, 13, true, 22);
        pdf.line([...statuses.entries()].map(([status, count]) => `${status}: ${count}`).join("   ") || "Sin reservas", 9);
        pdf.line(`Por deporte: ${[...sports.entries()].map(([sport, count]) => `${sport}: ${count}`).join("   ") || "Sin reservas"}`, 9);
        pdf.line(`Cobrado por metodo: ${[...methods.entries()].map(([method, amount]) => `${method}: ${money(amount)}`).join("   ") || "Sin cobros"}`, 9);
        pdf.space();
        pdf.line("Rendimiento por cancha", 13, true, 22);
        for (const [name, court] of courts) {
            pdf.line(`${name}: ${court.bookings} reservas, ${money(court.paid)} cobrados`, 10);
        }
        if (!courts.size) pdf.line("Sin registros en este periodo.");
        pdf.space();
        pdf.line("Detalle de reservas y pagos", 13, true, 22);
        pdf.row([
            { value: "ID", x: 36, max: 8 }, { value: "Fecha", x: 72, max: 12 },
            { value: "Hora", x: 143, max: 7 }, { value: "Cancha", x: 188, max: 16 },
            { value: "Cliente", x: 290, max: 25 }, { value: "Reserva", x: 452, max: 12 },
            { value: "Pago", x: 530, max: 12 }, { value: "Metodo", x: 608, max: 18 },
            { value: "USD", x: 735, max: 12 },
        ], true);
        for (const row of rows) {
            pdf.row([
                { value: String(row.booking_id), x: 36, max: 8 },
                { value: row.booked_date, x: 72, max: 12 },
                { value: row.booked_time, x: 143, max: 7 },
                { value: row.court_name, x: 188, max: 16 },
                { value: `${row.first_name} ${row.last_name}`, x: 290, max: 25 },
                { value: row.booking_status, x: 452, max: 12 },
                { value: row.payment_status, x: 530, max: 12 },
                { value: row.payment_method ?? "", x: 608, max: 18 },
                { value: money(Number(row.price ?? 0)), x: 735, max: 12 },
            ]);
            pdf.line(`   ${row.email}  |  Comprobante: ${row.payment_proof || "N/A"}`, 8, false, 18);
        }

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
