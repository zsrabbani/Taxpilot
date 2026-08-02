import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaxPilot — Knowledge Desk",
  description: "Grounded answers, source-backed checklists, and client-ready first drafts for German tax advisory firms.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
