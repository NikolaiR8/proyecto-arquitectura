import { pool, ensureDatabaseSchema } from "./db";
import { RowDataPacket } from "mysql2";

// Almacén en memoria como fallback cuando la base de datos local no está disponible
interface StoredCode {
    code: string;
    expiresAt: number;
}

const memoryStore = new Map<string, StoredCode>();

export async function saveVerificationCode(email: string, code: string): Promise<{ success: boolean; fallback: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos
    const expiresAtSql = new Date(expiresAt).toISOString().slice(0, 19).replace("T", " ");

    // Guardar siempre en memoria por seguridad / fallback
    memoryStore.set(cleanEmail, { code, expiresAt });

    try {
        await ensureDatabaseSchema();
        await pool.execute("DELETE FROM email_verifications WHERE email = ?", [cleanEmail]);
        await pool.execute(
            "INSERT INTO email_verifications (email, code, expires_at) VALUES (?, ?, ?)",
            [cleanEmail, code, expiresAtSql]
        );
        return { success: true, fallback: false };
    } catch (dbErr: any) {
        console.warn("[VerificationStore] No se pudo guardar en BD (usando memoria temporal):", dbErr?.code || dbErr?.message);
        return { success: true, fallback: true };
    }
}

export async function verifyCode(email: string, code: string): Promise<{ valid: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // 1. Intentar validar en la base de datos si está conectada
    try {
        await ensureDatabaseSchema();
        const [rows] = await pool.execute<RowDataPacket[]>(
            "SELECT id, expires_at FROM email_verifications WHERE email = ? AND code = ? ORDER BY id DESC LIMIT 1",
            [cleanEmail, cleanCode]
        );

        if (rows.length > 0) {
            const expiresAt = new Date(rows[0].expires_at).getTime();
            if (Date.now() > expiresAt) {
                return { valid: false, error: "El código ha expirado. Por favor solicita uno nuevo." };
            }
            return { valid: true };
        }
    } catch (dbErr: any) {
        console.warn("[VerificationStore] Fallback a memoria al verificar código:", dbErr?.code || dbErr?.message);
    }

    // 2. Fallback: validar contra memoria del servidor
    const stored = memoryStore.get(cleanEmail);
    if (stored) {
        if (stored.code === cleanCode) {
            if (Date.now() > stored.expiresAt) {
                return { valid: false, error: "El código ha expirado. Solicita uno nuevo." };
            }
            return { valid: true };
        }
    }

    return { valid: false, error: "El código ingresado es incorrecto." };
}

export async function deleteVerificationCode(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    memoryStore.delete(cleanEmail);
    try {
        await pool.execute("DELETE FROM email_verifications WHERE email = ?", [cleanEmail]);
    } catch {
        // Ignorar si BD está offline
    }
}
