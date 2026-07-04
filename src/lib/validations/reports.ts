import { z } from "zod";

export const generateReportSchema = z.object({
  websiteId: z.string().min(1),
  scanId: z.string().min(1),
  type: z.enum([
    "FULL_AUDIT",
    "EXECUTIVE_SUMMARY",
    "ISSUES_CSV",
    "PERFORMANCE_REPORT",
    "SEO_REPORT",
    "SECURITY_REPORT",
    "ACCESSIBILITY_REPORT",
  ]),
  customTitle: z
    .string()
    .trim()
    .max(120, "Report name must be 120 characters or less")
    .optional()
    .or(z.literal("")),
  saveToLibrary: z.boolean().default(true),
});
