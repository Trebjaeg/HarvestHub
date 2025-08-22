import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import localFont from "next/font/local"

const myFont = localFont({
  src: [
    {path: "../public/fonts/OpenSauceSans-Regular.ttf", weight: "400", style: "normal"},
    {path: "../public/fonts/OpenSauceSans-Bold.ttf", weight: "700", style: "normal"},
  ],
  variable: "--font-myFont",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HarvestHub",
  description: "Developed By Group of Aprodhite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${myFont.variable}, ${geistMono.variable}, ${geistSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
