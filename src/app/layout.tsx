import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Google Form Skiner",
  description: "Render Google Forms as clean HTML for landing pages."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
