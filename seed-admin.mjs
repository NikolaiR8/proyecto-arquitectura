import fs from "fs";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

// Cargar variables de entorno desde .env si existe
if (fs.existsSync(".env")) {
  const lines = fs.readFileSync(".env", "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function main() {
  const host = process.env.DATABASE_HOST || "localhost";
  const user = process.env.DATABASE_USER || "root";
  const password = process.env.DATABASE_PASSWORD || "dioghino123";
  const database = process.env.DATABASE_NAME || "dioghinoDB";
  const port = process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 3306;

  // Credenciales deseadas (por defecto o pasadas por argumentos)
  const adminEmail = (process.argv[2] || process.env.ADMIN_EMAIL || "admin@canchas.com").toLowerCase().trim();
  const adminPassword = process.argv[3] || process.env.ADMIN_PASSWORD || "Admin123!";

  console.log(`Conectando a MySQL en ${host}:${port}, base de datos: ${database}...`);

  try {
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port,
      ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    });

    console.log("Conexión exitosa a MySQL.");
    console.log(`Generando hash para la contraseña...`);
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const sql = `
      INSERT INTO users (first_name, last_name, password_hash, email, role)
      VALUES (
        'Administrador',
        'Sistema',
        ?,
        ?,
        'admin'
      )
      ON DUPLICATE KEY UPDATE 
        role = 'admin', 
        password_hash = VALUES(password_hash),
        first_name = 'Administrador',
        last_name = 'Sistema',
        is_banned = FALSE;
    `;

    await connection.execute(sql, [passwordHash, adminEmail]);
    console.log("✅ Usuario administrador configurado exitosamente:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: admin`);

    await connection.end();
  } catch (err) {
    console.error("❌ Error al conectar o actualizar en MySQL:", err.message);
    process.exit(1);
  }
}

main();

