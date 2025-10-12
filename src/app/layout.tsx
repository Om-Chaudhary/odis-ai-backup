import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Inter } from "next/font/google";
import { Lora } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "~/styles/globals.css";
import { PostHogProvider } from "~/components/PostHogProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "Odis AI",
  description: "Odis AI",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="light">
      <body
        className={`font-sans ${outfit.variable} ${inter.variable} ${lora.variable} ${geistMono.variable}`}
      >
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
