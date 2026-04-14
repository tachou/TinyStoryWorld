import type { Metadata } from "next";
import { Nunito, Fredoka } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: "Tiny Story World",
  description: "A Multilingual Learning Platform for K-6 Classrooms",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: { url: "/favicon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
  themeColor: "#d6453d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${fredoka.variable}`}>
      <body className={nunito.className}>{children}</body>
    </html>
  );
}
