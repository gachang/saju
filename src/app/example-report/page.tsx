import EditorialShell, { editorialMetadata } from "@/components/EditorialShell";
import styles from "@/components/Editorial.module.css";
import { EXAMPLE_REPORT } from "@/lib/public-content";

export const metadata = editorialMetadata(EXAMPLE_REPORT.title, EXAMPLE_REPORT.description, "/example-report");

export default function ExampleReportPage() {
  return (
    <EditorialShell
      eyebrow="성덕기니 · 공개 예시 보고서"
      title={EXAMPLE_REPORT.title}
      description={EXAMPLE_REPORT.description}
      illustration
    >
      <article className={styles.article} aria-label="여덟 장으로 읽는 팬과 아티스트의 이야기">
        <section className={styles.introduction}>
          <p className={styles.sampleNames}>{EXAMPLE_REPORT.selfName} 님 × {EXAMPLE_REPORT.favoriteName} 님</p>
          <h2>이 보고서를 읽기 전에</h2>
          <p>{EXAMPLE_REPORT.introduction}</p>
        </section>
        <nav className={styles.contents} aria-label="예시 보고서 목차">
          <h2>좋아하는 마음의 여덟 장면</h2>
          <ol>
            {EXAMPLE_REPORT.chapters.map((chapter, index) => (
              <li key={chapter.title}><a href={`#chapter-${index + 1}`}>{chapter.title}</a></li>
            ))}
          </ol>
        </nav>
        {EXAMPLE_REPORT.chapters.map((chapter, index) => (
          <section key={chapter.title} id={`chapter-${index + 1}`} className={styles.section}>
            <span className={styles.sectionNumber}>CHAPTER {String(index + 1).padStart(2, "0")}</span>
            <h2>{chapter.title}</h2>
            {chapter.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
          </section>
        ))}
      </article>
    </EditorialShell>
  );
}
