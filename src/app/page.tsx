//src/app/page,tsx
import NoLoggedHome from "@/components/custom/noLoggedHome";
import { getValidatedSession } from "@/lib/auth/getValidatedSession";
import Navbar from "@/components/custom/navbar";
import Link from "next/link";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";
//import LastPostsList from "@/components/custom/LastPostsList";
import HomePostList from "@/components/custom/HomePostList";

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
        <div id="home-page">
          {/* Aside izquierdo */}
          <aside className="hidden lg:block w-[220px] xl:w-[260px] fixed left-0 top-0 h-full pt-12">
            <AsideLeft session={validated_session.session} />
          </aside>

          {/* Columna central */}
          <div className="w-full max-w-[720px] py-0 space-y-4 px-2 lg:px-0">
            {/* Feed home */}
            <header className="w-full py-3 lg:py-4 border-b border-slate-800 mb-2">
              <h1 className="flex flex-col items-center text-lg lg:text-2xl font-semibold w-full">
                Inicio
              </h1>
            </header>

            <HomePostList session={validated_session.session} />
          </div>

          {/* Aside derecho */}
          <aside className="hidden lg:block w-[220px] xl:w-[260px] fixed right-4 top-0 h-full pt-12">
            <AsideRight session={validated_session.session} />
          </aside>
        </div>
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
