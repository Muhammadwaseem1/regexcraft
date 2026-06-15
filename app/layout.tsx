import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "regexcraft — regex tester for humans",
  description: "Test, debug, and learn regular expressions with real-time match highlighting, group breakdown, and replace mode.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
