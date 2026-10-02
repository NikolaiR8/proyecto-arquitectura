import { NextRequest, NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    
    if (!from || !to) {
        return NextResponse.json({ error: "Missing Params" }, { status: 400 });
    }

    try {
        // 1. KPIs Generales
        const kpiSql = `SELECT
            COUNT(DISTINCT u.user_id) AS total_signups,
            COUNT(DISTINCT CASE WHEN u.created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY) - INTERVAL 1 SECOND THEN u.user_id END) AS new_signups,
            COUNT(DISTINCT CASE WHEN u.is_banned = 1 THEN u.user_id END) AS banned_users,
            COUNT(CASE WHEN b.booked_date BETWEEN ? AND ? THEN 1 END) AS total_bookings,
            ROUND(COUNT(CASE WHEN b.booked_date BETWEEN ? AND ? AND b.booking_status = 'cancelled' THEN 1 END) * 100
                / NULLIF(COUNT(CASE WHEN b.booked_date BETWEEN ? AND ? THEN 1 END), 0), 1) AS cancelled_percentage,
            ROUND(COUNT(CASE WHEN b.booked_date BETWEEN ? AND ? AND b.booking_status = 'no_show' THEN 1 END) * 100
                / NULLIF(COUNT(CASE WHEN b.booked_date BETWEEN ? AND ? THEN 1 END), 0), 1) AS no_show_percentage
            FROM users u
            LEFT JOIN bookings b ON u.user_id = b.user_id
        `;
        const kpiParams = [from, to, from, to, from, to, from, to, from, to, from, to];
        const [kpiRows] = await pool.execute<RowDataPacket[]>(kpiSql, kpiParams);
        const kpiData = (kpiRows[0] || {
            total_signups: 0,
            new_signups: 0,
            banned_users: 0,
            total_bookings: 0,
            cancelled_percentage: 0,
            no_show_percentage: 0
        }) as KpiData;

        // 2. Módulo de Ingresos y Finanzas
        const revenueSql = `SELECT
            COALESCE(SUM(CASE WHEN b.payment_status = 'paid' OR b.booking_status IN ('confirmed', 'completed') THEN b.price ELSE 0 END), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN b.payment_status = 'pending' AND b.booking_status = 'pending' THEN b.price ELSE 0 END), 0) AS pending_revenue,
            COALESCE(SUM(CASE WHEN b.payment_status = 'refunded' OR b.booking_status = 'cancelled' THEN b.price ELSE 0 END), 0) AS refunded_revenue,
            COUNT(CASE WHEN b.payment_status = 'paid' OR b.booking_status IN ('confirmed', 'completed') THEN 1 END) AS total_paid_bookings,
            COALESCE(ROUND(AVG(CASE WHEN b.payment_status = 'paid' OR b.booking_status IN ('confirmed', 'completed') THEN b.price END), 2), 15.00) AS average_ticket
            FROM bookings b
            WHERE b.booked_date BETWEEN ? AND ?
        `;
        const [revenueRows] = await pool.execute<RowDataPacket[]>(revenueSql, [from, to]);
        const rawRevenue = revenueRows[0];
        const revenueData: RevenueData = {
            total_revenue: Number(rawRevenue?.total_revenue ?? 0),
            pending_revenue: Number(rawRevenue?.pending_revenue ?? 0),
            refunded_revenue: Number(rawRevenue?.refunded_revenue ?? 0),
            total_paid_bookings: Number(rawRevenue?.total_paid_bookings ?? 0),
            average_ticket: Number(rawRevenue?.average_ticket ?? 15.00),
        };

        // 3. Desglose de Canchas y Mapa de Ocupación por Cancha
        const courtUsageSql = `SELECT 
            c.court_id,
            c.court_name,
            c.sport,
            COUNT(CASE WHEN b.booking_id IS NOT NULL AND b.booking_status != 'cancelled' THEN 1 END) AS booking_count,
            COUNT(CASE WHEN b.booking_status = 'completed' THEN 1 END) AS completed_count,
            COALESCE(SUM(CASE WHEN b.booking_status IN ('confirmed', 'completed') OR b.payment_status = 'paid' THEN b.price ELSE 0 END), 0) AS total_court_revenue
            FROM courts c
            LEFT JOIN bookings b ON c.court_id = b.court_id AND b.booked_date BETWEEN ? AND ?
            GROUP BY c.court_id, c.court_name, c.sport
            ORDER BY booking_count DESC, c.court_id ASC
        `;
        const [courtUsageRows] = await pool.execute<RowDataPacket[]>(courtUsageSql, [from, to]);
        
        const totalBookingsAllCourts = courtUsageRows.reduce((acc, row) => acc + Number(row.booking_count || 0), 0);
        const maxBookings = courtUsageRows.length > 0 ? Math.max(...courtUsageRows.map(r => Number(r.booking_count || 0))) : 0;

        const courtUsageData: CourtUsageItem[] = courtUsageRows.map((row) => {
            const count = Number(row.booking_count || 0);
            const usagePercentage = totalBookingsAllCourts > 0 
                ? Number(((count / totalBookingsAllCourts) * 100).toFixed(1)) 
                : 0;

            return {
                court_id: Number(row.court_id),
                court_name: String(row.court_name),
                sport: String(row.sport),
                booking_count: count,
                completed_count: Number(row.completed_count || 0),
                total_court_revenue: Number(row.total_court_revenue || 0),
                usage_percentage: usagePercentage,
                is_most_used: count > 0 && count === maxBookings,
            };
        });

        // 4. Registros de Auditoría
        const auditSql = `SELECT 
            b.booking_id,
            b.court_id,
            c.court_name,
            c.sport,
            b.user_id,
            u.first_name,
            u.last_name,
            u.email,
            DATE_FORMAT(b.booked_date, '%Y-%m-%d') AS booked_date,
            DATE_FORMAT(b.booked_time, '%H:%i') AS booked_time,
            b.booking_status,
            b.payment_status,
            b.payment_method,
            b.payment_proof,
            b.price,
            b.customer_name,
            b.customer_id,
            DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
            FROM bookings b
            JOIN courts c ON b.court_id = c.court_id
            JOIN users u ON b.user_id = u.user_id
            WHERE b.booked_date BETWEEN ? AND ?
            ORDER BY b.booked_date DESC, b.booked_time DESC, b.created_at DESC
            LIMIT 500
        `;
        const [auditRows] = await pool.execute<RowDataPacket[]>(auditSql, [from, to]);
        const auditData: AuditBookingItem[] = auditRows.map(row => ({
            booking_id: Number(row.booking_id),
            court_id: Number(row.court_id),
            court_name: String(row.court_name),
            sport: String(row.sport),
            user_id: Number(row.user_id),
            first_name: String(row.first_name || "Usuario"),
            last_name: String(row.last_name || ""),
            email: String(row.email || ""),
            booked_date: String(row.booked_date),
            booked_time: String(row.booked_time),
            booking_status: row.booking_status,
            payment_status: row.payment_status || "pending",
            payment_method: String(row.payment_method || "transferencia_bancaria"),
            payment_proof: row.payment_proof ? String(row.payment_proof) : null,
            price: Number(row.price || 15),
            created_at: String(row.created_at),
            customer_name: row.customer_name ? String(row.customer_name) : null,
            customer_id: row.customer_id ? String(row.customer_id) : null,
        }));

        // 5. Desglose de Estado de Reservas
        const bookingsBreakdownSql = `SELECT
            COUNT(CASE WHEN b.booking_status = 'confirmed' THEN 1 END) AS confirmed_bookings,
            COUNT(CASE WHEN b.booking_status = 'completed' THEN 1 END) AS completed_bookings,
            COUNT(CASE WHEN b.booking_status = 'cancelled' THEN 1 END) AS cancelled_bookings,
            COUNT(CASE WHEN b.booking_status = 'no_show' THEN 1 END) AS no_show_bookings
            FROM bookings b
            WHERE b.booked_date BETWEEN ? AND ?
        `;
        const [bookingsBreakdownRows] = await pool.execute<RowDataPacket[]>(bookingsBreakdownSql, [from, to]);
        const bookingsBreakdownData = (bookingsBreakdownRows[0] || {
            confirmed_bookings: 0,
            completed_bookings: 0,
            cancelled_bookings: 0,
            no_show_bookings: 0,
        }) as BookingsBreakdownData;

        // 6. Desglose por Deporte
        const sportsBreakdownSql = `SELECT c.sport, COUNT(*) AS total
            FROM bookings b
            JOIN courts c ON b.court_id = c.court_id
            WHERE b.booked_date BETWEEN ? AND ?
            GROUP BY c.sport
        `;
        const [sportsBreakdownRows] = await pool.execute<RowDataPacket[]>(sportsBreakdownSql, [from, to]);
        const sportsBreakdownData = sportsBreakdownRows as SportBreakdownData[];

        // 7. Matriz de Mapa de Calor Horario (Lunes a Domingo / 24 Horas)
        const heatMapSql = `SELECT 
            DAYOFWEEK(booked_date) AS day_of_week,
            HOUR(booked_time) AS booked_hour,
            COUNT(*) AS booking_count
            FROM bookings
            WHERE booking_status IN ('confirmed', 'completed', 'pending')
            AND booked_date BETWEEN ? AND ?
            GROUP BY day_of_week, booked_hour
            ORDER BY day_of_week, booked_hour
        `;
        const [heatMapRows] = await pool.execute<RowDataPacket[]>(heatMapSql, [from, to]);

        const heatMapMatrix = Array.from({ length: 7 }, () => Array(24).fill(0));

        for (const row of heatMapRows) {
            // MySQL DAYOFWEEK: 1=Domingo, 2=Lunes, ..., 7=Sábado
            // Convert to 0=Lunes, ..., 6=Domingo
            const day = row.day_of_week === 1 ? 6 : row.day_of_week - 2;
            const hour = Number(row.booked_hour);
            if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
                heatMapMatrix[day][hour] = Number(row.booking_count);
            }
        }

        const totalCourts = courtUsageRows.length || 10;
        const heatMapData: HeatMapData = { heatMapMatrix, totalCourts };

        return NextResponse.json({
            kpiData,
            revenueData,
            courtUsageData,
            auditData,
            bookingsBreakdownData,
            sportsBreakdownData,
            heatMapData,
        }, { status: 200 });

    } catch (error) {
        console.error("Error al obtener estadísticas de admin:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}