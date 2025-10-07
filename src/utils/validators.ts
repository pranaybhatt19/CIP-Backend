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

const randIndex = (max: any) => crypto.randomInt(0, max);

function shuffle(arr: any) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randIndex(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generatePassword(length = 8) {
  if (length < 3) {
    throw new Error('length must be at least 3 to include letter, digit and special char');
  }

  const alpha = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const integers = "0123456789";
  const exCharacters = "!@#$%^&*_-=+";

  const all = alpha + integers + exCharacters;
  const pwdChars = [];

  pwdChars.push(alpha[randIndex(alpha.length)]);
  pwdChars.push(integers[randIndex(integers.length)]);
  pwdChars.push(exCharacters[randIndex(exCharacters.length)]);

  for (let i = pwdChars.length; i < length; i++) {
    pwdChars.push(all[randIndex(all.length)]);
  }

  return shuffle(pwdChars).join('');
}

export function calculateExperience(date: any) {
  const now = new Date();
  const start = new Date(date);

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();

  if (now.getDate() < start.getDate()) months -= 1;

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const experience = years < 0 ? 0 : +(years + months / 100).toFixed(2);
  return experience;
}