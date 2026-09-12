import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const hambakSnow = localFont({
  src: "./fonts/SF_HambakSnow.woff2",
  variable: "--font-hambak",
  display: "swap",
});

const gmarketSans = localFont({
  src: [
    { path: "./fonts/GmarketSansLight.woff", weight: "300", style: "normal" },
    { path: "./fonts/GmarketSansMedium.woff", weight: "500", style: "normal" },
    { path: "./fonts/GmarketSansBold.woff", weight: "700", style: "normal" },
  ],
  variable: "--font-gmarket",
  display: "swap",
});

const reportSans = localFont({
  src: "./fonts/report/NotoSansKR-400-700.woff2", weight: "400 700", style: "normal",
  variable: "--font-report-sans", display: "swap", preload: false,
});
const reportSerif = localFont({
  src: "./fonts/report/NotoSerifKR-Bold.woff2", weight: "700", style: "normal",
  variable: "--font-report-serif", display: "swap", preload: false,
});

export const metadata: Metadata = {
  title: "성덕기니",
  description: "성덕기니가 자네와 그이의 궁합을 봐주겠네.",
};

export const viewport: Viewport = {
  themeColor: "#012E58",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${hambakSnow.variable} ${gmarketSans.variable} ${reportSans.variable} ${reportSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
