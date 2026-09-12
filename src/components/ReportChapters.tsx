import { countText, displayText, type Report } from "@/lib/reading-schema";
import styles from "./ReportChapters.module.css";

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
      <h2 id="report-chapters-heading" className={styles.heading}>별과 별이 들려주는 이야기</h2>
      <div className={styles.list}>
        {report.sections.map(section => {
          const paragraphs = section.paragraphs.map(paragraph => displayText(paragraph, self, favorite));
          const bodyLength = paragraphs.reduce((total, paragraph) => total + countText(paragraph), 0);
          const headingId = `report-chapter-${section.id}-heading`;

          return (
            <article key={section.id} className={styles.card} aria-labelledby={headingId}>
              <header className={styles.cardHeader}>
                <span className={styles.number} aria-hidden="true">{String(section.id).padStart(2, "0")}</span>
                <h3 id={headingId} className={styles.title}>
                  <span className={styles.srOnly}>{section.id}장. </span>
                  {displayText(section.title, self, favorite)}
                </h3>
              </header>
              <div className={styles.accent} aria-hidden="true" />
              <div className={styles.body}>
                {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>
              <footer className={styles.footer}>{bodyLength}자 · {paragraphs.length}문단</footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
