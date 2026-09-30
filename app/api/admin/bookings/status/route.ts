import { ResultSetHeader } from "mysql2";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { getUserIsAdmin } from "../../../../lib/getUserIsAdmin";

export async function PATCH(req: NextRequest) {
    try {
        if (!await getUserIsAdmin(req)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { bookingId, status, payment_method, payment_proof } = await req.json();

        if (!bookingId || !status) {
            return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
        }

        if (!["pending", "confirmed", "completed", "cancelled", "no_show"].includes(status)) {
            return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
        }

        // Al confirmar, también se marca el pago como pagado
        // Al cancelar/rechazar, se marca como reembolsado
        let paymentStatus: string;
        if (status === "confirmed" || status === "completed") {
            paymentStatus = "paid";
        } else if (status === "cancelled" || status === "no_show") {
            paymentStatus = "refunded";
        } else {
            paymentStatus = "pending";
        }

        let sql: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let params: any[];

        if (payment_method) {
            sql = "UPDATE bookings SET booking_status = ?, payment_status = ?, payment_method = ?, payment_proof = COALESCE(?, payment_proof) WHERE booking_id = ?";
            params = [status, paymentStatus, payment_method, payment_proof || null, bookingId];
        } else {
            sql = "UPDATE bookings SET booking_status = ?, payment_status = ? WHERE booking_id = ?";
            params = [status, paymentStatus, bookingId];
        }

        const [result] = await pool.execute<ResultSetHeader>(sql, params);
        
        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
        }

        return NextResponse.json({ message: "Estado de reserva actualizado" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
    }
}