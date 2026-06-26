import React from "react";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for LoopNode",
};

export default function TermsPage() {
  return (
    <div className="flex-1 max-w-4xl mx-auto px-6 py-20 md:py-28">
      <div className="space-y-4 mb-12">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="prose prose-invert prose-blue max-w-none space-y-6 text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
        <p>
          By accessing and using LoopNode ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
        </p>

        <h2 className="text-xl font-bold text-foreground">2. Description of Service</h2>
        <p>
          LoopNode provides web health monitoring tools including but not limited to Lighthouse performance audits, accessibility checks, and security header evaluations. The Service is provided "AS IS".
        </p>

        <h2 className="text-xl font-bold text-foreground">3. User Conduct</h2>
        <p>
          You agree to not use the Service to:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Upload, post, email, transmit or otherwise make available any content that is unlawful, harmful, threatening, abusive, harassing, or otherwise objectionable.</li>
          <li>Scan or audit websites that you do not own or have explicit authorization to scan.</li>
          <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground">4. Termination</h2>
        <p>
          We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </p>

        <h2 className="text-xl font-bold text-foreground">5. Changes to Terms</h2>
        <p>
          LoopNode reserves the right, at its sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
        </p>
      </div>
    </div>
  );
}
