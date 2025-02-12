import { Resend } from "resend"

//console.log("process.env.AUTH_RESEND_KEY: ", process.env.AUTH_RESEND_KEY);

const resend = new Resend(process.env.AUTH_RESEND_KEY);

export const sendEmailVerification = async (email: string, token: string) => {
    //console.log("sendEmailVerification ejecutandose....");
    try {
        const emailProvisorio = "surviladeveloper@gmail.com" ///////////// PROVISORIO
        const emailResponse = await resend.emails.send({
            from: "NextAuth js <onboarding@resend.dev>",
            to: emailProvisorio, // cambiar por email
            subject: "Verify your email",
            html: `
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