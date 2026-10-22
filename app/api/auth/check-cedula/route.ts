import { NextRequest, NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { validarCedulaEcuatoriana } from "../../../lib/cedula-validator";

const MOCK_EXISTING_CEDULAS = new Set<string>([
    "1710034065",
    "1715421523",
    "0926687856",
    "1722334455",
]);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const cedula = searchParams.get("cedula")?.trim() || "";

        if (!cedula) {
            return NextResponse.json(
                { exists: false, message: "Parámetro 'cedula' requerido." },
                { status: 400 }
            );
        }

        // Validación estricta Módulo 10 en backend
        const validation = validarCedulaEcuatoriana(cedula);
        if (!validation.isValid) {
            return NextResponse.json(
                { exists: false, message: validation.error || "Cédula no válida." },
                { status: 422 }
            );
        }

        let exists = false;

        // 1. Verificar primero si existe en base de datos si la conexión está disponible
        try {
            // Intentar verificar en tabla users si tiene columna cedula o en bookings por customer_id
            const [rows] = await pool.query<any[]>(
                "SELECT booking_id FROM bookings WHERE customer_id = ? LIMIT 1",
                [cedula]
            );

            if (rows && rows.length > 0) {
                exists = true;
            }
        } catch {
            // Si la base de datos no está disponible o la columna no existe, no interrumpimos el flujo
        }

        // 2. Verificar en mock de cédulas registradas
        if (!exists && MOCK_EXISTING_CEDULAS.has(cedula)) {
            exists = true;
        }

        return NextResponse.json({
            exists,
            cedula,
            message: exists
                ? "Esta cédula ya se encuentra registrada en el sistema."
                : "Cédula válida y disponible para nuevo registro.",
        });
    } catch (error) {
        console.error("Error al validar cédula:", error);
        return NextResponse.json(
            { exists: false, message: "Error interno del servidor al verificar la cédula." },
            { status: 500 }
        );
    }
}
