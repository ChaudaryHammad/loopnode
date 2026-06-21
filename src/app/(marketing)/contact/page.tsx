"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitContactForm } from "@/actions/contact";
import { Loader2, Mail, Phone, MapPin, CheckCircle2, MessageSquare } from "lucide-react";
import { z } from "zod";

const contactValidation = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(3, "Subject must be at least 3 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

export default function ContactPage() {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const onSubmit = (data: any) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await submitContactForm(data);
      if (res.success) {
        setSuccess(res.message || "Message sent!");
        reset();
      } else {
        setError(res.error || "Failed to send message.");
      }
    });
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 select-none">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
          Get in Touch
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Have questions about our audits, pricing, or custom scanning needs? Reach out, and our support team will reply within 24 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Contact details */}
        <div className="lg:col-span-5 space-y-8 bg-card border border-border/30 rounded-3xl p-8">
          <h3 className="text-xl font-bold text-foreground mb-4">Contact Information</h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Email support</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">support@healthmonitor.dev</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Phone support</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">+1 (555) 902-8833</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Office location</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">San Francisco, CA 94103</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="lg:col-span-7 bg-card border border-border/30 rounded-3xl p-8">
          {success ? (
            <div className="text-center py-10 px-4 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-center mb-4 text-green-500">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Message Dispatched</h3>
              <p className="text-sm text-muted-foreground mb-6">{success}</p>
              <button
                onClick={() => setSuccess(null)}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/95 transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    disabled={isPending}
                    className={`w-full px-4 py-2.5 rounded-xl bg-secondary/30 border ${
                      errors.name ? "border-destructive" : "border-border/40"
                    } text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/80 focus:ring-2 focus:ring-primary/20 disabled:opacity-50`}
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive mt-1">{errors.name.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="jane@example.com"
                    disabled={isPending}
                    className={`w-full px-4 py-2.5 rounded-xl bg-secondary/30 border ${
                      errors.email ? "border-destructive" : "border-border/40"
                    } text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/80 focus:ring-2 focus:ring-primary/20 disabled:opacity-50`}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1">{errors.email.message as string}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="How can we help you?"
                  disabled={isPending}
                  className={`w-full px-4 py-2.5 rounded-xl bg-secondary/30 border ${
                    errors.subject ? "border-destructive" : "border-border/40"
                  } text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/80 focus:ring-2 focus:ring-primary/20 disabled:opacity-50`}
                  {...register("subject")}
                />
                {errors.subject && (
                  <p className="text-xs text-destructive mt-1">{errors.subject.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Message Details
                </label>
                <textarea
                  rows={5}
                  placeholder="Explain your inquiries or issues here..."
                  disabled={isPending}
                  className={`w-full px-4 py-2.5 rounded-xl bg-secondary/30 border ${
                    errors.message ? "border-destructive" : "border-border/40"
                  } text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/80 focus:ring-2 focus:ring-primary/20 disabled:opacity-50 resize-none`}
                  {...register("message")}
                />
                {errors.message && (
                  <p className="text-xs text-destructive mt-1">{errors.message.message as string}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting form...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
