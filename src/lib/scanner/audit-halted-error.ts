import { AUDIT_HALTED_MESSAGE } from "./audit-scan-control";

export class AuditHaltedError extends Error {
  constructor(message = AUDIT_HALTED_MESSAGE) {
    super(message);
    this.name = "AuditHaltedError";
  }
}

export function isAuditHaltedError(error: unknown): boolean {
  return error instanceof AuditHaltedError;
}
