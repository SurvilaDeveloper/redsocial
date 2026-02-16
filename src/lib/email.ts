// src/lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.AUTH_RESEND_KEY);

// ⚠️ PROVISORIO (sacar cuando estés listo)
const EMAIL_PROVISORIO = "surviladeveloper@gmail.com";

const FROM = "RedSocial <onboarding@resend.dev>";
const BASE_URL = process.env.NEXTAUTH_URL;

/* ──────────────────────────────────────
 * 📧 Verificación de email
 * ────────────────────────────────────── */
export async function sendEmailVerification(
    name: string,
    email: string,
    token: string
) {
    try {
        await resend.emails.send({
            from: FROM,
            to: EMAIL_PROVISORIO, // cambiar por email
            subject: "Verificá tu email",
            html: `
                <h1>Hola ${name}</h1>
                <p>Por favor verificá tu email haciendo click en el siguiente enlace:</p>
                <p>
                    <a href="${BASE_URL}/api/auth/verify-email?token=${token}&email=${email}">
                        Verificar email
                    </a>
                </p>
            `,
        });

        return { success: true };
    } catch (error) {
        console.error("sendEmailVerification error:", error);
        return { error: true };
    }
}

/* ──────────────────────────────────────
 * 🔐 Confirmación cambio de contraseña
 * ────────────────────────────────────── */
export async function sendPasswordChangeEmail({
    email,
    token,
}: {
    email: string;
    token: string;
}) {
    const confirmUrl = `${BASE_URL}/account/confirm-password?token=${token}`;

    try {
        await resend.emails.send({
            from: FROM,
            to: EMAIL_PROVISORIO, // cambiar por email
            subject: "Confirmá el cambio de contraseña",
            html: `
                <h2>Cambio de contraseña</h2>
                <p>Se solicitó un cambio de contraseña para tu cuenta.</p>
                <p>
                    <a href="${confirmUrl}"
                       style="display:inline-block;padding:10px 16px;
                              background:#10b981;color:#fff;
                              text-decoration:none;border-radius:6px">
                        Confirmar cambio
                    </a>
                </p>
                <p>Este link expira en 1 hora.</p>
                <p>Si no fuiste vos, ignorá este email.</p>
            `,
        });

        return { success: true };
    } catch (error) {
        console.error("sendPasswordChangeEmail error:", error);
        return { error: true };
    }
}

/* ──────────────────────────────────────
 * ✅ Contraseña cambiada
 * ────────────────────────────────────── */
export async function sendPasswordHasBeenChangedEmail(
    name: string,
    email: string
) {
    try {
        await resend.emails.send({
            from: FROM,
            to: EMAIL_PROVISORIO, // cambiar por email
            subject: "Cambio de contraseña exitoso",
            html: `
                <h1>Hola ${name}</h1>
                <p>Tu contraseña fue cambiada correctamente.</p>
                <p>Si no fuiste vos, contactá soporte de inmediato.</p>
            `,
        });

        return { success: true };
    } catch (error) {
        console.error("sendPasswordHasBeenChangedEmail error:", error);
        return { error: true };
    }
}

/* ──────────────────────────────────────
 * 🚨 Nuevo dispositivo detectado
 * ────────────────────────────────────── */
export async function sendNewDeviceAlertEmail({
    name,
    email,
    userAgent,
    ip,
    timezone,
    disableUrl,
}: {
    name: string;
    email: string;
    userAgent: string;
    ip: string;
    timezone: string;
    disableUrl: string;
}) {
    try {
        await resend.emails.send({
            from: FROM,
            to: EMAIL_PROVISORIO, // cambiar por email
            subject: "Nuevo dispositivo detectado",
            html: `
                <h2>Hola ${name}</h2>
                <p>Detectamos un inicio de sesión desde un nuevo dispositivo.</p>

                <ul>
                    <li><strong>IP:</strong> ${ip}</li>
                    <li><strong>Zona horaria:</strong> ${timezone}</li>
                    <li><strong>Dispositivo:</strong> ${userAgent}</li>
                </ul>

                <p>
                    Si fuiste vos, no necesitás hacer nada.
                </p>

                <p>
                    Si no reconocés este acceso, deshabilitá el dispositivo inmediatamente:
                </p>

                <p>
                    <a href="${disableUrl}"
                       style="display:inline-block;padding:12px 18px;
                              background:#ef4444;color:#fff;
                              text-decoration:none;border-radius:6px">
                        Deshabilitar dispositivo
                    </a>
                </p>

                <p style="margin-top:16px;font-size:12px;color:#666">
                    Este enlace expira en 15 minutos.
                </p>
            `,
        });

        return { success: true };
    } catch (error) {
        console.error("sendNewDeviceAlertEmail error:", error);
        return { error: true };
    }
}
/* ──────────────────────────────────────
 * 📴 Confirmación de revocación de dispositivo
 * ────────────────────────────────────── */
export async function sendDisableDeviceEmail({
    name,
    email,
    deviceName,
    browser,
    os,
    token,
}: {
    name: string;
    email: string;
    deviceName: string;
    browser: string;
    os: string;
    token: string;
}) {
    const confirmUrl = `${BASE_URL}/security/devices/disable?token=${token}`;

    try {
        await resend.emails.send({
            from: FROM,
            to: EMAIL_PROVISORIO, // 🔴 cambiar por email cuando saques el provisorio
            subject: "Confirmar revocación de dispositivo",
            html: `
                <h2>Hola ${name}</h2>

                <p>
                    Se solicitó la revocación del siguiente dispositivo asociado a tu cuenta:
                </p>

                <ul>
                    <li><strong>Nombre:</strong> ${deviceName}</li>
                    <li><strong>Navegador:</strong> ${browser}</li>
                    <li><strong>Sistema operativo:</strong> ${os}</li>
                </ul>

                <p>
                    Si fuiste vos, confirmá la revocación haciendo click en el botón:
                </p>

                <p>
                    <a href="${confirmUrl}"
                       style="display:inline-block;padding:12px 18px;
                              background:#ef4444;color:#fff;
                              text-decoration:none;border-radius:6px">
                        Confirmar revocación
                    </a>
                </p>

                <p style="margin-top:16px">
                    ⚠️ Si <strong>NO</strong> fuiste vos quien solicitó esto,
                    cambiá tu contraseña inmediatamente.
                </p>

                <p style="margin-top:16px;font-size:12px;color:#666">
                    Este enlace expira en 15 minutos y solo puede usarse una vez.
                </p>
            `,
        });

        return { success: true };
    } catch (error) {
        console.error("sendDisableDeviceEmail error:", error);
        return { error: true };
    }
}

/* ──────────────────────────────────────
 * 🏪 Contacto a negocio (form público)
 * ────────────────────────────────────── */

const EMAIL_PROVISORIO_ENABLED = true; // si querés, atalo a NODE_ENV luego

function getEmailTo(toOwnerEmail: string) {
    // Mantiene tu forma de testear sin mandar emails reales.
    if (EMAIL_PROVISORIO_ENABLED && EMAIL_PROVISORIO) return EMAIL_PROVISORIO;
    return toOwnerEmail;
}

export async function sendBusinessContactEmail({
    businessName,
    toOwnerEmail,
    fromEmail,
    fromName,
    subject,
    message,
}: {
    businessName: string;
    toOwnerEmail: string;
    fromEmail: string;
    fromName?: string;
    subject?: string;
    message: string;
}) {
    try {
        await resend.emails.send({
            from: FROM,
            to: getEmailTo(toOwnerEmail),
            subject: subject?.trim()
                ? `[Contacto] ${businessName} — ${subject.trim()}`
                : `[Contacto] ${businessName}`,
            // 👇 clave: el dueño responde y va directo al visitante
            replyTo: fromEmail,
            html: `
                <h2>Nuevo contacto desde el sitio</h2>
                <p><strong>Negocio:</strong> ${escapeHtml(businessName)}</p>
                <p><strong>Nombre:</strong> ${escapeHtml(fromName ?? "-")}</p>
                <p><strong>Email:</strong> ${escapeHtml(fromEmail)}</p>
                <p><strong>Asunto:</strong> ${escapeHtml(subject ?? "-")}</p>
                <hr />
                <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
            `,
        });

        return { success: true };
    } catch (error) {
        console.error("sendBusinessContactEmail error:", error);
        return { error: true };
    }
}

// mini-escape para evitar HTML injection en el body
function escapeHtml(s: string) {
    return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
