import { NextRequest, NextResponse } from "next/server";
import { generateVerificationCode, sendVerificationEmail } from "../../../lib/mailer";
import { saveVerificationCode } from "../../../lib/verificationStore";
import { pool } from "../../../lib/db";
import { RowDataPacket } from "mysql2";
import { validateRegisterEmail } from "../../../lib/auth-validation";

export async function POST(request: NextRequest) {
    try {
        const { email, firstName } = await request.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "El correo electrónico es requerido." }, { status: 400 });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Validar formato estricto y que el dominio sea exclusivamente Gmail
        const emailCheck = validateRegisterEmail(cleanEmail);
        if (!emailCheck.isValid) {
            return NextResponse.json({ error: emailCheck.error }, { status: 400 });
        }

        // Verificar si el correo ya está registrado en la base de datos
        try {
            const [existing] = await pool.execute<RowDataPacket[]>(
                "SELECT user_id FROM users WHERE email = ? LIMIT 1",
                [cleanEmail]
            );

            if (existing && existing.length > 0) {
                return NextResponse.json(
                    { error: "Este correo electrónico ya está registrado en el sistema." },
                    { status: 409 }
                );
            }
        } catch (dbErr: any) {
            console.warn("Aviso BD en send-code:", dbErr?.code || dbErr?.message);
        }

        // Generar código de 6 dígitos
        const code = generateVerificationCode();

        // Guardar código
        await saveVerificationCode(cleanEmail, code);

        // Enviar email real
        const mailResult = await sendVerificationEmail(cleanEmail, code, firstName);

        if (!mailResult.success) {
            return NextResponse.json({
                error: mailResult.message || "Error al enviar el correo con el código de verificación."
            }, { status: 500 });
        }

        // Respuesta limpia de producción: no expone el código en la respuesta HTTP
        return NextResponse.json({
            message: "Código de verificación enviado a tu correo electrónico."
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error en send-code:", error);
        return NextResponse.json(
            { error: `Error al procesar el código de verificación: ${error?.message || "Error del servidor"}` },
            { status: 500 }
        );
    }
}
