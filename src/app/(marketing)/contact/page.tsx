"use client";

import React, { useCallback, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitContactForm } from "@/actions/contact";
import { toast } from "@/lib/toast";
import { Loader2, ArrowRight } from "lucide-react";
import { z } from "zod";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";

const contactValidation = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(3, "Subject must be at least 3 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

const fieldClass =
  "h-11 w-full rounded-[var(--ln-radius-sm)] border border-[var(--ln-line-strong)] bg-[var(--ln-surface)] px-3 text-sm text-[var(--ln-ink)] outline-none transition-colors placeholder:text-[var(--ln-faint)] focus:border-[var(--ln-ink)]/30";

function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(contactValidation),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = useCallback(
    (data: z.infer<typeof contactValidation>) => {
      startTransition(async () => {
        if (!executeRecaptcha) {
          toast.error("reCAPTCHA is not ready. Please try again in a moment.");
          return;
        }

        const recaptchaToken = await executeRecaptcha("contact_form");
        const res = await submitContactForm({ ...data, recaptchaToken });
        if (res.success) {
          toast.success(res.message || "Message sent.");
          reset();
        } else {
          toast.error(res.error || "Failed to send message.");
        }
      });
    },
    [executeRecaptcha, reset]
  );

  return (
    <div className="flex-1">
      <div className="ln-container py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ln-muted)]">
            Contact
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium tracking-tight md:text-5xl">
            Talk to the Health Mesh team.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--ln-muted)]">
            Product questions, agency needs, or onboarding help. We typically reply
            within one business day.
          </p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-8">
            <div className="border-t border-[var(--ln-line)] pt-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-faint)]">
                Email
              </p>
              <a
                href="mailto:loopenode@gmail.com"
                className="mt-3 inline-block text-sm font-medium text-[var(--ln-ink)] underline-offset-4 hover:underline"
              >
                loopenode@gmail.com
              </a>
              <p className="mt-2 text-sm text-[var(--ln-muted)]">
                Support and general inquiries.
              </p>
            </div>
            <div className="border-t border-[var(--ln-line)] pt-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-faint)]">
                Agency &amp; teams
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ln-muted)]">
                Managing many domains or need dedicated onboarding? Mention scale in
                the form and we&apos;ll follow up.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-[var(--ln-radius-lg)] border border-[var(--ln-line)] bg-[var(--ln-surface)] p-6 md:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-medium text-[var(--ln-muted)]">
                  Name
                </label>
                <input
                  id="name"
                  placeholder="Alex Rivera"
                  disabled={isPending}
                  aria-invalid={!!errors.name}
                  className={fieldClass}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-[var(--ln-alert)]">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-medium text-[var(--ln-muted)]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  disabled={isPending}
                  aria-invalid={!!errors.email}
                  className={fieldClass}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-[var(--ln-alert)]">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label htmlFor="subject" className="text-xs font-medium text-[var(--ln-muted)]">
                Subject
              </label>
              <input
                id="subject"
                placeholder="How can we help?"
                disabled={isPending}
                aria-invalid={!!errors.subject}
                className={fieldClass}
                {...register("subject")}
              />
              {errors.subject && (
                <p className="text-xs text-[var(--ln-alert)]">{errors.subject.message}</p>
              )}
            </div>

            <div className="mt-5 space-y-2">
              <label htmlFor="message" className="text-xs font-medium text-[var(--ln-muted)]">
                Message
              </label>
              <textarea
                id="message"
                rows={6}
                placeholder="Tell us what you're trying to monitor or improve."
                disabled={isPending}
                aria-invalid={!!errors.message}
                className="w-full resize-none rounded-[var(--ln-radius-sm)] border border-[var(--ln-line-strong)] bg-[var(--ln-bg)] px-3 py-3 text-sm text-[var(--ln-ink)] outline-none transition-colors placeholder:text-[var(--ln-faint)] focus:border-[var(--ln-ink)]/30"
                {...register("message")}
              />
              {errors.message && (
                <p className="text-xs text-[var(--ln-alert)]">{errors.message.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--ln-radius-sm)] bg-[var(--ln-ink)] text-sm font-medium text-white transition-colors hover:bg-[var(--ln-ink-soft)] disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send message
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;

  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      <ContactForm />
    </GoogleReCaptchaProvider>
  );
}
