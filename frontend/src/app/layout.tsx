import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/layout/header";
import ApiStatusBanner from "@/components/layout/api-status-banner";
import Footer from "@/components/layout/footer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EconBase — Interactive Economic Base Analysis",
  description:
    "Explore America's economic DNA through Location Quotients, Shift-Share analysis, and more. Powered by U.S. Census Bureau data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased flex min-h-screen flex-col bg-white text-slate-900`}
      >
        <Providers>
          <Header />
          <ApiStatusBanner />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
