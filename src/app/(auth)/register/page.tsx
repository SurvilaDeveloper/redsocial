// src/app/(auth)/register/page.tsx

import RegisterForm from "@/components/custom/registerForm";

const RegisterPage = () => {
    return (
        <div
            id="RegisterPage"
            className="
                min-h-screen w-full 
                bg-slate-900 
                text-slate-100 
                flex flex-col items-center
                pt-16 pb-10
            "
        >
            <div className="w-full max-w-md px-4">
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl shadow-2xl p-6 md:p-8">
                    <h1 className="text-2xl font-semibold mb-2 text-center">
                        Crear cuenta
                    </h1>
                    <p className="text-xs text-slate-400 text-center mb-6">
                        Regístrate para poder publicar, comentar y seguir a otros usuarios.
                    </p>

                    <RegisterForm />
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
