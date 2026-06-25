import { existsSync } from "fs";
import puppeteer, { type Browser, type LaunchOptions } from "puppeteer";

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-extensions",
  "--disable-background-networking",
  "--disable-default-apps",
  "--disable-sync",
  "--no-first-run",
  "--mute-audio",
];

function systemChromePaths(): string[] {
  const paths: string[] = [];

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA;
    paths.push(
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
    );
    if (localAppData) {
      paths.push(`${localAppData}\\Google\\Chrome\\Application\\chrome.exe`);
    }
  } else if (process.platform === "darwin") {
    paths.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
    paths.push("/Applications/Chromium.app/Contents/MacOS/Chromium");
  } else {
    paths.push(
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser"
    );
  }

  if (process.env.CHROME_PATH) {
    paths.unshift(process.env.CHROME_PATH);
  }

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    paths.unshift(process.env.PUPPETEER_EXECUTABLE_PATH);
  }

  return paths;
}

async function resolveExecutablePath(): Promise<string | undefined> {
  try {
    const cached = await puppeteer.executablePath();
    if (cached && existsSync(cached)) return cached;
  } catch {
    // Puppeteer-managed Chrome not installed yet
  }

  return systemChromePaths().find((p) => existsSync(p));
}

export async function launchBrowser(): Promise<Browser> {
  const baseOptions: LaunchOptions = {
    headless: true,
    args: LAUNCH_ARGS,
    timeout: 30000,
  };

  const executablePath = await resolveExecutablePath();
  const options: LaunchOptions = executablePath
    ? { ...baseOptions, executablePath }
    : baseOptions;

  try {
    return await puppeteer.launch(options);
  } catch (error) {
    throw new Error(
      `Could not launch Chrome for audits. Install it with: npx puppeteer browsers install chrome` +
        (error instanceof Error ? `\n\n${error.message}` : "")
    );
  }
}
