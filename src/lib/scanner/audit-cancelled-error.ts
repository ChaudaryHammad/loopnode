export class AuditCancelledError extends Error {
  constructor(message = "Audit halted by user") {
    super(message);
    this.name = "AuditCancelledError";
  }
}
