"use client";

import React, { useState, useTransition, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitContactForm } from "@/actions/contact";
import { Loader2, Mail, CheckCircle2, MessageSquare, Globe, Building2, Send } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
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

// ─── Inner form (must be inside the provider) ────────────────────────────────
function ContactForm() {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      setSuccess(null);
      startTransition(async () => {
        if (!executeRecaptcha) {
          setError("reCAPTCHA is not ready. Please try again in a moment.");
          return;
        }

        const recaptchaToken = await executeRecaptcha("contact_form");

        const res = await submitContactForm({ ...data, recaptchaToken });
        if (res.success) {
          setSuccess(res.message || "Message sent!");
          reset();
        } else {
          setError(res.error || "Failed to send message.");
        }
      });
    },
    [executeRecaptcha, reset]
  );

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-[88rem] mx-auto px-6 py-20 md:py-28 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, type: "spring" }}
          className="text-center max-w-2xl mx-auto mb-16 space-y-5"
        >
          <div className="inline-block bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-[0_0_20px_-5px_rgba(var(--primary-rgb,100,120,255),0.4)]">
            Support &amp; Sales
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.15]">
            Get in touch <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
              with our team
            </span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mt-4">
            Questions about LoopNode, custom enterprise requirements, or onboarding? Send us a
            message — we typically reply within one business day.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch max-w-6xl mx-auto">
          {/* Contact Information Cards */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, type: "spring", delay: 0.1 }}
            className="lg:col-span-5 flex flex-col gap-6 h-full"
          >
            <div className="flex-1 bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-white/20 hover:bg-card/60 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Our support engineering team responds to all inquiries within 24 hours. Use the form
                to reach us directly.
              </p>
              <div className="text-sm font-semibold text-primary"><a href="mailto:loopenode@gmail.com">loopenode@gmail.com</a></div>
            </div>

            <div className="flex-1 bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-white/20 hover:bg-card/60 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2">Agency &amp; Enterprise</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Managing more than 50 websites? Need custom audit intervals, SAML SSO, or dedicated
                onboarding? Mention your scale in the form and we'll schedule a discovery call.
              </p>
            </div>

         
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, type: "spring", delay: 0.2 }}
            className="lg:col-span-7 h-full bg-card/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col justify-center"
          >
            {/* Subtle inner glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none -z-10" />

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 px-4"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Message Received</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                  {success}
                </p>
                <Button
                  onClick={() => setSuccess(null)}
                  variant="outline"
                  className="rounded-xl h-12 px-6 border-white/10 hover:bg-white/5 uppercase tracking-widest text-xs font-bold"
                >
                  Send another message
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight mb-2">Send a message</h2>
                  <p className="text-sm text-muted-foreground">
                    Fill out the form below and we'll get back to you shortly.
                  </p>
                </div>

                {error && (
                  <Alert
                    variant="destructive"
                    className="bg-rose-500/10 border-rose-500/20 text-rose-400"
                  >
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="name"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      Your name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Sarah Connor"
                      disabled={isPending}
                      aria-invalid={!!errors.name}
                      {...register("name")}
                      className="h-12 bg-black/40 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary rounded-xl"
                    />
                    {errors.name && (
                      <p className="text-xs text-rose-400 font-medium">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label
                      htmlFor="email"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      disabled={isPending}
                      aria-invalid={!!errors.email}
                      {...register("email")}
                      className="h-12 bg-black/40 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary rounded-xl"
                    />
                    {errors.email && (
                      <p className="text-xs text-rose-400 font-medium">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="subject"
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    placeholder="How can we help?"
                    disabled={isPending}
                    aria-invalid={!!errors.subject}
                    {...register("subject")}
                    className="h-12 bg-black/40 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary rounded-xl"
                  />
                  {errors.subject && (
                    <p className="text-xs text-rose-400 font-medium">{errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="message"
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    rows={6}
                    placeholder="Tell us about your portfolio, team size, or what you're looking to solve..."
                    disabled={isPending}
                    aria-invalid={!!errors.message}
                    {...register("message")}
                    className="resize-none bg-black/40 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary rounded-xl py-3"
                  />
                  {errors.message && (
                    <p className="text-xs text-rose-400 font-medium">{errors.message.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-14 rounded-xl text-sm font-bold uppercase tracking-widest shadow-[0_0_20px_-5px_rgba(var(--primary-rgb,100,120,255),0.4)] hover:shadow-[0_0_30px_-5px_rgba(var(--primary-rgb,100,120,255),0.6)] transition-all"
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending message...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Send request
                      <Send className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Page: wraps the form in the reCAPTCHA provider ──────────────────────────
export default function ContactPage() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;

  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      <ContactForm />
    </GoogleReCaptchaProvider>
  );
}
