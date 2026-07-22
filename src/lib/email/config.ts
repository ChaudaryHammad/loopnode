import { env } from "@/lib/env";

export function getAppUrl(): string {
  return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

export function formatFromAddress(from: string): string {
  if (from.includes("<") && from.includes(">")) return from;
  return `Health Mesh <${from}>`;
}

export function getEmailFrom(): string {
  return formatFromAddress(env.EMAIL_FROM.trim());
}

export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL ?? env.EMAIL_FROM;
}

export function getSmtpConfig() {
  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  };
}
