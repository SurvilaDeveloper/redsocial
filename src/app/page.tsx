//src/app/page,tsx
import LoggedHome from "@/components/custom/loggedHome";
import NoLoggedHome from "@/components/custom/noLoggedHome";
import { getValidatedSession } from "@/lib/auth/getValidatedSession";
import Navbar from "@/components/custom/navbar";

export default async function HomePage() {
  const result = await getValidatedSession();

  return (
    <div
      id="HomePage"
      className="
                flex flex-col
                min-h-[calc(100vh-3.5rem)]
                md:min-h-[calc(100vh-4rem)]
                text-slate-100
                w-full
                md:max-w-[33%]
                md:min-w-[400px]
                md:w-full
            "
    >
      <Navbar />
      {result.status === "ok" ? (
        <LoggedHome session={result.session} />
      ) : (
        <section className="flex-1 flex flex-col items-center justify-center gap-3">
          {result.status === "forced_logout" ? (
            <p className="text-sm md:text-base text-amber-300">
              Tu cuenta fue forzada a cerrar sesión.
              Debés volver a iniciar sesión.
            </p>
          ) : (
            <p className="text-sm md:text-base text-slate-300">
              No hay sesión iniciada o la cuenta está desactivada.
            </p>
          )}

          <NoLoggedHome />
        </section>
      )}
    </div>
  );
}
