import fs from "fs";
import path from "path";

function lighthouseLocaleSourceDir(): string | null {
  const candidate = path.join(
    process.cwd(),
    "node_modules",
    "lighthouse",
    "shared",
    "localization",
    "locales"
  );

  return fs.existsSync(path.join(candidate, "ar.json")) ? candidate : null;
}

function copyLocaleFiles(srcDir: string, destDir: string): number {
  fs.mkdirSync(destDir, { recursive: true });

  let copied = 0;
  for (const file of fs.readdirSync(srcDir)) {
    if (!file.endsWith(".json")) continue;
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    copied += 1;
  }

  return copied;
}

/**
 * Trigger.dev bundling breaks Lighthouse's import.meta.url (locales → /app/locales, root → //package.json).
 * Lighthouse is marked external in trigger.config.ts; this shim is a fallback for copied locale files.
 */
export function ensureLighthouseLocales(): void {
  const shimDir = path.join(process.cwd(), "locales");
  const shimProbe = path.join(shimDir, "ar.json");

  if (fs.existsSync(shimProbe)) {
    return;
  }

  const srcDir = lighthouseLocaleSourceDir();
  if (!srcDir) {
    // External lighthouse resolves locales from node_modules — no shim needed.
    return;
  }

  const copied = copyLocaleFiles(srcDir, shimDir);

  if (!fs.existsSync(shimProbe)) {
    throw new Error(
      `[lighthouse] Failed to copy locale files to ${shimDir} (copied ${copied} files from ${srcDir})`
    );
  }

  console.log(`[lighthouse] Prepared ${copied} locale files at ${shimDir}`);
}

export function copyLighthouseLocalesTo(targetDir: string): number {
  const srcDir = lighthouseLocaleSourceDir();
  if (!srcDir) {
    throw new Error(`[lighthouse] Locale source not found for deploy copy (cwd=${process.cwd()})`);
  }

  const copied = copyLocaleFiles(srcDir, targetDir);

  if (!fs.existsSync(path.join(targetDir, "ar.json"))) {
    throw new Error(`[lighthouse] Deploy locale copy failed for ${targetDir}`);
  }

  return copied;
}
