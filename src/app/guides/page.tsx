import Link from "next/link";
import EditorialShell, { editorialMetadata } from "@/components/EditorialShell";
import styles from "@/components/Editorial.module.css";
import { GUIDES } from "@/lib/public-content";

export const metadata = editorialMetadata(
  "사주 읽는 법",
  "만세력의 네 기둥부터 궁합 점수까지, 성덕기니가 낯선 글자와 숫자를 읽는 법을 알려드릴게요.",
  "/guides",
);

export default function GuidesPage() {
  return (
    <EditorialShell
      eyebrow="성덕기니의 작은 안내서"
      title="사주를 읽는 법"
      description="한자는 낯설고, 점수는 궁금하고. 어디부터 봐야 할지 모르겠다면 성덕기니를 따라와 보세요. 내 사주의 글자와 숫자를 하나씩 풀어드릴게요."
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
          <p>퇴근길에 우연히 들은 한 곡이 덕질의 시작이 됐어요. 민서와 하루의 여덟 장면을 함께 따라가 볼까요?</p>
          <span className={styles.linkLabel}>예시 보고서 펼치기 →</span>
        </Link>
      </div>
    </EditorialShell>
  );
}
