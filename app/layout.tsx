import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commission Calculator",
  description: "Internal Harcourts Golden Links residential commission workflow"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ">
      <body>{children}</body>
    </html>
  );
}
