import React from "react";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for LoopNode",
};

export default function PrivacyPage() {
  return (
    <div className="flex-1 max-w-4xl mx-auto px-6 py-20 md:py-28">
      <div className="space-y-4 mb-12">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="prose prose-invert prose-blue max-w-none space-y-6 text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, and other information you choose to provide.
        </p>
        <p>
          When you sign up or sign in, we automatically collect your IP address and derive an approximate location (such as country and city) from it. We use this information for analytics, fraud prevention, security monitoring, and to understand where our users are located. We do not collect precise GPS location from your device unless you explicitly grant permission in your browser.
        </p>

        <h2 className="text-xl font-bold text-foreground">2. Use of Information</h2>
        <p>
          We may use the information we collect about you to:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Provide, maintain, and improve our Services;</li>
          <li>Send you technical notices, updates, security alerts and support and administrative messages;</li>
          <li>Respond to your comments, questions and requests and provide customer service;</li>
          <li>Communicate with you about products, services, offers, promotions, rewards, and events offered by LoopNode and others, and provide news and information we think will be of interest to you.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground">3. Sharing of Information</h2>
        <p>
          We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>With third party vendors, consultants and other service providers who need access to such information to carry out work on our behalf;</li>
          <li>In response to a request for information by a competent authority if we believe disclosure is in accordance with, or is otherwise required by, any applicable law, regulation, or legal process;</li>
          <li>With law enforcement officials, government authorities, or other third parties if we believe your actions are inconsistent with our User agreements, Terms of Service, or policies, or to protect the rights, property, or safety of LoopNode or others.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground">4. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Statement, please contact us at <a href="mailto:loopenode@gmail.com">loopenode@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
