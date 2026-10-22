import { NextRequest, NextResponse } from "next/server";
import { pool, ensureDatabaseSchema } from "../../../lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { ResultSetHeader } from "mysql2";
import { verifyCode, deleteVerificationCode } from "../../../lib/verificationStore";

export async function POST(request: NextRequest) {
    try {
        const { firstName, lastName, password, email, code } = await request.json();

        if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim()) {
            return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanFirst = firstName.trim();
        const cleanLast = lastName.trim();

        // Validar formato de correo estricto
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(cleanEmail)) {
            return NextResponse.json({ error: "El formato del correo electrónico no es válido." }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
        }

        // Si se envió un código de verificación, validarlo
        if (code) {
            const codeResult = await verifyCode(cleanEmail, code);
            if (!codeResult.valid) {
                return NextResponse.json({ error: codeResult.error || "El código de verificación es incorrecto." }, { status: 400 });
            }
        }

        await ensureDatabaseSchema();

        const password_hash = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (first_name, last_name, password_hash, email, email_verified) 
            VALUES (?, ?, ?, ?, TRUE)
        `;
        const [insertResult] = await pool.execute<ResultSetHeader>(sql, [
            cleanFirst,
            cleanLast,
            password_hash,
            cleanEmail
        ]);

        const newUserId = insertResult.insertId;

        // Limpiar código usado
        await deleteVerificationCode(cleanEmail);

        // Autenticar automáticamente al nuevo usuario con cookie JWT
        const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
        if (JWT_SECRET_KEY) {
            const token = await new SignJWT({ userId: newUserId, role: "customer" })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("7d")
                .sign(new TextEncoder().encode(JWT_SECRET_KEY));

            const cookieStore = await cookies();
            cookieStore.set("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7
            });
        }

        return NextResponse.json({
            message: "¡Cuenta creada exitosamente!",
            user: {
                userId: newUserId,
                firstName: cleanFirst,
                lastName: cleanLast,
                email: cleanEmail,
                role: "customer"
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error("Registration error: ", error);

        if (error.code === "ECONNREFUSED") {
            return NextResponse.json({ 
                error: "No se pudo conectar a la base de datos MySQL (ECONNREFUSED). Asegúrate de configurar la conexión a Railway en tu archivo .env.local o desplegarlo en Vercel." 
            }, { status: 500 });
        }

        if (error.code === "ER_DUP_ENTRY") {
            if (error.message?.includes("email") || error.sqlMessage?.includes("email")) {
                return NextResponse.json({ error: "Este correo electrónico ya está registrado." }, { status: 409 });
            }
            return NextResponse.json({ error: "Ya existe un registro con estos datos." }, { status: 409 });
        }

        const detailed = error?.sqlMessage || error?.message || "Error del servidor";
        return NextResponse.json({ error: `Error en el registro: ${detailed}` }, { status: 500 });
    }
}