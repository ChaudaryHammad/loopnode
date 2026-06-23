import type { BrokenLinkFinding, WwwFallbackResolution } from "./types";

export class ScanCancelledError extends Error {
  findings: BrokenLinkFinding[];
  wwwFallbacks: WwwFallbackResolution[];

  constructor(
    findings: BrokenLinkFinding[] = [],
    wwwFallbacks: WwwFallbackResolution[] = []
  ) {
    super("Scan halted by user");
    this.name = "ScanCancelledError";
    this.findings = findings;
    this.wwwFallbacks = wwwFallbacks;
  }
}
