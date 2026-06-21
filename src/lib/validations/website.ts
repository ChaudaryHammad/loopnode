import { z } from "zod";
import { ScanFrequency } from "@prisma/client";

export const websiteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  url: z
    .string()
    .url("Please enter a valid website URL.")
    .refine(
      (val) => val.startsWith("http://") || val.startsWith("https://"),
      "URL must start with http:// or https://"
    ),
  scanFrequency: z.nativeEnum(ScanFrequency).default(ScanFrequency.MANUAL),
});

export type WebsiteFormValues = z.infer<typeof websiteSchema>;
