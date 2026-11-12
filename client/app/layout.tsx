import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spruce Academia — Typing Practice Platform",
  description:
    "Master typing speed and accuracy with Spruce Academia. Practice with domain-specific content across Healthcare, English Communication, and Speed Tests.",
  keywords: ["typing practice", "WPM", "typing speed", "academia", "spruce"],
  authors: [{ name: "Spruce Academia" }],
  openGraph: {
    title: "Spruce Academia — Typing Practice Platform",
    description:
      "Master typing speed and accuracy with domain-specific practice content.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "var(--font-primary, 'Open Sans', system-ui, -apple-system, sans-serif)" }}>
        {children}
      </body>
    </html>
  );
}
