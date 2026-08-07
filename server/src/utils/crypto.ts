// Crypto utils
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import crypto from "crypto";
import { env } from "../config/env.js";

const NANOID_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const generateToken = (length: number = 12): string => {
  const nanoid = customAlphabet(NANOID_ALPHABET, length);
  return nanoid();
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateSignedUrl = (path: string, expiresInSeconds: number): string => {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const data = `${path}:${expires}`;
  
  const signature = crypto
    .createHmac("sha256", env.SIGNED_URL_SECRET)
    .update(data)
    .digest("hex");
    
  return `${path}?expires=${expires}&signature=${signature}`;
};

export const verifySignedUrl = (url: string, expires: number, signature: string): boolean => {
  if (Date.now() / 1000 > expires) {
    return false;
  }
  
  // Extract path from url
  const path = url.split("?")[0];
  const data = `${path}:${expires}`;
  
  const expectedSignature = crypto
    .createHmac("sha256", env.SIGNED_URL_SECRET)
    .update(data)
    .digest("hex");
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
