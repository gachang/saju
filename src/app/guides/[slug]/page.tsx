import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditorialShell, { editorialMetadata } from "@/components/EditorialShell";
import styles from "@/components/Editorial.module.css";
import { getGuide, GUIDES } from "@/lib/public-content";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return editorialMetadata(guide.title, guide.description, `/guides/${guide.slug}`);
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <EditorialShell eyebrow={guide.eyebrow} title={guide.title} description={guide.description}>
      <article className={styles.article} aria-label={guide.title}>
        <nav className={styles.contents} aria-label="이 글의 목차">
          <h2>이 순서로 읽어 보세요</h2>
          <ol>
            {guide.sections.map((section, index) => (
              <li key={section.title}><a href={`#section-${index + 1}`}>{section.title}</a></li>
            ))}
          </ol>
        </nav>
        {guide.sections.map((section, index) => (
          <section key={section.title} id={`section-${index + 1}`} className={styles.section}>
            <span className={styles.sectionNumber}>GUIDE {String(index + 1).padStart(2, "0")}</span>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
          </section>
        ))}
      </article>
      <aside className={styles.related} aria-labelledby="related-guides-title">
        <h2 id="related-guides-title">함께 읽으면 좋은 이야기</h2>
        <div className={styles.cardList}>
          {GUIDES.filter((item) => item.slug !== guide.slug).map((item) => (
            <Link key={item.slug} href={`/guides/${item.slug}`} className={styles.cardLink}>
              <p className={styles.cardEyebrow}>{item.eyebrow}</p>
              <h3>{item.title}</h3>
              <span className={styles.linkLabel}>안내서 읽기 →</span>
            </Link>
          ))}
        </div>
      </aside>
    </EditorialShell>
  );
}
