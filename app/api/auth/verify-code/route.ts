import { NextRequest, NextResponse } from "next/server";
import { verifyCode } from "../../../lib/verificationStore";

export async function POST(request: NextRequest) {
    try {
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ error: "Correo y código son obligatorios." }, { status: 400 });
        }

        const result = await verifyCode(email, code);

        if (!result.valid) {
            return NextResponse.json({ error: result.error || "El código ingresado es incorrecto." }, { status: 400 });
        }

        return NextResponse.json({ verified: true, message: "Código verificado correctamente." }, { status: 200 });

    } catch (error: any) {
        console.error("Error al verificar código:", error);
        return NextResponse.json(
            { error: `Error del servidor: ${error?.message || "Inesperado"}` },
            { status: 500 }
        );
    }
}
