// src/app/(auth)/login/page.tsx

import LoginForm from "@/components/custom/loginForm";

const LoginPage = async ({
    searchParams,
}: {
    searchParams: Promise<{
        verified: string;
        message: string;
        emailsend: string;
        expired: string;
    }>;
}) => {
    const params = await searchParams;
    const isVerified = params.verified === "true";
    const message = params.message;
    const emailsend = params.emailsend;
    const tokenExpired = params.expired;

    return (
        <div
            id="LoginPage"
            className="w-full 
                bg-slate-900 
                text-slate-100 
                flex flex-col items-center
                pt-16 pb-10
            "
        >
            <div className="w-full max-w-md px-4">
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl shadow-2xl p-6 md:p-8">
                    <h1 className="text-2xl font-semibold mb-2 text-center">
                        Iniciar sesión
                    </h1>
                    <p className="text-xs text-slate-400 text-center mb-6">
                        Accede a tu cuenta para publicar y ver posts.
                    </p>

                    <LoginForm
                        isVerified={isVerified}
                        message={message}
                        emailsend={emailsend}
                        tokenExpired={tokenExpired}
                    />
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

