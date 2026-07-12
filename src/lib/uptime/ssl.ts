import * as tls from "node:tls";
import { URL } from "node:url";

export interface SslInfo {
  valid: boolean;
  expiresAt: Date | null;
  daysRemaining: number | null;
  authorized: boolean;
  error?: string;
}

/** Fetch TLS certificate expiry for an HTTPS hostname (no full page download). */
export async function fetchSslInfo(rawUrl: string, timeoutMs = 8000): Promise<SslInfo> {
  let hostname: string;
  let port = 443;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") {
      return { valid: true, expiresAt: null, daysRemaining: null, authorized: true };
    }
    hostname = parsed.hostname;
    port = parsed.port ? Number(parsed.port) : 443;
  } catch {
    return { valid: false, expiresAt: null, daysRemaining: null, authorized: false, error: "Invalid URL" };
  }

  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: hostname,
        port,
        servername: hostname,
        rejectUnauthorized: false,
      },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        if (!cert || !cert.valid_to) {
          resolve({
            valid: false,
            expiresAt: null,
            daysRemaining: null,
            authorized: socket.authorized,
            error: "No certificate",
          });
          return;
        }
        const expiresAt = new Date(cert.valid_to);
        const daysRemaining = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        resolve({
          valid: daysRemaining >= 0,
          expiresAt,
          daysRemaining,
          authorized: socket.authorized,
        });
      }
    );

    socket.setTimeout(timeoutMs, () => {
      socket.destroy();
      resolve({
        valid: false,
        expiresAt: null,
        daysRemaining: null,
        authorized: false,
        error: "SSL check timed out",
      });
    });

    socket.on("error", (err) => {
      resolve({
        valid: false,
        expiresAt: null,
        daysRemaining: null,
        authorized: false,
        error: err.message,
      });
    });
  });
}
