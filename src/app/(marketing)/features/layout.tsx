import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product",
  description:
    "Uptime, SSL, performance, accessibility, SEO, security, and coverage monitoring — built into one calm Health Mesh system.",
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
