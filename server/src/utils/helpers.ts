// Helpers
import crypto from "crypto";

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const calculateExpiry = (minutes: number): Date => {
  return new Date(Date.now() + minutes * 60000);
};

export const hashIp = (ip: string): string => {
  return crypto.createHash("sha256").update(ip).digest("hex");
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
