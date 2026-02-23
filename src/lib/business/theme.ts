// src/lib/business/theme.ts
import type { BusinessThemeConfig } from "@/types/business-theme";
import { mergeTheme } from "@/types/business-theme";
import { resolveFontFamily } from "@/lib/fonts/families";

export function themeToCssVars(raw?: Partial<BusinessThemeConfig> | null): Record<string, string> {
    const t = mergeTheme(raw ?? null);

    return {
        "--b-pr-preset": t.preset,

        // header
        "--b-hr-bbg": t.header.bbg,
        "--b-hr-bbhr": t.header.bbhr,
        "--b-hr-bcr": t.header.bcr,
        "--b-hr-bty": resolveFontFamily(t.header.bty),
        "--b-hr-btse": t.header.btse,
        "--b-hr-bbr": t.header.bbr,
        "--b-hr-bbcr": t.header.bbcr,
        "--b-hr-brs": t.header.brs,
        "--b-hr-ban": t.header.ban,
        "--b-hr-bgp": t.header.bgp,
        "--b-hr-bbae": t.header.bbae,
        "--b-hr-bcae": t.header.bcae,
        "--b-hr-bbcae": t.header.bbcae,

        // components
        "--b-cs-button-variant": t.components.button.variant,
        "--b-cs-card-shadow": t.components.card.shadow,

        // hero
        "--b-ho-bgcr": t.hero.bgcr,
        "--b-ho-br": t.hero.br,
        "--b-ho-bcr": t.hero.bcr,
        "--b-ho-rs": t.hero.rs,
        "--b-ho-tcr": t.hero.tcr,
        "--b-ho-tty": resolveFontFamily(t.hero.tty),
        "--b-ho-ttse": t.hero.ttse,
        "--b-ho-tatt": t.hero.tatt,
        "--b-ho-scr": t.hero.scr,
        "--b-ho-sty": resolveFontFamily(t.hero.sty),
        "--b-ho-stse": t.hero.stse,
        "--b-ho-satt": t.hero.satt,

        // text
        "--b-tx-bgcr": t.text.bgcr,
        "--b-tx-br": t.text.br,
        "--b-tx-bcr": t.text.bcr,
        "--b-tx-rs": t.text.rs,
        "--b-tx-tcr": t.text.tcr,
        "--b-tx-tty": resolveFontFamily(t.text.tty),
        "--b-tx-ttse": t.text.ttsc,
        "--b-tx-tatt": t.text.tat,
        "--b-tx-bycr": t.text.bycr,
        "--b-tx-byty": resolveFontFamily(t.text.byty),
        "--b-tx-bytse": t.text.bytse,
        "--b-tx-byatt": t.text.byatt,

        // features
        "--b-fs-bgcr": t.features.bgcr,
        "--b-fs-br": t.features.br,
        "--b-fs-bcr": t.features.bcr,
        "--b-fs-rs": t.features.rs,
        "--b-fs-tcr": t.features.tcr,
        "--b-fs-tty": resolveFontFamily(t.features.tty),
        "--b-fs-ttse": t.features.ttse,
        "--b-fs-tatt": t.features.tatt,
        "--b-fs-ibgcr": t.features.ibgcr,
        "--b-fs-ibr": t.features.ibr,
        "--b-fs-ibcr": t.features.ibcr,
        "--b-fs-irs": t.features.irs,
        "--b-fs-itcr": t.features.itcr,
        "--b-fs-itty": resolveFontFamily(t.features.itty),
        "--b-fs-ittse": t.features.ittse,
        "--b-fs-itatt": t.features.itatt,
        "--b-fs-itxcr": t.features.itxcr,
        "--b-fs-itxty": resolveFontFamily(t.features.itxty),
        "--b-fs-itxtse": t.features.itxtse,
        "--b-fs-itxatt": t.features.itxatt,

        // gallery
        "--b-gy-bgcr": t.gallery.bgcr,
        "--b-gy-br": t.gallery.br,
        "--b-gy-bcr": t.gallery.bcr,
        "--b-gy-rs": t.gallery.rs,
        "--b-gy-tcr": t.gallery.tcr,
        "--b-gy-tty": resolveFontFamily(t.gallery.tty),
        "--b-gy-ttse": t.gallery.ttse,
        "--b-gy-tatt": t.gallery.tatt,
        "--b-gy-cbcr": t.gallery.cbcr,
        "--b-gy-cbr": t.gallery.cbr,//card border NUEVO
        "--b-gy-cbrcr": t.gallery.cbrcr,//card border color NUEVO
        "--b-gy-crs": t.gallery.crs,

        // cta
        "--b-ca-bgcr": t.cta.bgcr,
        "--b-ca-br": t.cta.br,
        "--b-ca-bcr": t.cta.bcr,
        "--b-ca-rs": t.cta.rs,
        "--b-ca-ticr": t.cta.ticr,
        "--b-ca-tity": resolveFontFamily(t.cta.tity),
        "--b-ca-titse": t.cta.titse,
        "--b-ca-tiatt": t.cta.tiatt,
        "--b-ca-tcr": t.cta.tcr,
        "--b-ca-tty": resolveFontFamily(t.cta.tty),
        "--b-ca-ttse": t.cta.ttse,
        "--b-ca-tatt": t.cta.tatt,
        "--b-ca-btbdcr": t.cta.btbdcr,
        "--b-ca-btbdcrhv": t.cta.btbdcrhv,
        "--b-ca-btbr": t.cta.btbr,
        "--b-ca-btbrcr": t.cta.btbrcr,
        "--b-ca-btrs": t.cta.btrs,
        "--b-ca-btcr": t.cta.btcr,
        "--b-ca-btty": resolveFontFamily(t.cta.btty),
        "--b-ca-bttse": t.cta.bttse,
        "--b-ca-btan": t.cta.btan,

        // productive
        "--b-pe-bgcr": t.productive.bgcr,
        "--b-pe-br": t.productive.br,
        "--b-pe-bcr": t.productive.bcr,
        "--b-pe-rs": t.productive.rs,

        "--b-pe-cbgcr": t.productive.cbgcr,   // card background color Nuevo
        "--b-pe-cbr": t.productive.cbr,         // card border nuevo
        "--b-pe-cbrcr": t.productive.cbrcr,   // card border color Nuevo
        "--b-pe-crs": t.productive.crs, // card border radius Nuevo

        "--b-pe-tcr": t.productive.tcr,
        "--b-pe-tty": resolveFontFamily(t.productive.tty),
        "--b-pe-yyse": t.productive.yyse,
        "--b-pe-tatt": t.productive.tatt,
        "--b-pe-itcr": t.productive.itcr,
        "--b-pe-itty": resolveFontFamily(t.productive.itty),
        "--b-pe-itse": t.productive.itse,
        "--b-pe-itatt": t.productive.itatt,
        "--b-pe-itxcr": t.productive.itxcr,
        "--b-pe-itxty": resolveFontFamily(t.productive.itxty),
        "--b-pe-itxtse": t.productive.itxtse,
        "--b-pe-itxatt": t.productive.itxatt,

        // contact
        "--b-co-bgcr": t.contact.bgcr,
        "--b-co-br": t.contact.br,
        "--b-co-bcr": t.contact.bcr,
        "--b-co-rs": t.contact.rs,

        "--b-co-lcr": t.contact.lcr,
        "--b-co-lty": resolveFontFamily(t.contact.lty),
        "--b-co-ltse": t.contact.ltse,

        "--b-co-icr": t.contact.icr,
        "--b-co-ibgcr": t.contact.ibgcr,
        "--b-co-ibr": t.contact.ibr,
        "--b-co-ibcr": t.contact.ibcr,
        "--b-co-irs": t.contact.irs,
        "--b-co-ipcr": t.contact.ipcr,
        "--b-co-ifcr": t.contact.ifcr,

        "--b-co-btbg": t.contact.btbg,
        "--b-co-btbgv": t.contact.btbgv,
        "--b-co-btbr": t.contact.btbr,
        "--b-co-btbrcr": t.contact.btbrcr,
        "--b-co-btrs": t.contact.btrs,
        "--b-co-btcr": t.contact.btcr,
        "--b-co-btty": resolveFontFamily(t.contact.btty),
        "--b-co-bttse": t.contact.bttse,
        "--b-co-btan": t.contact.btan,

    };
}