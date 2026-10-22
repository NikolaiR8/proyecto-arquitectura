import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pool, ensureDatabaseSchema } from "../../../lib/db";
import { RowDataPacket } from "mysql2";

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ authenticated: false });
    }

    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

    if (!JWT_SECRET_KEY) {
        console.error("JWT secret key is not defined");
        return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET_KEY));
        const userId = payload.userId as number;
        const role = payload.role as string;

        let userInfo: {
            firstName?: string;
            lastName?: string;
            email?: string;
            avatarUrl?: string;
        } = {};

        try {
            await ensureDatabaseSchema();
            const [rows] = await pool.execute<RowDataPacket[]>(
                "SELECT first_name, last_name, email, avatar_url FROM users WHERE user_id = ? LIMIT 1",
                [userId]
            );

            if (rows.length > 0) {
                userInfo = {
                    firstName: rows[0].first_name,
                    lastName: rows[0].last_name,
                    email: rows[0].email,
                    avatarUrl: rows[0].avatar_url || null,
                };
            }
        } catch (dbErr) {
            console.warn("Could not fetch extra user info in status:", dbErr);
        }

        return NextResponse.json({
            authenticated: true,
            userId,
            role,
            ...userInfo
        });

    } catch (error) {
        console.error("Auth status verification error:", error);
        return NextResponse.json({ authenticated: false });
    }
}