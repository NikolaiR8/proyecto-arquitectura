import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    
    if (!token) {
        const redirectTo = encodeURIComponent(req.nextUrl.pathname);
        return NextResponse.redirect(new URL(`/login?redirectTo=${redirectTo}`, req.url));
    }
    
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
    if (!JWT_SECRET_KEY) {
        console.error("JWT secret key is not defined");
        return NextResponse.json({ message: "Error de configuración en el servidor" }, { status: 500 });
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET_KEY));
        
        if (req.nextUrl.pathname.startsWith("/admin") && payload.role !== "admin") {
            return NextResponse.redirect(new URL("/", req.url));
        }

    } catch {
        const redirectTo = encodeURIComponent(req.nextUrl.pathname);
        return NextResponse.redirect(new URL(`/login?redirectTo=${redirectTo}`, req.url));
    }
}

export const config = {
    matcher: ["/booking/:path+", "/admin/:path*", "/reservations", "/profile"]
};