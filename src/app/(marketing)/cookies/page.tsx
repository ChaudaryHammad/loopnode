import React from "react";

export const metadata = {
  title: "Cookie Policy",
  description: "Cookie Policy for LoopNode",
};

export default function CookiesPage() {
  return (
    <div className="flex-1 max-w-4xl mx-auto px-6 py-20 md:py-28">
      <div className="space-y-4 mb-12">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Cookie Policy</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="prose prose-invert prose-blue max-w-none space-y-6 text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">1. What Are Cookies</h2>
        <p>
          Cookies are small text files that are placed on your computer or mobile device when you browse websites. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
        </p>

        <h2 className="text-xl font-bold text-foreground">2. How We Use Cookies</h2>
        <p>
          We use cookies for a variety of reasons detailed below:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Essential Cookies:</strong> These are required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website.</li>
          <li><strong>Analytical/Performance Cookies:</strong> These allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it.</li>
          <li><strong>Functionality Cookies:</strong> These are used to recognize you when you return to our website.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground">3. Disabling Cookies</h2>
        <p>
          You can prevent the setting of cookies by adjusting the settings on your browser (see your browser Help for how to do this). Be aware that disabling cookies will affect the functionality of this and many other websites that you visit.
        </p>
        
        <h2 className="text-xl font-bold text-foreground">4. Contact Us</h2>
        <p>
          If you have any questions about our use of cookies, please contact us at <a href="mailto:loopenode@gmail.com">loopenode@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
