// src/app/page.tsx

import LoggedHome from "@/components/custom/loggedHome";
import auth from "@/auth";
import NoLoggedHome from "@/components/custom/noLoggedHome";
// import ShareButton from "@/components/custom/shareButton"; // lo dejamos comentado por ahora

export default async function HomePage() {
  const session = await auth();

  return (
    <div
      id="HomePage"
      className="
        flex 
        flex-col 
        min-h-[calc(100vh-3.5rem)]  /* aprox alto disponible bajo la navbar en mobile */
        md:min-h-[calc(100vh-4rem)]
        text-slate-100
      "
    >
      {/* Si querés reactivar el botón de compartir más adelante */}
      {/* <div className="mb-2">
        <ShareButton />
      </div> */}

      {session ? (
        <LoggedHome session={session} />
      ) : (
        <section className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-sm md:text-base text-slate-300">
            No hay sesión iniciada.
          </p>
          <NoLoggedHome />
        </section>
      )}
    </div>
  );
}


