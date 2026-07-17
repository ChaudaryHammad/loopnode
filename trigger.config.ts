import { config } from "dotenv";
import { defineConfig } from "@trigger.dev/sdk";
import { additionalFiles } from "@trigger.dev/build/extensions/core";
import { puppeteer } from "@trigger.dev/build/extensions/puppeteer";
import { lighthouseLocalesExtension } from "./src/trigger/build/lighthouse-locales-extension";

config({ path: ".env.local" });
config({ path: ".env" });

const project = "proj_fhfifebhcrnfuorabfit";

if (!project) {
  throw new Error(
    "TRIGGER_PROJECT_REF is missing. Add it to .env.local (Trigger.dev dashboard → your project → Settings)."
  );
}

/** Env vars required by Trigger.dev tasks (audits, uptime, DB, scanners, email). */
const TASK_ENV_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NODE_ENV",
  "NEXT_PUBLIC_APP_URL",
  "USE_TRIGGER_DEV",
  "TRIGGER_SECRET_KEY",
  "TRIGGER_PROJECT_REF",
  "PUPPETEER_EXECUTABLE_PATH",
  "EMAIL_FROM",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "NEXT_PUBLIC_CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

function taskEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const key of TASK_ENV_KEYS) {
    const value = process.env[key];
    if (value) env[key] = value;
  }
  return env;
}

export default defineConfig({
  project,
  runtime: "node",
  logLevel: "log",
  maxDuration: 300,
  dirs: ["./src/trigger"],
  deploy: {
    env: taskEnv(),
  },
  build: {
    // Lighthouse uses import.meta.url for package root + locales; bundling breaks paths (//package.json).
    external: ["lighthouse", "chrome-launcher", "lighthouse-logger"],
    extensions: [
      puppeteer(),
      lighthouseLocalesExtension(),
      additionalFiles({ files: ["node_modules/axe-core/axe.min.js"] }),
    ],
  },
});
