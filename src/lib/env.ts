import { z } from "zod";

function parseEnvBool(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

const envSchema = z
  .object({
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
    DIRECT_URL: z.string().url("DIRECT_URL must be a valid URL").optional(),

    AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
    AUTH_URL: z.string().url("AUTH_URL must be a valid URL").optional(),
    // Empty strings from .env.example are treated as unset
    AUTH_GOOGLE_ID: z
      .string()
      .optional()
      .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
    AUTH_GOOGLE_SECRET: z
      .string()
      .optional()
      .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),

    EMAIL_FROM: z.string().min(1, "EMAIL_FROM is required"),
    SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
    SMTP_PORT: z.coerce.number().int().positive("SMTP_PORT must be a positive number"),
    SMTP_USER: z.string().min(1, "SMTP_USER is required"),
    SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),

    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1, "Cloudinary cloud name is required"),
    NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().min(1, "Cloudinary API key is required"),
    CLOUDINARY_API_SECRET: z.string().min(1, "Cloudinary API secret is required"),
    CLOUDINARY_UPLOAD_PRESET: z.string().min(1, "Cloudinary upload preset is required"),

    /** Set to true to run audits via Trigger.dev instead of this server */
    USE_TRIGGER_DEV: z.string().optional(),
    TRIGGER_SECRET_KEY: z.string().optional(),
    TRIGGER_PROJECT_REF: z.string().optional(),

    NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
    /** Bearer token for Vercel Cron uptime routes. Required in production. */
    CRON_SECRET: z.string().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  })
  .superRefine((data, ctx) => {
    if (parseEnvBool(data.USE_TRIGGER_DEV) && !data.TRIGGER_SECRET_KEY?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "TRIGGER_SECRET_KEY is required when USE_TRIGGER_DEV=true",
        path: ["TRIGGER_SECRET_KEY"],
      });
    }
  });

const clientEnvSchema = z.object({
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const isServer = typeof window === "undefined";

const getEnvData = () => {
  if (isServer) {
    return {
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
      AUTH_SECRET: process.env.AUTH_SECRET,
      AUTH_URL: process.env.AUTH_URL,
      AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
      AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
      EMAIL_FROM: process.env.EMAIL_FROM,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
      USE_TRIGGER_DEV: process.env.USE_TRIGGER_DEV,
      TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
      TRIGGER_PROJECT_REF: process.env.TRIGGER_PROJECT_REF,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      CRON_SECRET: process.env.CRON_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    };
  } else {
    return {
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
    };
  }
};

const schema = isServer ? envSchema : clientEnvSchema;
const parsed = schema.safeParse(getEnvData());

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment variables. Please check your .env.local file.");
}

const serverEnv = parsed.data as z.infer<typeof envSchema>;

export const env = serverEnv;
export type EnvType = z.infer<typeof envSchema>;

/** When true, audits are queued to Trigger.dev instead of running on this machine. */
export function useTriggerDev(): boolean {
  if (!isServer) return false;
  return parseEnvBool(serverEnv.USE_TRIGGER_DEV);
}
