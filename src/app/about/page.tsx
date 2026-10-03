import Link from "next/link";
import { editorialMetadata } from "@/components/EditorialShell";
import { HomeContent } from "@/components/HomeContent";
import styles from "@/components/HomeContent.module.css";

export const metadata = editorialMetadata(
  "성덕기니 서비스 안내",
  "성덕기니가 좋아하는 마음을 어떻게 읽는지, 만세력 계산과 궁합 점수 이야기를 들려드릴게요.",
  "/about",
);

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.navigation} aria-label="서비스 안내 메뉴">
        <Link href="/">← 홈으로</Link>
        <Link href="/guides">사주 읽는 법</Link>
        <Link href="/example-report">예시 보고서</Link>
      </nav>
      <HomeContent />
    </main>
  );
}
