import React from "react";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function WebsiteLayout({ children }: Props) {
  return <>{children}</>;
}
