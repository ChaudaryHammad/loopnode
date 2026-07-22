import React from "react";
import Link from "next/link";
import { LegalMailto, LegalPage } from "@/components/marketing/legal-page";

export const metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern access to and use of Health Mesh’s website monitoring and audit platform.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description="These Terms of Service (“Terms”) govern your access to and use of Health Mesh’s websites, applications, and monitoring services. By creating an account or using Health Mesh, you agree to these Terms."
    >
      <section>
        <h2>1. Agreement to terms</h2>
        <p>
          These Terms form a binding agreement between you (“you,” “your,” or
          “Customer”) and Health Mesh (“Health Mesh,” “we,” “us,” or “our”). If you use
          Health Mesh on behalf of an organization, you represent that you have authority
          to bind that organization, and “you” includes that organization.
        </p>
        <p>
          If you do not agree to these Terms, do not access or use the service. Our{" "}
          <Link href="/privacy">Privacy Policy</Link> and{" "}
          <Link href="/cookies">Cookie Policy</Link> explain how we handle personal
          information and are incorporated by reference where applicable.
        </p>
      </section>

      <section>
        <h2>2. The service</h2>
        <p>
          Health Mesh provides website monitoring and audit tools that may include, without
          limitation:
        </p>
        <ul>
          <li>Uptime and availability checks</li>
          <li>SSL certificate monitoring</li>
          <li>Performance, accessibility, SEO, and security audits</li>
          <li>Coverage scans for broken pages and assets</li>
          <li>Alerting, dashboards, historical trends, and report exports</li>
        </ul>
        <p>
          Features, plan limits, check intervals, and retention periods may vary by
          subscription tier and may change as we improve the product. We may add,
          modify, or discontinue features with reasonable notice where practical.
        </p>
      </section>

      <section>
        <h2>3. Eligibility and accounts</h2>
        <p>
          You must be at least 16 years old (or the age of digital consent in your
          jurisdiction) to use Health Mesh. You agree to provide accurate account
          information and keep it up to date.
        </p>
        <p>
          You are responsible for safeguarding your login credentials and for all
          activity under your account. Notify us promptly at <LegalMailto /> if you
          suspect unauthorized access. We may suspend accounts that appear compromised
          or that violate these Terms.
        </p>
      </section>

      <section>
        <h2>4. Plans, trials, and billing</h2>
        <h3>4.1 Free trial</h3>
        <p>
          New accounts may receive a limited free trial as described on our pricing
          page. Trial access is provided so you can evaluate Health Mesh and may include
          feature or usage limits. We may modify or end trial offers at any time.
        </p>

        <h3>4.2 Paid plans</h3>
        <p>
          Paid plans are billed according to the pricing and entitlements shown at the
          time of upgrade. Unless stated otherwise, plans are monthly subscriptions
          without a long-term contract. Current plan details are available on our{" "}
          <Link href="/pricing">pricing page</Link> and in your billing settings.
        </p>

        <h3>4.3 Payment and activation</h3>
        <p>
          Health Mesh may use manual payment verification for upgrades (for example, bank
          transfer or mobile wallet). After you submit payment details and a
          transaction reference, we review the request and activate or adjust your plan
          upon successful verification. Activation timing may vary; most upgrades are
          processed within one to two business days.
        </p>
        <p>
          You are responsible for providing accurate payment references. Failed,
          incomplete, or fraudulent submissions may delay or prevent activation.
        </p>

        <h3>4.4 Changes, downgrades, and cancellation</h3>
        <p>
          You may request plan changes or cancellation through your billing settings or
          by contacting support. Unless required by law or expressly stated otherwise,
          fees already paid are non-refundable, and plan benefits continue through the
          then-current paid period where applicable.
        </p>
      </section>

      <section>
        <h2>5. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use Health Mesh for any unlawful, harmful, or abusive purpose</li>
          <li>
            Monitor, crawl, or audit websites, APIs, or systems you do not own or lack
            authorization to test
          </li>
          <li>
            Attempt to probe, scan, or attack Health Mesh infrastructure beyond normal
            product use
          </li>
          <li>
            Interfere with service availability, reverse engineer the platform except
            where permitted by law, or bypass usage limits
          </li>
          <li>
            Upload or transmit malware, or use the service to distribute spam or
            deceptive content
          </li>
          <li>
            Resell, sublicense, or provide Health Mesh as a competing hosted service
            without our prior written consent
          </li>
          <li>
            Misrepresent your identity, affiliation, or payment information
          </li>
        </ul>
        <p>
          We may investigate suspected violations and suspend or terminate access when
          we reasonably believe these Terms have been breached.
        </p>
      </section>

      <section>
        <h2>6. Your content and monitored properties</h2>
        <p>
          You retain ownership of content and configuration data you submit to Health Mesh
          (“Customer Content”), including website URLs, settings, and materials you
          upload. You grant Health Mesh a limited license to host, process, transmit, and
          display Customer Content solely to provide and improve the service.
        </p>
        <p>
          You represent that you have all rights necessary to monitor the properties you
          configure and that your use will not infringe third-party rights or violate
          applicable law, robots policies where legally relevant, or contractual
          restrictions.
        </p>
        <p>
          Monitoring results generated by Health Mesh (scores, findings, logs, and reports)
          are provided for your operational use. Shared report links you create may be
          accessible to anyone with the URL; you are responsible for how you distribute
          them.
        </p>
      </section>

      <section>
        <h2>7. Intellectual property</h2>
        <p>
          Health Mesh and its software, branding, documentation, and related materials are
          owned by Health Mesh and its licensors. These Terms do not transfer ownership of
          any Health Mesh intellectual property to you. You receive a limited,
          non-exclusive, non-transferable right to access and use the service according
          to your plan and these Terms.
        </p>
        <p>
          Feedback you provide may be used by Health Mesh to improve the product without
          obligation to you.
        </p>
      </section>

      <section>
        <h2>8. Third-party services</h2>
        <p>
          The service may rely on third-party infrastructure or tools (for example,
          hosting providers, email delivery, or bot protection). We are not responsible
          for third-party services outside our reasonable control. Your use of
          third-party services may be subject to their own terms.
        </p>
      </section>

      <section>
        <h2>9. Service availability and changes</h2>
        <p>
          We aim to keep Health Mesh reliable, but we do not guarantee uninterrupted or
          error-free operation. Monitoring depends on network conditions, target-site
          availability, third-party systems, and other factors outside our control.
          Scheduled maintenance, incidents, or force majeure events may temporarily
          affect access.
        </p>
        <p>
          Audit and monitoring results are informational tools to help you understand
          website health. They are not a warranty that a site is secure, compliant,
          accessible, or free of defects.
        </p>
      </section>

      <section>
        <h2>10. Disclaimers</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOOPNODE IS PROVIDED “AS IS” AND “AS
          AVAILABLE,” WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR
          STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
        </p>
        <p>
          We do not warrant that monitoring checks will detect every issue, that alerts
          will always be delivered without delay, or that recommendations will be
          complete or suitable for your specific environment.
        </p>
      </section>

      <section>
        <h2>11. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOOPNODE AND ITS AFFILIATES,
          OFFICERS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY
          LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS INTERRUPTION, ARISING
          OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
        </p>
        <p>
          OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE TERMS
          OR THE SERVICE WILL NOT EXCEED THE AMOUNTS YOU PAID TO LOOPNODE FOR THE
          SERVICE IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE
          CLAIM. IF YOU USE ONLY A FREE TRIAL OR FREE FEATURES, OUR TOTAL LIABILITY
          WILL NOT EXCEED ONE HUNDRED U.S. DOLLARS (US $100).
        </p>
        <p>
          Some jurisdictions do not allow certain limitations; in those cases, the
          limitation applies to the fullest extent permitted.
        </p>
      </section>

      <section>
        <h2>12. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless Health Mesh and its affiliates
          from and against claims, damages, losses, and expenses (including reasonable
          attorneys’ fees) arising out of or related to: (a) your misuse of the
          service; (b) your monitoring of properties without authorization; (c) your
          Customer Content; or (d) your violation of these Terms or applicable law.
        </p>
      </section>

      <section>
        <h2>13. Suspension and termination</h2>
        <p>
          You may stop using Health Mesh at any time and may request account closure by
          contacting support. We may suspend or terminate access immediately if you
          breach these Terms, fail to complete required payment verification for a paid
          plan, create risk to the platform or other users, or if we discontinue the
          service.
        </p>
        <p>
          Upon termination, your right to access the service ends. Provisions that by
          nature should survive (including ownership, disclaimers, limitations of
          liability, and indemnity) will survive termination.
        </p>
      </section>

      <section>
        <h2>14. Changes to these terms</h2>
        <p>
          We may update these Terms from time to time. The “Last updated” date will
          change when revisions are published. For material changes, we may provide
          additional notice through the website, dashboard, or email. Continued use
          after the effective date constitutes acceptance of the updated Terms.
        </p>
      </section>

      <section>
        <h2>15. Governing law</h2>
        <p>
          These Terms are governed by the laws applicable in the jurisdiction where
          Health Mesh primarily operates, without regard to conflict-of-law principles,
          unless mandatory local consumer protections provide otherwise. Courts in that
          jurisdiction will have exclusive venue for disputes arising from these Terms,
          except where prohibited by law.
        </p>
      </section>

      <section>
        <h2>16. Miscellaneous</h2>
        <ul>
          <li>
            <strong>Entire agreement:</strong> these Terms, together with referenced
            policies and plan details, are the entire agreement regarding the service
          </li>
          <li>
            <strong>Severability:</strong> if a provision is unenforceable, the
            remaining provisions remain in effect
          </li>
          <li>
            <strong>No waiver:</strong> failure to enforce a provision is not a waiver
            of future enforcement
          </li>
          <li>
            <strong>Assignment:</strong> you may not assign these Terms without our
            consent; we may assign them in connection with a merger, acquisition, or
            sale of assets
          </li>
          <li>
            <strong>Notices:</strong> we may notify you via email, dashboard message,
            or website posting
          </li>
        </ul>
      </section>

      <section>
        <h2>17. Contact</h2>
        <p>
          Questions about these Terms: <LegalMailto /> or our{" "}
          <Link href="/contact">contact page</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
