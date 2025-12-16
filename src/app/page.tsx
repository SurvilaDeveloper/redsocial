import LoggedHome from "@/components/custom/loggedHome";
import { pageContainer } from "./classnames";
import auth from "@/auth";
import NoLoggedHome from "@/components/custom/noLoggedHome";
import ShareButton from "@/components/custom/shareButton";

export default async function HomePage({ children }: { children: React.ReactNode }) {
  const session = await auth(); // ⚡️ Ahora esperamos la sesión correctamente

  return (
    <div id="HomePage" className="homePage">
      {/*<ShareButton />*/}
      {/*<p>{session?.user.id}</p>*/}
      {session && (
        <>
          {/*<p>{session.user.name} está logueado </p>*/}
          <LoggedHome session={session} />
        </>
      )}
      {!session && (
        <>
          <p>No hay sesión</p>
          <NoLoggedHome />
        </>

      )}
    </div>
  );
}

