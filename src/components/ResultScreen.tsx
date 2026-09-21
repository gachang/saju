"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import { ChartCard, ReadingHero } from "./ReadingOverview";
import { ReportChapters } from "./ReportChapters";
import { calculateChart } from "@/lib/engine";
import { compatibility } from "@/lib/compatibility";
import { kakaoShareTemplate } from "@/lib/kakao-share";
import type { Report } from "@/lib/reading-schema";
import type { FormState, Person } from "@/lib/saju";
import type { SharedReportRecord } from "@/lib/shared-report-schema";
import styles from "./ResultScreen.module.css";

type SharedReportResponse = {
  url: string;
  expiresAt: string;
};

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

type ResultScreenProps = {
  onRestart: () => void;
} & (
  | {
      form: FormState;
      report: Report;
      sharedReport?: never;
      initialShareUrl?: never;
    }
  | {
      form?: never;
      report?: never;
      sharedReport: SharedReportRecord;
      initialShareUrl: string;
    }
);

export function ResultScreen(props: ResultScreenProps) {
  const { onRestart, sharedReport, form } = props;
  const report: Report = sharedReport ? sharedReport.report : props.report;
  const result = useMemo(() => {
    if (sharedReport) {
      return {
        self: sharedReport.selfChart,
        favorite: sharedReport.favoriteChart,
        error: "",
      };
    }
    if (!form) {
      return { self: null, favorite: null, error: "공유 보고서를 불러올 수 없어요." };
    }
    try {
      return { self: chartFor(form.self), favorite: chartFor(form.partner), error: "" };
    } catch {
      return { self: null, favorite: null, error: "출생일·출생시각·윤달 여부를 다시 확인해 주세요." };
    }
  }, [form, sharedReport]);
  const [shareMessage, setShareMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const sharedLinkRef = useRef<Promise<SharedReportResponse> | null>(
    props.initialShareUrl && sharedReport
      ? Promise.resolve({ url: props.initialShareUrl, expiresAt: sharedReport.expiresAt })
      : null,
  );
  const pair = result.self && result.favorite
    ? { self: result.self.variants[0], favorite: result.favorite.variants[0] }
    : null;
  const computed = pair ? compatibility(pair) : null;
  const selfName = sharedReport?.selfName ?? form?.self.name.trim() ?? "사용자";
  const favoriteName = sharedReport?.favoriteName ?? form?.partner.name.trim() ?? "최애";
  const groupName = sharedReport?.groupName ?? form?.groupName.trim() ?? "";
  const favoriteDisplayName = groupName ? `${favoriteName} · ${groupName}` : favoriteName;

  function initializeKakao() {
    const key = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
    if (!key || !window.Kakao) return false;

    try {
      if (!window.Kakao.isInitialized()) window.Kakao.init(key);
      return window.Kakao.isInitialized();
    } catch {
      return false;
    }
  }

  const sharedLink = useCallback(() => {
    if (!result.self || !result.favorite) {
      return Promise.reject(new Error("A complete chart is required before sharing."));
    }

    if (!sharedLinkRef.current) {
      const payload = {
        selfName,
        favoriteName,
        groupName,
        selfChart: { ...result.self, variants: [result.self.variants[0]] },
        favoriteChart: { ...result.favorite, variants: [result.favorite.variants[0]] },
        report,
      };

      sharedLinkRef.current = fetch("/api/shared-reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (response) => {
        const body: unknown = await response.json().catch(() => null);
        if (
          !response.ok
          || typeof body !== "object"
          || body === null
          || !("url" in body)
          || typeof body.url !== "string"
          || !("expiresAt" in body)
          || typeof body.expiresAt !== "string"
        ) {
          throw new Error("The shared report could not be created.");
        }
        return { url: body.url, expiresAt: body.expiresAt };
      }).catch((error: unknown) => {
        sharedLinkRef.current = null;
        throw error;
      });
    }

    return sharedLinkRef.current;
  }, [favoriteName, groupName, report, result.favorite, result.self, selfName]);

  // Kakao opens its share window most reliably when the URL already exists at
  // click time. Prepare it quietly while the user reads the result, then reuse
  // the same promise and Redis record for every subsequent share.
  useEffect(() => {
    if (!props.initialShareUrl) void sharedLink().catch(() => undefined);
  }, [props.initialShareUrl, sharedLink]);

  async function share() {
    if (isSharing) return;
    setIsSharing(true);
    setShareMessage("공유 링크를 만드는 중이에요.");

    try {
      const { url } = await sharedLink();

      if (initializeKakao()) {
        try {
          window.Kakao?.Share.sendDefault(kakaoShareTemplate(url));
          setShareMessage("카카오톡 공유창을 열었어요.");
          return;
        } catch {
          // The native share sheet and clipboard remain available as fallbacks.
        }
      }

      if (navigator.share) {
        try {
          await navigator.share({ title: "성덕기니 보고서", url });
          setShareMessage("공유창을 열었어요.");
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            setShareMessage("");
            return;
          }
        }
      }

      await navigator.clipboard.writeText(url);
      setShareMessage("보고서 링크를 복사했어요.");
    } catch {
      setShareMessage("공유 링크를 만들 수 없어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSharing(false);
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
      {process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY && (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js"
          strategy="afterInteractive"
          onReady={() => {
            initializeKakao();
          }}
        />
      )}
      <div className={styles.scrollArea}>
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
        </div>
      </div>

      <div className={styles.shareDock}>
        <button
          type="button"
          className={styles.share}
          onClick={share}
          disabled={isSharing}
          aria-busy={isSharing}
        >
          <Image src="/report/share.svg" alt="" width={24} height={24} unoptimized />
          {isSharing ? "링크 만드는 중…" : "공유하기"}
        </button>
        <p className={styles.shareCaption} role="status" aria-live="polite">
          {shareMessage || "링크는 3일 뒤 사라져요"}
        </p>
      </div>
    </div>
  );
}
