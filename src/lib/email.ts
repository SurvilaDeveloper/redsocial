// src/lib/email.ts

import { Resend } from "resend"

//console.log("process.env.AUTH_RESEND_KEY: ", process.env.AUTH_RESEND_KEY);

const resend = new Resend(process.env.AUTH_RESEND_KEY);
const emailProvisorio = "surviladeveloper@gmail.com" ///////////// PROVISORIO

export const sendEmailVerification = async (name: string, email: string, token: string) => {
    //console.log("sendEmailVerification ejecutandose....");
    try {

        const emailResponse = await resend.emails.send({
            from: "RedSocial <onboarding@resend.dev>",
            to: emailProvisorio, // cambiar por email
            subject: "Verificá tu email",
            html: `
            <h1>Hello ${name}</h1>
            <p>Please verify your email by clicking on the following link:
            <a href="${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}&email=${email}">Verify Email</a></p>`
        })

        //console.log("emailResponse: ", emailResponse);

        return {
            success: true
        }

    } catch (error) {
        console.log(error);
        return {
            error: true
        }
    }
};

export async function sendPasswordChangeEmail({
    email,
    token,
}: {
    email: string;
    token: string;
}) {
    console.log("📧 Enviando email a:", emailProvisorio);
    console.log("🔐 Token:", token);
    const confirmUrl = `${process.env.NEXTAUTH_URL}/account/confirm-password?token=${token}`;
    console.log("🔗 URL:", confirmUrl);
    const res = await resend.emails.send({
        from: "RedSocial <onboarding@resend.dev>",
        to: emailProvisorio, // cambiar por email
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
    console.log("📬 Resend response:", res);
}


export const sendPasswordHasBeenChangedEmail = async (name: string, email: string) => {
    //console.log("sendEmailVerification ejecutandose....");
    try {

        const emailResponse = await resend.emails.send({
            from: "RedSocial <onboarding@resend.dev>",
            to: emailProvisorio, // cambiar por email
            subject: "Cambio de contraseña exitoso",
            html: `
            <h1>Hello ${name}</h1>
            <p>La contraseña ha cambiado</p>`
        })
        return {
            success: true
        }

    } catch (error) {
        console.log(error);
        return {
            error: true
        }
    }
};