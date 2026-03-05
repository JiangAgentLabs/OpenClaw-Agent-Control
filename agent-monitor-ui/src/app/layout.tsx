import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenClaw Agent Monitor",
  description: "Dashboard for OpenClaw agent and sub-agent execution status.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
