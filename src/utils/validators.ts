import crypto, { BinaryLike } from "crypto";
import dotenv from 'dotenv';
dotenv.config();

const HMAC_SECRET = process.env.HASH_SECRET?.toString();

export const passwordValidation = (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
    return passwordRegex.test(password);
}

export function generateOtpPlain(digits = 6): string {
    if (!Number.isInteger(digits) || digits <= 0) digits = 6;
    const max = 10 ** digits;
    const n = crypto.randomInt(0, max);
    return String(n).padStart(digits, "0");
}

export function hashValue(value: string): string {
    if (value == null) throw new Error("hashValue: value is required to convert into hash");
    return crypto.createHmac("sha256", HMAC_SECRET as BinaryLike).update(value).digest("hex");
}