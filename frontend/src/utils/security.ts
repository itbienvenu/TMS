import CryptoJS from "crypto-js";

// Ensure key is 256-bit (32 chars)
const RAW_KEY = import.meta.env.VITE_API_ENCRYPTION_KEY || "default_super_secret_key_change_me";
// Hash the key to ensure 32 bytes
const KEY = CryptoJS.SHA256(RAW_KEY);

export const encryptPayload = (data: any): string => {
    try {
        const json = JSON.stringify(data);
        const iv = CryptoJS.lib.WordArray.random(16);
        const encrypted = CryptoJS.AES.encrypt(json, KEY, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        // Combine IV + Ciphertext
        // We send hex encoded IV and Base64 ciphertext?
        // Or just concatenate Buffer?
        // Easiest: JSON object { iv: hex, content: base64 } or "iv_hex:ciphertext_base64"
        return iv.toString(CryptoJS.enc.Hex) + ":" + encrypted.toString();
    } catch (error) {
        console.error("Encryption failed:", error);
        throw error;
    }
};

export const decryptPayload = (payload: string): any => {
    try {
        const parts = payload.split(":");
        if (parts.length !== 2) return null;

        const iv = CryptoJS.enc.Hex.parse(parts[0]);
        const ciphertext = parts[1];

        const bytes = CryptoJS.AES.decrypt(ciphertext, KEY, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedData) return null;
        return JSON.parse(decryptedData);
    } catch (e) {
        console.error("Decryption failed", e);
        return null;
    }
}
