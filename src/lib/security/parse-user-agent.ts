// src/lib/security/parse-user-agent.ts

import * as UAParser from "ua-parser-js";

export function parseUserAgent(ua: string) {
    const parser = new UAParser.UAParser(ua);
    const result = parser.getResult();

    return {
        browser: `${result.browser.name ?? "Unknown"} ${result.browser.version ?? ""}`,
        os: `${result.os.name ?? "Unknown"} ${result.os.version ?? ""}`,
        device: result.device.type ?? "desktop",
    };
}



