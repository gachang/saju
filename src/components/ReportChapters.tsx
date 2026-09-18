import { countText, displayText, REPORT_CHAPTER_TITLES, type Report } from "@/lib/reading-schema";
import styles from "./ReportChapters.module.css";
import Image from "next/image";

type ReportChaptersProps = {
  report: Report;
  selfName: string;
  favoriteName: string;
};

/** The report copy is rendered verbatim; only the two name placeholders change. */
export function ReportChapters({ report, selfName, favoriteName }: ReportChaptersProps) {
  const self = selfName.trim() || "사용자";
  const favorite = favoriteName.trim() || "최애";

  return (
    <section className={styles.chapters} aria-labelledby="report-chapters-heading">
      <div className={styles.divider} aria-hidden="true"><Image src="/report/divider.svg" alt="" fill unoptimized /><Image src="/report/star.svg" alt="" width={14} height={14} unoptimized /></div>
      <h2 id="report-chapters-heading" className={styles.heading}>너의 사주를 자세하게 풀어줄기니</h2>
      <div className={styles.list}>
        {report.sections.map(section => {
          const paragraphs = section.paragraphs.map(paragraph => displayText(paragraph, self, favorite));
          const bodyLength = paragraphs.reduce((total, paragraph) => total + countText(paragraph), 0);
          const headingId = `report-chapter-${section.id}-heading`;

          return (
            <details key={section.id} className={styles.card}>
              <summary className={styles.cardHeader}>
                <div><p className={styles.number}>chapter {String(section.id).padStart(2, "0")}. {REPORT_CHAPTER_TITLES[section.id - 1]}</p>
                <h3 id={headingId} className={styles.title}>
                  <span className={styles.srOnly}>{section.id}장. </span>
                  {displayText(section.title, self, favorite)}
                </h3>
                </div><Image className={styles.chevron} src="/report/chevron.svg" alt="" width={24} height={24} unoptimized />
              </summary>
              <div className={styles.body}>
                {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>
              <p className={styles.srOnly}>{bodyLength}자 · {paragraphs.length}문단</p>
            </details>
          );
        })}
      </div>
    </section>
  );
}
