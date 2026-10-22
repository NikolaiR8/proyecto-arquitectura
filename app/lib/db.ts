import mysql from "mysql2/promise"

export const pool = process.env.DATABASE_URL
    ? mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: 10,
        waitForConnections: true,
        dateStrings: true,
        ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
    })
    : mysql.createPool({
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 3306,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        connectionLimit: 10,
        waitForConnections: true,
        dateStrings: true,
        ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });

let schemaEnsured = false;
let schemaPromise: Promise<void> | null = null;

export async function ensureDatabaseSchema() {
    if (schemaEnsured) return;
    if (schemaPromise) return schemaPromise;

    schemaPromise = (async () => {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS email_verifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    code VARCHAR(10) NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_email (email)
                );
            `);

            // Obtener columnas de la tabla users
            const [colsResult] = await pool.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
            );
            const cols = (colsResult as Array<{ COLUMN_NAME: string }>).map(c => c.COLUMN_NAME.toLowerCase());
            const colsSet = new Set(cols);

            const migrations: { name: string; sql: string }[] = [
                { name: "avatar_url", sql: "ALTER TABLE users ADD COLUMN avatar_url LONGTEXT DEFAULT NULL" },
                { name: "phone", sql: "ALTER TABLE users ADD COLUMN phone VARCHAR(32) DEFAULT NULL" },
                { name: "bio", sql: "ALTER TABLE users ADD COLUMN bio VARCHAR(255) DEFAULT NULL" },
                { name: "position", sql: "ALTER TABLE users ADD COLUMN position VARCHAR(64) DEFAULT NULL" },
                { name: "preferred_foot", sql: "ALTER TABLE users ADD COLUMN preferred_foot VARCHAR(32) DEFAULT NULL" },
                { name: "favorite_court", sql: "ALTER TABLE users ADD COLUMN favorite_court VARCHAR(64) DEFAULT NULL" },
                { name: "email_verified", sql: "ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE" }
            ];

            for (const m of migrations) {
                if (!colsSet.has(m.name)) {
                    try {
                        await pool.query(m.sql);
                        console.log(`[DB Migration] Added column: ${m.name}`);
                    } catch (e: any) {
                        // Si ya existe ignorar
                        if (!e?.message?.includes("Duplicate column name")) {
                            console.warn(`[DB Migration] Notice on column ${m.name}:`, e?.message);
                        }
                    }
                }
            }

            schemaEnsured = true;
        } catch (error) {
            console.error("[DB Migration] Error checking schema:", error);
        } finally {
            schemaPromise = null;
        }
    })();

    return schemaPromise;
}