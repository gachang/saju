import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CANONICAL_ORIGIN, SHARE_PREVIEW_PATH } from "@/lib/kakao-share";
import { BrandMark } from "./BrandMark";
import styles from "./Editorial.module.css";

export function editorialMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const pageTitle = `${title} | 성덕기니`;
  return {
    title: pageTitle,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: "성덕기니",
      url: `${CANONICAL_ORIGIN}${path}`,
      title: pageTitle,
      description,
      images: [{ url: SHARE_PREVIEW_PATH, width: 538, height: 272, alt: "성덕기니" }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [SHARE_PREVIEW_PATH],
    },
  };
}

export default function EditorialShell({
  eyebrow,
  title,
  description,
  children,
  illustration = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  illustration?: boolean;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="성덕기니 홈으로">
          <BrandMark />
        </Link>
        <nav className={styles.navigation} aria-label="주요 메뉴">
          <Link href="/">홈</Link>
          <Link href="/guides">사주 읽는 법</Link>
          <Link href="/example-report">예시 보고서</Link>
        </nav>
      </header>
      <main className={styles.main} id="main-content">
        <header className={styles.hero}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1>{title}</h1>
          <p className={styles.lead}>{description}</p>
          {illustration && (
            <Image className={styles.illustration} src="/report/pair-guineas.png" width={240} height={180} alt="" />
          )}
        </header>
        <div className={styles.divider} aria-hidden="true" />
        {children}
      </main>
      <footer className={styles.footer}>
        <Link href="/" className={styles.primaryLink}>나와 최애의 사주 보기</Link>
        <nav className={styles.footerNavigation} aria-label="다른 콘텐츠">
          <Link href="/guides">사주 읽는 법</Link>
          <Link href="/example-report">예시 보고서</Link>
        </nav>
        <p>성덕기니 · 좋아하는 마음을 읽는 작은 안내서</p>
      </footer>
    </div>
  );
}
