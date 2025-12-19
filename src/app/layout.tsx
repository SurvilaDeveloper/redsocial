// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/custom/navbar";
import Main from "../components/custom/main";
import ClientSessionProvider from "./sessionprovider";
import { GlobalProvider } from "@/context/globalcontext";

export const metadata: Metadata = {
  title: "Red Social",
  description: "Red Social con autenticación de usuarios.",
  icons: {
    icon: "/favicon.ico",        // asegúrate de tener este archivo
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <GlobalProvider>
          <ClientSessionProvider>
            <Main>
              <Navbar />
              {children}
            </Main>
          </ClientSessionProvider>
        </GlobalProvider>
      </body>
    </html>
  );
}
