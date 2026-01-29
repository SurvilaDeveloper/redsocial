//src/app/page,tsx
import LoggedHome from "@/components/custom/loggedHome";
import NoLoggedHome from "@/components/custom/noLoggedHome";
import { getValidatedSession } from "@/lib/auth/getValidatedSession";
import Navbar from "@/components/custom/navbar";
import Link from "next/link";

export default async function HomePage() {
  const validated_session = await getValidatedSession();

  return (
    <div
      id="HomePage"
      className="
                flex flex-col
                min-h-[calc(100vh-3.5rem)]
                lg:min-h-[calc(100vh-4rem)]
                text-slate-100
                w-full
                lg:max-w-[33%]
                lg:min-w-[400px]
                lg:w-full
            "
    >
      <Navbar />
      {validated_session.status === "ok" ? (
        <LoggedHome session={validated_session.session} />
      ) : (
        <section className="flex-1 flex flex-col items-center justify-center gap-3">
          {validated_session.status === "forced_logout" ? (
            <div className="flex flex-col items-center justify-center gap-6">
              <p className="text-sm lg:text-base text-amber-300">
                Tu cuenta fue forzada a cerrar sesión.<br />
                Debés volver a iniciar sesión.
              </p>
              <Link className="flex flex-row items-center justify-center p-4 bg-blue-500" href={"/login"}>Iniciar sesión</Link>
            </div>

          ) : (
            <div className="flex flex-col items-center justify-center gap-6">
              <p className="text-sm lg:text-base text-slate-300">
                No hay sesión iniciada o la cuenta está desactivada.
              </p>
              <Link href={"/login"}>Iniciar sesión</Link>
            </div>

          )}

          <NoLoggedHome />
        </section>
      )}
    </div>
  );
}
