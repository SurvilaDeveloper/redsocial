//src/config.ts
import { texts } from "./app/text"

export const cfg = {
    TEXTS: texts("sp"),
    verificationEmailTokenExpires: 1000 * 60 * 60, // 1 hora
    SESSION_EXPIRE_30_DAYS: 60 * 60 * 24 * 30, // 30 días
    SESSION_EXPIRE_1_DAY: 60 * 60 * 24, // 1 día
}