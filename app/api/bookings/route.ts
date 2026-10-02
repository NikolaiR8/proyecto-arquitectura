import { NextRequest, NextResponse } from "next/server";
import { pool } from "../../lib/db";
import { getUserId } from "../../lib/getUserId";
import { getUserIsAdmin } from "../../lib/getUserIsAdmin";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate");
        const days = Number(searchParams.get("days"));

        if (!days || !startDate) {
            return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
        }

        // Mostrar slots ocupados: pending y confirmed bloquean el turno
        const sql = `SELECT court_id, DATE_FORMAT(booked_date, '%Y-%m-%d') AS booked_date, booked_time FROM bookings
                    WHERE booking_status IN ('pending', 'confirmed', 'completed') AND
                    booked_date BETWEEN ? AND
                    DATE_ADD(?, INTERVAL ? DAY)`;
        const [rows] = await pool.execute(sql, [startDate, startDate, days]);
        const bookings = rows as Partial<BookingRow>[];
        return NextResponse.json({ bookings }, { status: 200 });
    } catch (error) {
        console.error("Error al obtener reservas:", error);
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "No autorizado. Inicia sesión para reservar." }, { status: 401 });
        }

        const isAdmin = await getUserIsAdmin(req);
        const { court_id, booked_date, booked_time, payment_proof, payment_method, customer_name, customer_id } = await req.json();

        if (!court_id || !booked_date || !booked_time) {
            return NextResponse.json({ error: "Datos de reserva incompletos" }, { status: 400 });
        }

        // Solo el administrador puede seleccionar 'efectivo' o registrar pagos directos
        let finalMethod = "transferencia_bancaria";
        let bookingStatus: "pending" | "confirmed" = "pending";
        let paymentStatus: "pending" | "paid" = "pending";
        let proof = payment_proof ? String(payment_proof).trim() : null;

        if (isAdmin && payment_method === "efectivo") {
            finalMethod = "efectivo";
            bookingStatus = "confirmed";
            paymentStatus = "paid";
            proof = proof || "Cobro en Efectivo (Admin)";
        } else if (isAdmin && payment_method === "transferencia_bancaria") {
            finalMethod = "transferencia_bancaria";
            proof = proof || "TRANSFERENCIA-ADMIN";
        }

        const sql = `INSERT INTO bookings 
            (user_id, court_id, booked_date, booked_time, booking_status, payment_status, payment_method, payment_proof, price, customer_name, customer_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 15.00, ?, ?)`;
        await pool.execute(sql, [userId, court_id, booked_date, booked_time, bookingStatus, paymentStatus, finalMethod, proof, customer_name?.trim() || null, customer_id?.trim() || null]);

        return NextResponse.json({ 
            message: bookingStatus === "confirmed" 
                ? "Reserva registrada y confirmada exitosamente." 
                : "Solicitud de reserva enviada. Pendiente de verificación." 
        }, { status: 201 });
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: "Este turno ya ha sido reservado" }, { status: 409 });
        }
        console.error("Error al crear reserva:", error);
        return NextResponse.json({ error: "Error en el servidor al procesar la reserva" }, { status: 500 });
    }
}