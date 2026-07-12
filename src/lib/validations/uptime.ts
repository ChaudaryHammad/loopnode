import { z } from "zod";
import { KeywordMatchMode, MonitorHttpMethod } from "@prisma/client";
import { normalizeWebsiteUrl } from "@/lib/website-host";
import { UPTIME_INTERVAL_OPTIONS } from "@/lib/uptime/constants";

const intervalValues = UPTIME_INTERVAL_OPTIONS.map((o) => o.seconds) as [number, ...number[]];

export const uptimeMonitorSchema = z
  .object({
    websiteId: z.string().min(1),
    enabled: z.boolean().default(true),
    paused: z.boolean().default(false),
    url: z
      .string()
      .trim()
      .min(1, "Enter a URL to monitor.")
      .superRefine((val, ctx) => {
        if (!normalizeWebsiteUrl(val)) {
          ctx.addIssue({ code: "custom", message: "Enter a valid URL." });
        }
      })
      .transform((val) => normalizeWebsiteUrl(val) as string),
    method: z.nativeEnum(MonitorHttpMethod).default(MonitorHttpMethod.GET),
    expectedStatusMin: z.number().int().min(100).max(599).default(200),
    expectedStatusMax: z.number().int().min(100).max(599).default(399),
    intervalSeconds: z.number().int().refine((v) => intervalValues.includes(v), {
      message: "Choose a valid check interval.",
    }),
    timeoutMs: z.number().int().min(3000).max(30000).default(10000),
    followRedirects: z.boolean().default(true),
    keyword: z.string().trim().max(200).nullable().optional(),
    keywordMode: z.nativeEnum(KeywordMatchMode).default(KeywordMatchMode.NONE),
    alertEmail: z.boolean().default(true),
    alertOnRecovery: z.boolean().default(true),
    failureThreshold: z.number().int().min(1).max(5).default(2),
    slowThresholdMs: z.number().int().min(200).max(60000).nullable().optional(),
    checkSsl: z.boolean().default(true),
    sslWarnDays: z.number().int().min(1).max(90).default(14),
  })
  .superRefine((data, ctx) => {
    if (data.expectedStatusMin > data.expectedStatusMax) {
      ctx.addIssue({
        code: "custom",
        message: "Min status cannot be greater than max.",
        path: ["expectedStatusMin"],
      });
    }
    if (data.keywordMode !== KeywordMatchMode.NONE && !data.keyword?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a keyword when keyword matching is enabled.",
        path: ["keyword"],
      });
    }
    if (data.keywordMode !== KeywordMatchMode.NONE && data.method === MonitorHttpMethod.HEAD) {
      ctx.addIssue({
        code: "custom",
        message: "Keyword checks require GET method.",
        path: ["method"],
      });
    }
  });

export type UptimeMonitorFormValues = z.infer<typeof uptimeMonitorSchema>;
