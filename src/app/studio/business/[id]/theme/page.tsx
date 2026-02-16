// src/app/studio/business/[id]/theme/page.tsx
import { notFound, redirect } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/custom/navbar";
import BusinessThemeEditor from "@/components/business/editor/BusinessThemeEditor";
import type { BusinessThemeConfig } from "@/types/business-theme";

function safeParseJson<T>(v: any, fallback: T): T {
    try {
        if (v == null) return fallback;
        if (typeof v === "string") return JSON.parse(v) as T;
        return v as T;
    } catch {
        return fallback;
    }
}

const DEFAULT_THEME: BusinessThemeConfig = {
    preset: "classic",
    main: {
        bg: "#222222",
        surface: "#333333",
        width: "80%",
    },
    header: {
        bgcr: "#111111",  // header bachground color
        tcr: "#dddddd",   //title color
        tty: "system",   //title typography
        tse: "24px",   //title text size
        tatt: "start",  //title align text
        hcr: "#dddddd",   //headline color
        hty: "system",   //headline typography
        htse: "22px",  //headline text size
        hatt: "start",  //headline align text
        ccr: "#dddddd",   //category color
        cty: "system",   //category typography
        ctse: "20px",  //category text size
        catt: "start",  //category align text
        bbg: "#444444",   //button background
        bbhr: "#555555",  //button background hover
        bcr: "#dddddd",   //button color
        bty: "system",   //button typography
        btse: "20px",  //button text size
        bbr: "1px",   //button border
        bbcr: "#dddddd",  //button border color
        brs: "8px",   //button radius
        ban: "start",  //button align
        bgp: "4px",   //button gap
        bbae: "#444444",  //button background active
        bcae: "#ffffff",  //button color active
        bbcae: "#555555", //button border color active
    },
    components: {
        button: { variant: "solid" },
        card: { shadow: "none" },
    },
    hero: {
        bgcr: "#111111",  //hero bacground color
        br: "1px",    //hero border
        bcr: "#dddddd",   //hero border color
        rs: "8px",    //hero radius
        tcr: "#dddddd",   //hero title color
        tty: "system",   //hero title typography
        ttse: "20px",  //hero title text size
        tatt: "start",  //hero title align text
        scr: "#dddddd",   //hero subtitle color
        sty: "system",   //hero subtitle typography
        stse: "18px",  //hero subtitle text size
        satt: "start",  //hero subtitle align text
    },
    text: {
        bgcr: "#111111",  //text background color
        br: "1px",    //text border
        bcr: "#dddddd",   //text border color
        rs: "8px",    //text radius
        tcr: "#dddddd",   //text title color
        tty: "system",   //text title typography
        ttsc: "20px",  //text title text size
        tat: "start",   //text title align text
        bycr: "#dddddd",  //text body color
        byty: "system",  //text body typography
        bytse: "18px", //text body text size
        byatt: "start", //text body align text
    },
    features: {
        bgcr: "#111111",  //features bacground color
        br: "1px",    //features border
        bcr: "#dddddd",   //features border color
        rs: "8px",    //features radius
        //col: "2",   //features columns
        tcr: "#dddddd",   //features title color
        tty: "system",   //features title typography
        ttse: "20px",  //features title text size
        tatt: "start",  //features title align text
        ibgcr: "#222222", //features items background color
        ibr: "1px",   //features items border
        ibcr: "#dddddd",  //features items border color
        irs: "6px",   //features items radius
        itcr: "#dddddd",  //features items title color
        itty: "system",  //features items title typography
        ittse: "18px", //features items title text size
        itatt: "start", //features items title align text
        itxcr: "#dddddd", //features text color
        itxty: "system", //features text typography
        itxtse: "16px", //features text text size
        itxatt: "start",//features text align text
    },
    gallery: {
        bgcr: "#111111",  //gallery background color
        br: "1px",    //gallery border
        bcr: "#dddddd",   //gallery border color
        rs: "8px",    //gallery radius
        tcr: "#dddddd",   //gallery title color
        tty: "system",   //gallery title typography
        ttse: "16px",  //gallery title text size
        tatt: "start",  //gallery title align text
        cbcr: "#000000",  //gallery card background color
        crs: "6px",   //gallery card radius
    },
    cta: {
        bgcr: "#111111", //cta background color
        br: "1px", //cta border
        bcr: "#dddddd", //cta border color
        rs: "8px", //cta radius
        ticr: "#dddddd", //cta title color
        tity: "system", //cta title typography
        titse: "20px", //cta title text size
        tiatt: "start", // cta title align text
        tcr: "#dddddd", //cta text color
        tty: "system", //cta text typography
        ttse: "16px", //cta text size
        tatt: "start", //cta align text

        btbdcr: "#22dd22", //cta button background color
        btbdcrhv: "#22ee22", // cta button background color hover
        btbr: "1px", // cta button border
        btbrcr: "#33ff33", // cta button border color
        btrs: "4px", // cta button radius

        btcr: "#dddddd", //cta button text color
        btty: "system", //cta button text typography
        bttse: "18px", //cta button text text size
        btan: "start", // cta button align
    },
    productive: {
        bgcr: "#111111", //productive background color
        br: "1px", //productive border
        bcr: "#dddddd", //productive border color
        rs: "8px", //productive radius
        tcr: "#dddddd", //productive title color
        tty: "system", //productive title typography
        yyse: "20px", //productive title text size
        tatt: "start", //productive title align text
        itcr: "#dddddd", //productive item title color
        itty: "system", //productive item title typography
        itse: "18px", //productive item title text size
        itatt: "start", //productive item align text
        itxcr: "#dddddd", //productive item text color
        itxty: "system", //productive item text typography
        itxtse: "16px", //productive item text text size
        itxatt: "start", //productive item text align text
    }
}

export default async function BusinessThemeStudioPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) redirect("/api/auth/signin");

    const { id } = await params;
    const businessId = Number(id);
    if (Number.isNaN(businessId)) notFound();

    const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { site: true },
    });

    if (!business || business.deletedAt != null || business.active !== 1) notFound();
    if (business.ownerId !== userId) notFound();

    const themeConfig = safeParseJson<BusinessThemeConfig>(
        business.site?.themeConfig,
        DEFAULT_THEME
    );

    return (
        <>
            <Navbar />
            <BusinessThemeEditor
                businessId={business.id}
                businessSlug={business.slug}
                businessName={business.name}
                initialTheme={themeConfig}
            />
        </>
    );
}

