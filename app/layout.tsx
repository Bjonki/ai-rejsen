import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampScout",
  description:
    "A lightweight browser-assisted accommodation availability scout that stops before booking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-950 antialiased">
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-slate-100">
        {children}
      </body>
    </html>
  );
}
