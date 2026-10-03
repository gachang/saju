import Link from "next/link";
import EditorialShell, { editorialMetadata } from "@/components/EditorialShell";
import styles from "@/components/Editorial.module.css";
import { GUIDES } from "@/lib/public-content";

export const metadata = editorialMetadata(
  "사주 읽는 법",
  "만세력의 네 기둥, 성덕기니 궁합 점수의 뜻, 태어난 시간을 모를 때의 처리 방식을 읽어 보세요.",
  "/guides",
);

export default function GuidesPage() {
  return (
    <EditorialShell
      eyebrow="성덕기니의 작은 안내서"
      title="사주를 읽는 법"
      description="낯선 한자와 숫자 사이에도 읽는 순서가 있어요. 보고서를 펼치기 전, 내 사주의 좌표와 점수가 뜻하는 것을 하나씩 알아보세요."
    >
      <div className={styles.cardList}>
        {GUIDES.map((guide) => (
          <Link key={guide.slug} href={`/guides/${guide.slug}`} className={styles.cardLink}>
            <p className={styles.cardEyebrow}>{guide.eyebrow}</p>
            <h2>{guide.title}</h2>
            <p>{guide.description}</p>
            <span className={styles.linkLabel}>안내서 읽기 →</span>
          </Link>
        ))}
        <Link href="/example-report" className={styles.cardLink}>
          <p className={styles.cardEyebrow}>보고서 미리 보기</p>
          <h2>좋아하는 마음은 어떤 이야기일까?</h2>
          <p>가상의 팬과 아티스트를 주인공으로, 입덕부터 오래 좋아하는 방법까지 여덟 장의 예시를 읽어 보세요.</p>
          <span className={styles.linkLabel}>예시 보고서 펼치기 →</span>
        </Link>
      </div>
    </EditorialShell>
  );
}
