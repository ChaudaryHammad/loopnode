import React from "react";
import Link from "next/link";
import { LegalMailto, LegalPage } from "@/components/marketing/legal-page";

export const metadata = {
  title: "Cookie Policy",
  description:
    "How Health Mesh uses cookies and similar technologies on our website and product.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      description="This Cookie Policy explains how Health Mesh uses cookies and similar technologies when you visit our website or use the product. It should be read together with our Privacy Policy."
    >
      <section>
        <h2>1. What cookies are</h2>
        <p>
          Cookies are small text files placed on your device when you visit a website.
          They are widely used to make sites work, keep you signed in, remember
          preferences, and understand how a product is used. Similar technologies
          include local storage, pixels, and session identifiers.
        </p>
      </section>

      <section>
        <h2>2. How we use cookies</h2>
        <p>Health Mesh uses cookies and similar technologies for the following purposes:</p>

        <h3>2.1 Essential cookies</h3>
        <p>
          Required for core functionality such as authentication, security, load
          balancing, fraud prevention helpers (for example, bot checks on forms), and
          remembering cookie consent choices. These cookies are necessary to operate
          the service and generally cannot be disabled without breaking key features.
        </p>

        <h3>2.2 Preference cookies</h3>
        <p>
          Used to remember choices such as theme preference or interface settings so
          your experience remains consistent across visits.
        </p>

        <h3>2.3 Analytics cookies</h3>
        <p>
          Help us understand traffic, feature usage, and product performance so we can
          improve Health Mesh. Where required by law, we request consent before setting
          non-essential analytics cookies.
        </p>
      </section>

      <section>
        <h2>3. Cookies we commonly use</h2>
        <p>Examples include:</p>
        <ul>
          <li>
            <strong>Session / authentication cookies:</strong> keep you signed in and
            protect account access
          </li>
          <li>
            <strong>loopnode-cookie-consent:</strong> stores whether you accepted or
            declined non-essential cookies
          </li>
          <li>
            <strong>Theme or UI preference storage:</strong> remembers display settings
          </li>
          <li>
            <strong>Security / bot-protection tokens:</strong> help protect forms such
            as contact and signup flows
          </li>
        </ul>
        <p>
          Exact cookie names and durations may change as we update the product. We aim
          to keep this policy current when material changes occur.
        </p>
      </section>

      <section>
        <h2>4. Managing cookies</h2>
        <p>You can manage cookies in several ways:</p>
        <ul>
          <li>Use the Health Mesh cookie banner choices where shown</li>
          <li>Adjust browser settings to block or delete cookies</li>
          <li>Clear site data for Health Mesh in your browser privacy controls</li>
        </ul>
        <p>
          Blocking essential cookies may prevent sign-in, billing flows, or other core
          features from working correctly.
        </p>
      </section>

      <section>
        <h2>5. Third-party cookies</h2>
        <p>
          Some third-party services we use (for example, security or analytics
          providers) may set their own cookies subject to their policies. We encourage
          you to review those policies for more detail.
        </p>
      </section>

      <section>
        <h2>6. Updates</h2>
        <p>
          We may update this Cookie Policy from time to time. The “Last updated” date
          at the top of this page will reflect the latest revision. For broader privacy
          practices, see our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2>7. Contact</h2>
        <p>
          Questions about cookies: <LegalMailto /> or our{" "}
          <Link href="/contact">contact page</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
