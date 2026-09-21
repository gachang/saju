import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import {
  CANONICAL_ORIGIN,
  SHARE_DESCRIPTION,
  SHARE_PREVIEW_PATH,
  SHARE_TITLE,
} from "@/lib/kakao-share";
import "./globals.css";

const hambakSnow = localFont({
  src: "./fonts/SF_HambakSnow.woff2",
  weight: "800",
  style: "normal",
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
  src: "./fonts/report/NotoSerifKR-400-900.woff2", weight: "400 900", style: "normal",
  variable: "--font-report-serif", display: "swap", preload: false,
});
const chartFont = localFont({ src:"./fonts/report/YujiMai-chart.woff2", variable:"--font-report-chart", weight:"400", display:"swap", preload:false });
const onboardingHanjaFont = localFont({ src:"./fonts/report/YujiMai-onboarding.ttf", variable:"--font-onboarding-hanja", weight:"400", display:"swap", preload:false });
const diphylleia = localFont({ src:"./fonts/report/Diphylleia-Regular.ttf", variable:"--font-diphylleia", weight:"400", display:"swap", preload:false });

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_ORIGIN),
  title: "성덕기니",
  description: SHARE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "성덕기니",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [
      {
        url: SHARE_PREVIEW_PATH,
        width: 538,
        height: 272,
        alt: "성덕기니 궁합 보고서",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [SHARE_PREVIEW_PATH],
  },
};

export const viewport: Viewport = {
  themeColor: "#012E58",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${hambakSnow.variable} ${gmarketSans.variable} ${reportSans.variable} ${reportSerif.variable} ${chartFont.variable} ${onboardingHanjaFont.variable} ${diphylleia.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
