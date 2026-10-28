import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

interface SendCodeResult {
    success: boolean;
    message?: string;
}

export function generateVerificationCode(): string {
    // Código numérico de 6 dígitos aleatorio
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(
    toEmail: string,
    code: string,
    firstName?: string
): Promise<SendCodeResult> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || `"Canchas Dioguinho" <${smtpUser || "no-reply@canchasdioguinho.com"}>`;

    const recipientName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "Futbolista";

    // Salvaguarda: validar que el destinatario sea exclusivamente Gmail
    const cleanTo = (toEmail || "").trim().toLowerCase();
    if (!cleanTo.endsWith("@gmail.com") && !cleanTo.endsWith("@googlemail.com")) {
        return {
            success: false,
            message: "Únicamente se admiten correos electrónicos del dominio @gmail.com."
        };
    }

    // Si no hay configuración SMTP en producción/despliegue
    if (!smtpHost || !smtpUser || !smtpPass) {
        console.error("[MAILER ERROR] Variables SMTP no configuradas en el entorno (SMTP_HOST, SMTP_USER, SMTP_PASS).");
        return {
            success: false,
            message: "El servidor de correo no está configurado. Por favor añade las variables SMTP_HOST, SMTP_USER y SMTP_PASS en Vercel/Railway."
        };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });

        // Verificar si el archivo del logo existe para adjuntarlo como imagen inline
        const logoPath = path.join(process.cwd(), "public", "logo.png");
        const hasLogoFile = fs.existsSync(logoPath);

        const attachments = hasLogoFile ? [
            {
                filename: "logo.png",
                path: logoPath,
                cid: "canchaslogo"
            }
        ] : [];

        const logoHtml = hasLogoFile 
            ? `<img src="cid:canchaslogo" alt="Canchas Dioguinho" style="width: 88px; height: 88px; margin: 0 auto 14px auto; display: block; filter: drop-shadow(0 0 12px rgba(52,211,153,0.5));" />`
            : `<div style="font-size: 32px; margin-bottom: 8px;">⚽</div>`;

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #05070d; color: #f3f4f6; margin: 0; padding: 24px; }
                .card { max-width: 520px; margin: 0 auto; background: #0c121e; border: 1px solid #10b981; border-radius: 24px; padding: 38px 28px; text-align: center; box-shadow: 0 15px 40px rgba(0,0,0,0.8); }
                .brand { font-size: 24px; font-weight: 900; color: #34d399; letter-spacing: -0.5px; margin-bottom: 4px; text-transform: uppercase; }
                .tagline { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px; font-weight: 600; }
                .divider { border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0; }
                .code-box { background: #064e3b; border: 2px dashed #10b981; border-radius: 16px; padding: 18px 26px; margin: 24px 0; display: inline-block; box-shadow: 0 0 25px rgba(16,185,129,0.3); }
                .code { font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #ffffff; font-family: 'Courier New', Courier, monospace; }
                .instructions { font-size: 15px; color: #d1d5db; line-height: 1.6; margin: 16px 0; }
                .expiry { font-size: 13px; color: #fbbf24; margin-top: 10px; font-weight: 600; }
                .footer { font-size: 11px; color: #6b7280; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; line-height: 1.5; }
            </style>
        </head>
        <body>
            <div class="card">
                ${logoHtml}
                <div class="brand">Canchas Dioguinho</div>
                <div class="tagline">Complejo Deportivo de Fútbol 5</div>
                
                <div class="divider"></div>
                
                <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin-bottom: 8px;">¡Hola, ${recipientName}!</h2>
                <p class="instructions">
                    Gracias por registrarte en nuestra plataforma deportiva. Para confirmar tu correo y activar tu cuenta, ingresa el siguiente código de verificación:
                </p>
                
                <div class="code-box">
                    <span class="code">${code}</span>
                </div>
                
                <p class="expiry">⏱ Este código vencerá en <strong>15 minutos</strong>.</p>
                <p class="instructions" style="font-size: 12px; color: #9ca3af;">
                    Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
                </p>
                
                <div class="footer">
                    Proyecto académico desarrollado por estudiantes de Ingeniería de Software (5to Semestre)<br>
                    <strong>Universidad Laica Eloy Alfaro de Manabí (ULEAM)</strong> · 2026<br>
                    Cátedra de Arquitectura de Software
                </div>
            </div>
        </body>
        </html>
        `;

        await transporter.sendMail({
            from: smtpFrom,
            to: toEmail,
            subject: `${code} es tu código de confirmación · Canchas Dioguinho`,
            text: `Hola ${recipientName},\n\nTu código de verificación para Canchas Dioguinho es: ${code}\n\nEste código vence en 15 minutos.\n\nUniversidad Laica Eloy Alfaro de Manabí (ULEAM)`,
            html: htmlContent,
            attachments
        });

        return {
            success: true,
            message: "Correo enviado exitosamente."
        };
    } catch (error: any) {
        console.error("Error al enviar correo con nodemailer:", error);
        return {
            success: false,
            message: `Error al enviar el correo: ${error.message || "Fallo en la conexión SMTP"}`
        };
    }
}
