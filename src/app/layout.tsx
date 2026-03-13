import type { Metadata, Viewport } from "next";
import { Nunito, Unbounded } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["cyrillic", "latin"],
  variable: "--font-body",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["cyrillic", "latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Бартерия — живая игра обмена",
  description: "Клубная игра, где предприниматели обмениваются услугами через игровую валюту Бартер. Без денег. Без барьеров. Только ценность.",
  keywords: ["бартерия", "бартер", "обмен услугами", "нетворкинг", "предприниматели"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FEFBF4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${nunito.variable} ${unbounded.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
