import React from "react";
import { Roboto } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/marketing/cookie-banner";
import { ScrollToTop } from "@/components/layout/scroll-to-top";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col min-h-screen ${roboto.className}`}>
      <Header />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
      <CookieBanner />
      <ScrollToTop />
    </div>
  );
}

