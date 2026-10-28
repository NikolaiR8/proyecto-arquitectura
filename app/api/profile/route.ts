import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { pool, ensureDatabaseSchema } from "../../lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { validatePassword, validateRegisterEmail } from "../../lib/auth-validation";

async function getAuthUserId(): Promise<number | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
    if (!JWT_SECRET_KEY) return null;

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET_KEY));
        return (payload.userId as number) || null;
    } catch {
        return null;
    }
}

// GET: Obtener perfil de usuario completo y estadísticas
export async function GET() {
    try {
        const userId = await getAuthUserId();
        if (!userId) {
            return NextResponse.json({ error: "No autorizado. Inicia sesión para ver tu perfil." }, { status: 401 });
        }

        await ensureDatabaseSchema();

        const [userRows] = await pool.execute<RowDataPacket[]>(
            `SELECT user_id, first_name, last_name, email, role, avatar_url, phone, bio, 
                    position, preferred_foot, favorite_court, email_verified, created_at
             FROM users WHERE user_id = ? LIMIT 1`,
            [userId]
        );

        if (userRows.length === 0) {
            return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
        }

        const user = userRows[0];

        // Obtener estadísticas de reservas del usuario
        let stats = { total: 0, active: 0, completed: 0, cancelled: 0 };
        try {
            const [bookingStats] = await pool.execute<RowDataPacket[]>(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN booking_status IN ('pending', 'confirmed') THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN booking_status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
                 FROM bookings WHERE user_id = ?`,
                [userId]
            );

            if (bookingStats.length > 0) {
                stats = {
                    total: Number(bookingStats[0].total) || 0,
                    active: Number(bookingStats[0].active) || 0,
                    completed: Number(bookingStats[0].completed) || 0,
                    cancelled: Number(bookingStats[0].cancelled) || 0,
                };
            }
        } catch (e) {
            console.warn("Could not load user booking stats:", e);
        }

        return NextResponse.json({
            user: {
                userId: user.user_id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatar_url || null,
                phone: user.phone || "",
                bio: user.bio || "",
                position: user.position || "",
                preferredFoot: user.preferred_foot || "",
                favoriteCourt: user.favorite_court || "",
                emailVerified: Boolean(user.email_verified),
                createdAt: user.created_at
            },
            stats
        });

    } catch (error: any) {
        console.error("Error en GET /api/profile:", error);
        return NextResponse.json({ error: `Error del servidor: ${error?.message || "Desconocido"}` }, { status: 500 });
    }
}

// PUT: Actualizar datos personales y preferencias del perfil
export async function PUT(request: NextRequest) {
    try {
        const userId = await getAuthUserId();
        if (!userId) {
            return NextResponse.json({ error: "No autorizado." }, { status: 401 });
        }

        await ensureDatabaseSchema();

        const body = await request.json();
        const {
            firstName,
            lastName,
            email,
            phone,
            bio,
            position,
            preferredFoot,
            favoriteCourt,
            avatarUrl
        } = body;

        if (!firstName?.trim() || !lastName?.trim()) {
            return NextResponse.json({ error: "El nombre y el apellido son obligatorios." }, { status: 400 });
        }

        if (!email?.trim()) {
            return NextResponse.json({ error: "El correo electrónico es obligatorio." }, { status: 400 });
        }

        const cleanEmail = email.trim().toLowerCase();
        const emailCheck = validateRegisterEmail(cleanEmail);
        if (!emailCheck.isValid) {
            return NextResponse.json({ error: emailCheck.error }, { status: 400 });
        }

        // Verificar si el correo ya está en uso por otro usuario distinto
        const [existingEmail] = await pool.execute<RowDataPacket[]>(
            "SELECT user_id FROM users WHERE email = ? AND user_id != ? LIMIT 1",
            [cleanEmail, userId]
        );

        if (existingEmail.length > 0) {
            return NextResponse.json({ error: "Ese correo ya está en uso por otra cuenta." }, { status: 409 });
        }

        const updateSql = `
            UPDATE users SET
                first_name = ?,
                last_name = ?,
                email = ?,
                phone = ?,
                bio = ?,
                position = ?,
                preferred_foot = ?,
                favorite_court = ?,
                avatar_url = ?
            WHERE user_id = ?
        `;

        await pool.execute<ResultSetHeader>(updateSql, [
            firstName.trim(),
            lastName.trim(),
            cleanEmail,
            phone ? phone.trim() : null,
            bio ? bio.trim() : null,
            position ? position.trim() : null,
            preferredFoot ? preferredFoot.trim() : null,
            favoriteCourt ? favoriteCourt.trim() : null,
            avatarUrl !== undefined ? avatarUrl : null,
            userId
        ]);

        return NextResponse.json({
            message: "¡Perfil actualizado con éxito!",
            user: {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: cleanEmail,
                phone: phone || "",
                bio: bio || "",
                position: position || "",
                preferredFoot: preferredFoot || "",
                favoriteCourt: favoriteCourt || "",
                avatarUrl: avatarUrl || null
            }
        });

    } catch (error: any) {
        console.error("Error en PUT /api/profile:", error);
        return NextResponse.json({ error: `Error al actualizar perfil: ${error?.message || "Desconocido"}` }, { status: 500 });
    }
}

// PATCH: Cambio seguro de contraseña
export async function PATCH(request: NextRequest) {
    try {
        const userId = await getAuthUserId();
        if (!userId) {
            return NextResponse.json({ error: "No autorizado." }, { status: 401 });
        }

        const body = await request.json();
        const { currentPassword, newPassword, confirmPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Debes ingresar tu contraseña actual y la nueva contraseña." }, { status: 400 });
        }

        const passCheck = validatePassword(newPassword);
        if (!passCheck.isValid) {
            return NextResponse.json({ error: passCheck.error }, { status: 400 });
        }

        if (confirmPassword && newPassword !== confirmPassword) {
            return NextResponse.json({ error: "Las contraseñas nuevas no coinciden." }, { status: 400 });
        }

        // Consultar hash actual
        const [rows] = await pool.execute<RowDataPacket[]>(
            "SELECT password_hash FROM users WHERE user_id = ? LIMIT 1",
            [userId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
        }

        const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!isMatch) {
            return NextResponse.json({ error: "La contraseña actual no es correcta." }, { status: 400 });
        }

        // Hashear nueva contraseña
        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.execute("UPDATE users SET password_hash = ? WHERE user_id = ?", [newHash, userId]);

        return NextResponse.json({ message: "¡Contraseña actualizada exitosamente!" });

    } catch (error: any) {
        console.error("Error en PATCH /api/profile:", error);
        return NextResponse.json({ error: `Error al cambiar la contraseña: ${error?.message || "Desconocido"}` }, { status: 500 });
    }
}
