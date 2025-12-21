// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "./images_sample.css";
import Navbar from "@/components/custom/navbar";
import Main from "../components/custom/main";
import ClientSessionProvider from "./sessionprovider";
import { GlobalProvider } from "@/context/globalcontext";

export const metadata: Metadata = {
  title: "Red Social",
  description: "Red Social con autenticación de usuarios.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body
        className="
          h-full 
          bg-slate-950 
          text-slate-100 
          antialiased 
          selection:bg-blue-500/40 
          selection:text-white
        "
      >
        <GlobalProvider>
          <ClientSessionProvider>
            {/* Contenedor principal de la app */}
            <div className="min-h-screen flex flex-col">
              <Navbar />
              {/* Main se encarga del layout interno de cada página */}
              <Main>
                {children}
              </Main>
            </div>
          </ClientSessionProvider>
        </GlobalProvider>
      </body>
    </html>
  );
}

