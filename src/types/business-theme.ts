// src/types/business-theme.ts

export type ThemePresetId = "classic" //| "modern" | "bold" | "minimal";

export type BusinessThemeConfig = {
    preset: ThemePresetId;

    main: {
        bg: string;
        surface: string;
        width: string;
    };
    header: {
        bgcr: string; // header background color
        tcr: string;   //title color
        tty: string;   //title typography
        tse: string;   //title typography
        tatt: string;  //title align text
        hcr: string;   //headline color
        hty: string;   //headline typography
        htse: string;  //headline text size
        hatt: string;  //headline align text
        ccr: string;   //category color
        cty: string;   //category typography
        ctse: string;  //category text size
        catt: string;  //category align text
        bbg: string;   //button background
        bbhr: string;  //button background hover
        bcr: string;   //button color
        bty: string;   //button typography
        btse: string;  //button text size
        bbr: string;   //button border
        bbcr: string;  //button border color
        brs: string;   //button radius
        ban: string;   //button align
        bgp: string;   //button gap
        bbae: string;  //button background active
        bcae: string;  //button color active
        bbcae: string; //button border color active
    };
    components: {
        button: { variant: "solid" | "soft" | "outline" };
        card: { shadow: "none" | "sm" | "md" };
    };
    hero: {
        bgcr: string;  //hero bacground color
        br: string;    //hero border
        bcr: string;   //hero border color
        rs: string;    //hero radius
        tcr: string;   //hero title color
        tty: string;   //hero title typography
        ttse: string;  //hero title text size
        tatt: string;  //hero title align text
        scr: string;   //hero subtitle color
        sty: string;   //hero subtitle typography
        stse: string;  //hero subtitle text size
        satt: string;  //hero subtitle align text
    };
    text: {
        bgcr: string;  //text background color
        br: string;    //text border
        bcr: string;   //text border color
        rs: string;    //text radius
        tcr: string;   //text title color
        tty: string;   //text title typography
        ttsc: string;  //text title text size
        tat: string;   //text title align text
        bycr: string;  //text body color
        byty: string;  //text body typography
        bytse: string; //text body text size
        byatt: string; //text body align text
    };
    features: {
        bgcr: string;  //features bacground color
        br: string;    //features border
        bcr: string;   //features border color
        rs: string;    //features radius
        //col: string;   //features columns
        tcr: string;   //features title color
        tty: string;   //features title typography
        ttse: string;  //features title text size
        tatt: string;  //features title align text
        ibgcr: string; //features items background color
        ibr: string;   //features items border
        ibcr: string;  //features items border color
        irs: string;   //features items radius
        itcr: string;  //features items title color
        itty: string;  //features items title typography
        ittse: string; //features items title text size
        itatt: string; //features items title align text
        itxcr: string; //features text color
        itxty: string; //features text typography
        itxtse: string;//features text text size
        itxatt: string;//features text align text
    };
    gallery: {
        bgcr: string;  //gallery background color
        br: string;    //gallery border
        bcr: string;   //gallery border color
        rs: string;    //gallery radius
        tcr: string;   //gallery title color
        tty: string;   //gallery title typography
        ttse: string;  //gallery title text size
        tatt: string;  //gallery title align text
        cbcr: string;  //gallery card background color
        crs: string;   //gallery card radius
    };
    cta: {
        bgcr: string; //cta background color
        br: string; //cta border
        bcr: string; //cta border color
        rs: string; //cta radius
        ticr: string; //cta title color
        tity: string; //cta title typography
        titse: string; //cta title text size
        tiatt: string; // cta title align text
        tcr: string; //cta text color
        tty: string; //cta text typography
        ttse: string; //cta text size
        tatt: string; //cta align text

        btbdcr: string; //cta button background color
        btbdcrhv: string; // cta button background color hover
        btbr: string; // cta button border
        btbrcr: string; // cta button border color
        btrs: string; // cta button radius

        btcr: string; //cta button text color
        btty: string; //cta button text typography
        bttse: string; //cta button text text size
        btan: string; // cta button align
    };
    productive: {
        bgcr: string; //productive background color
        br: string; //productive border
        bcr: string; //productive border color
        rs: string; //productive radius
        tcr: string; //productive title color
        tty: string; //productive title typography
        yyse: string; //productive title text size
        tatt: string; //productive title align text
        itcr: string; //productive item title color
        itty: string; //productive item title typography
        itse: string; //productive item title text size
        itatt: string; //productive item align text
        itxcr: string; //productive item text color
        itxty: string; //productive item text typography
        itxtse: string; //productive item text text size
        itxatt: string; //productive item text align text
    }

};

export const THEME_PRESETS: Record<ThemePresetId, BusinessThemeConfig> = {
    classic: {
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
    },
    /*
        modern: {
            Después lo codeo
        },
    
        bold: {
            Después lo codeo
        },
    
        minimal: {
            Después lo codeo
        },*/
};

/**
 * Merge seguro: si te viene theme incompleto, lo completa con presets/classic.
 * También sirve para “aplicar preset” sin perder valores existentes (si pasás override como 2do arg).
 */

export function mergeTheme(
    base?: Partial<BusinessThemeConfig> | null,
    override?: Partial<BusinessThemeConfig> | null
): BusinessThemeConfig {
    const preset = (override?.preset ?? base?.preset ?? "classic") as ThemePresetId;
    const presetBase = THEME_PRESETS[preset] ?? THEME_PRESETS.classic;

    return {
        preset,

        main: {
            ...presetBase.main,
            ...(base?.main ?? {}),
            ...(override?.main ?? {}),
        },

        header: {
            ...presetBase.header,
            ...(base?.header ?? {}),
            ...(override?.header ?? {}),
        },

        components: {
            button: {
                ...presetBase.components.button,
                ...(base?.components?.button ?? {}),
                ...(override?.components?.button ?? {}),
            },
            card: {
                ...presetBase.components.card,
                ...(base?.components?.card ?? {}),
                ...(override?.components?.card ?? {}),
            },
        },

        hero: {
            ...presetBase.hero,
            ...(base?.hero ?? {}),
            ...(override?.hero ?? {}),
        },

        text: {
            ...presetBase.text,
            ...(base?.text ?? {}),
            ...(override?.text ?? {}),
        },

        features: {
            ...presetBase.features,
            ...(base?.features ?? {}),
            ...(override?.features ?? {}),
        },

        gallery: {
            ...presetBase.gallery,
            ...(base?.gallery ?? {}),
            ...(override?.gallery ?? {}),
        },

        cta: {
            ...presetBase.cta,
            ...(base?.cta ?? {}),
            ...(override?.cta ?? {}),
        },

        productive: {
            ...presetBase.productive,
            ...(base?.productive ?? {}),
            ...(override?.productive ?? {}),
        },
    };
}

