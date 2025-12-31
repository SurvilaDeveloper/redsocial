// src/lib/security/device-fingerprint.ts

import crypto from "crypto";
import * as UAParser from "ua-parser-js";

type DeviceFingerprintInput = {
    userAgent: string;
};

export function generateDeviceHash({ userAgent }: DeviceFingerprintInput) {
    const ua = new UAParser.UAParser(userAgent).getResult();

    const browser = ua.browser.name ?? "unknown-browser";
    const os = ua.os.name ?? "unknown-os";
    const deviceType = ua.device.type ?? "desktop";

    const rawFingerprint = [
        browser,
        os,
        deviceType,
    ].join("|");

    return crypto
        .createHash("sha256")
        .update(rawFingerprint)
        .digest("hex");
}


