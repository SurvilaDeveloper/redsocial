// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "./images_sample.css";

import Main from "../components/custom/main";
import ClientSessionProvider from "./sessionprovider";
import { GlobalProvider } from "@/context/globalcontext";
import { Toaster } from "@/components/ui/toaster";

// 👉 fonts (Google)
import {
  Inter,
  Manrope,
  Poppins,
  Plus_Jakarta_Sans,
  Space_Grotesk,
  DM_Sans,
  Urbanist,
  Montserrat,
  Rubik,
  Outfit,
  Nunito_Sans,
  Lato,
  Work_Sans,
  Source_Sans_3,
  Open_Sans,
  Raleway,

  Merriweather,
  Playfair_Display,
  Lora,
  Cormorant_Garamond,
  EB_Garamond,
  Spectral,

  JetBrains_Mono,
  Fira_Code,
  Source_Code_Pro,
  IBM_Plex_Mono,
} from "next/font/google";

// --- Sans
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const rubik = Rubik({ subsets: ["latin"], variable: "--font-rubik" });

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans-3",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

// --- Serif
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant-garamond",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
});

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-spectral",
});

// --- Mono
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code-pro",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "Red Social",
  description: "Red Social con autenticación de usuarios.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={[
        "h-full",

        // sans
        inter.variable,
        manrope.variable,
        plusJakartaSans.variable,
        spaceGrotesk.variable,
        dmSans.variable,
        urbanist.variable,
        poppins.variable,
        montserrat.variable,
        rubik.variable,
        outfit.variable,
        nunitoSans.variable,
        lato.variable,
        workSans.variable,
        sourceSans3.variable,
        openSans.variable,
        raleway.variable,

        // serif
        merriweather.variable,
        playfair.variable,
        lora.variable,
        cormorantGaramond.variable,
        ebGaramond.variable,
        spectral.variable,

        // mono
        jetbrains.variable,
        firaCode.variable,
        sourceCodePro.variable,
        ibmPlexMono.variable,
      ].join(" ")}
    >
      <body
        className="
          h-full
          bg-black
          text-slate-100
          antialiased
          selection:bg-blue-500/40
          selection:text-white
        "
      >
        <GlobalProvider>
          <ClientSessionProvider>
            <div className="min-h-screen">
              <Main>
                {children}
                <Toaster />
              </Main>
            </div>
          </ClientSessionProvider>
        </GlobalProvider>
      </body>
    </html>
  );
}



