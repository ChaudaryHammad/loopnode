import { existsSync } from "fs";
import { execSync } from "child_process";

function hasSystemChrome() {
  const paths = [
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,

    process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : null,

    process.platform === "win32"
      ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
      : null,

    process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : null,

    process.platform === "linux"
      ? "/usr/bin/google-chrome"
      : null,
  ].filter(Boolean);

  return paths.some((p) => existsSync(p));
}

function hasPuppeteerChrome() {
  try {
    const puppeteer = await import("puppeteer");
    const path = puppeteer.executablePath?.();
    return path && existsSync(path);
  } catch {
    return false;
  }
}

/**
 * 🚀 IMPORTANT RULE:
 * Never run Chrome install on Vercel or CI environments
 */
const isVercel = process.env.VERCEL === "1";

const skip =
  isVercel ||
  process.env.SKIP_CHROME_DOWNLOAD === "1" ||
  process.env.SKIP_CHROME_DOWNLOAD === "true";

if (skip) {
  console.log("[postinstall] Skipping Chrome download (safe environment detected).");
  process.exit(0);
}

if (hasSystemChrome()) {
  console.log("[postinstall] System Chrome detected. Skipping download.");
  process.exit(0);
}

if (await hasPuppeteerChrome()) {
  console.log("[postinstall] Puppeteer Chrome already available.");
  process.exit(0);
}

console.log("[postinstall] No Chrome found. Installing Puppeteer Chrome...");
console.log("[postinstall] This only runs in local dev.");

execSync("npx puppeteer browsers install chrome", {
  stdio: "inherit",
});