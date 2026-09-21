"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChartCard, ReadingHero } from "./ReadingOverview";
import { ReportChapters } from "./ReportChapters";
import { calculateChart } from "@/lib/engine";
import { compatibility } from "@/lib/compatibility";
import { displayText, type Report } from "@/lib/reading-schema";
import type { FormState, Person } from "@/lib/saju";
import styles from "./ResultScreen.module.css";

function chartFor(person: Person) {
  const [hour, minute] = person.birthTime.split(":").map(Number);
  return calculateChart({
    year: Number(person.year),
    month: Number(person.month),
    day: Number(person.day),
    isLunar: person.calendar === "lunar",
    isLeapMonth: person.isLeapMonth,
    ...(person.timeUnknown ? {} : { hour, minute }),
    dayBoundary: "midnight",
  });
}

export function ResultScreen({ form, report, onRestart }: { form: FormState; report: Report; onRestart: () => void }) {
  const result = useMemo(() => {
    try {
      return { self: chartFor(form.self), favorite: chartFor(form.partner), error: "" };
    } catch {
      return { self: null, favorite: null, error: "출생일·출생시각·윤달 여부를 다시 확인해 주세요." };
    }
  }, [form]);
  const [shareMessage, setShareMessage] = useState("");
  const pair = result.self && result.favorite
    ? { self: result.self.variants[0], favorite: result.favorite.variants[0] }
    : null;
  const computed = pair ? compatibility(pair) : null;
  const selfName = form.self.name.trim() || "사용자";
  const favoriteName = form.partner.name.trim() || "최애";
  const groupName = form.groupName.trim();
  const favoriteDisplayName = groupName ? `${favoriteName} · ${groupName}` : favoriteName;
  const reportText = [
    `성덕기니 · ${selfName} 님 × ${favoriteDisplayName} 님`,
    ...report.sections.map(
      (section) =>
        `${String(section.id).padStart(2, "0")}. ${displayText(section.title, selfName, favoriteName)}\n\n${section.paragraphs
          .map((paragraph) => displayText(paragraph, selfName, favoriteName))
          .join("\n\n")}`,
    ),
  ].join("\n\n");

  async function share() {
    setShareMessage("");
    try {
      if (navigator.share) {
        await navigator.share({ title: "성덕기니 보고서", text: reportText });
      } else {
        await navigator.clipboard.writeText(reportText);
        setShareMessage("보고서 내용을 복사했어요.");
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        setShareMessage("공유할 수 없어요. 잠시 후 다시 시도해 주세요.");
      }
    }
  }

  if (!computed || !result.self || !result.favorite) {
    return (
      <div className={styles.screen}>
        <div className={styles.errorState}>
          <p role="alert">{result.error}</p>
          <button type="button" onClick={onRestart}>처음으로</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen} aria-label="성덕기니 결과 보고서">
      <div className={styles.content}>
        <div className={styles.background} aria-hidden="true">
          <Image src="/report/zodiac.png" alt="" width={1254} height={1254} className={styles.zodiac} preload />
          <div className={styles.light}>
            <Image src="/report/light.png" alt="" fill sizes="386px" className="object-cover" preload />
          </div>
        </div>

        <ReadingHero computed={computed} />

        <section className={styles.overview} aria-labelledby="chart-heading">
          <div className={styles.divider} aria-hidden="true">
            <Image src="/report/divider.svg" alt="" fill unoptimized />
            <Image src="/report/star.svg" alt="" width={14} height={14} unoptimized />
          </div>
          <h2 id="chart-heading" className={styles.sectionHeading}>너의 사주를 자세하게 풀어줄기니</h2>
          <div className={styles.chartList}>
            <ChartCard name={selfName} chart={result.self} />
            <ChartCard name={favoriteDisplayName} favorite chart={result.favorite} />
          </div>
        </section>

        <ReportChapters report={report} selfName={selfName} favoriteName={favoriteName} />

        <footer className={styles.footer}>
          <button type="button" onClick={onRestart} className={styles.restart}>처음으로</button>
        </footer>

        <div className={styles.shareDock}>
          <button type="button" className={styles.share} onClick={share}>
            <Image src="/report/share.svg" alt="" width={24} height={24} unoptimized />
            공유하기
            <span className="sr-only" aria-live="polite">{shareMessage}</span>
          </button>
          <p className={styles.shareCaption}>링크는 3일 뒤 사라져요</p>
        </div>
      </div>
    </div>
  );
}
