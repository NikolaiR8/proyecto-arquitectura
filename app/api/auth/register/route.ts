import { NextRequest, NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import bcrypt from "bcryptjs";
import { validarCedulaEcuatoriana } from "../../../lib/cedula-validator";

export async function POST(request: NextRequest) {
    try {
        const { firstName, lastName, password, email, cedula } = await request.json();

        if (cedula) {
            const val = validarCedulaEcuatoriana(cedula);
            if (!val.isValid) {
                return NextResponse.json({ error: val.error || "Cédula inválida." }, { status: 422 });
            }
        }
        
        const password_hash = await bcrypt.hash(password, 10);

        try {
            const sql = "INSERT INTO users (first_name, last_name, password_hash, email, cedula) VALUES (?, ?, ?, ?, ?)";
            await pool.execute(sql, [firstName.toLowerCase(), lastName.toLowerCase(), password_hash, email.toLowerCase(), cedula || null]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (dbErr: any) {
            if (dbErr?.message?.includes("Unknown column 'cedula'")) {
                const sqlFallback = "INSERT INTO users (first_name, last_name, password_hash, email) VALUES (?, ?, ?, ?)";
                await pool.execute(sqlFallback, [firstName.toLowerCase(), lastName.toLowerCase(), password_hash, email.toLowerCase()]);
            } else {
                throw dbErr;
            }
        }

        return NextResponse.json({ message: "User Created!" }, { status: 201 });
         
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Registration error: ", error);
        
        if (error.code === "ER_DUP_ENTRY") {
            if (error.message.includes("cedula")) {
                return NextResponse.json({ error: "Esta cédula de identidad ya se encuentra registrada." }, { status: 409 });
            } else if (error.message.includes("email")) {
                return NextResponse.json({ error: "Email already exist" }, { status: 409 });
            } else if (error.message.includes("username")) {
                return NextResponse.json({ error: "Username already exist" }, { status: 409 });
            }
        }
        
        const detailed = error?.sqlMessage || error?.message || "Server error";
        return NextResponse.json({ error: `Server error: ${detailed}` }, { status: 500 });
    }
}