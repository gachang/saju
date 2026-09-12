"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ReadingHero, ChartCard, AxisCard } from "./ReadingOverview";
import { ReportChapters } from "./ReportChapters";
import { GoldButton } from "./ui/GoldButton";
import { calculateChart } from "@/lib/engine";
import { compatibility } from "@/lib/compatibility";
import { countText, displayText, reportSchema, type Report } from "@/lib/reading-schema";
import type { FormState, Person } from "@/lib/saju";
import styles from "./ResultScreen.module.css";

function chartFor(p: Person) {
  const [hour, minute] = p.birthTime.split(":").map(Number);
  return calculateChart({ year: Number(p.year), month: Number(p.month), day: Number(p.day), isLunar: p.calendar === "lunar", isLeapMonth: p.isLeapMonth, ...(p.timeUnknown ? {} : { hour, minute }), dayBoundary: "midnight" });
}

export function ResultScreen({ form, onRestart, initialReport, example = false }: {
  form: FormState; onRestart: () => void; initialReport?: Report; example?: boolean;
}) {
  const result = useMemo(() => {
    try { return { self: chartFor(form.self), favorite: chartFor(form.partner), error: "" }; }
    catch { return { self: null, favorite: null, error: "출생일·출생시각·윤달 여부를 다시 확인해 주세요." }; }
  }, [form]);
  const [selfIndex, setSelfIndex] = useState(0), [favoriteIndex, setFavoriteIndex] = useState(0);
  const [report, setReport] = useState<Report | null>(initialReport ?? null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const controller = useRef<AbortController | null>(null);
  const chapters = useRef<HTMLDivElement | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (report && !example) chapters.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }, [report, example]);
  const pair = result.self && result.favorite ? { self: result.self.variants[selfIndex], favorite: result.favorite.variants[favoriteIndex] } : null;
  const computed = pair ? compatibility(pair) : null;
  const selfName = form.self.name.trim() || "사용자", favoriteName = form.partner.name.trim() || "최애";
  const format = (text: string) => displayText(text, selfName, favoriteName);
  const reportText = () => report ? [
    `성덕기니 · ${selfName} 님 × ${favoriteName} 님`,
    ...(example ? ["합성 입력으로 만든 AI 보고서 예시입니다."] : []),
    ...report.sections.map(section => `${String(section.id).padStart(2, "0")}. ${section.title}\n\n${section.paragraphs.map(format).join("\n\n")}`),
    "전통 명리의 상징을 활용한 엔터테인먼트 콘텐츠로, 실제 감정·관계·미래를 예측하지 않습니다.",
  ].join("\n\n") : "";
  function selectChart(index: number, favorite = false) {
    (favorite ? setFavoriteIndex : setSelfIndex)(index);
    setReport(null); setMessage(""); setShareMessage("");
  }
  async function generate() {
    if (!pair || busy || example) return;
    setBusy(true); setMessage(""); setShareMessage(""); setReport(null);
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 235_000);
    try {
      const name_lengths = { self: countText(selfName), favorite: countText(favoriteName) };
      const response = await fetch("/api/reading-copy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...pair, name_lengths }), signal: abort.signal });
      const body = await response.json();
      if (!response.ok) { setMessage(body.error || "잠시 후 다시 시도해 주세요."); return; }
      setReport(reportSchema.parse(body.report));
    } catch { setMessage("보고서를 불러오지 못했어요. 계산 결과는 계속 확인할 수 있어요."); }
    finally { clearTimeout(timeout); setBusy(false); }
  }
  async function share() {
    if (!report) return;
    setShareMessage("");
    try {
      if (navigator.share) await navigator.share({ title: "성덕기니 보고서", text: reportText() });
      else { await navigator.clipboard.writeText(reportText()); setShareMessage("보고서 내용을 복사했어요. 원하는 곳에 붙여 넣어 공유해 주세요."); }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) setShareMessage("공유 기능을 사용할 수 없어요. ‘보고서 저장’으로 기기에 보관해 주세요.");
    }
  }
  function save() {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([reportText()], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "seongdeok-report.txt";
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className={styles.screen} aria-label="성덕기니 결과 보고서">
    {example && <p className={styles.exampleNotice}>완성 보고서 예시 · 합성 입력<br />입력하신 정보에 대한 결과가 아니에요.</p>}
    <div className={styles.content}>
      <div className={styles.background} aria-hidden="true"><div className={styles.light}><Image src="/report/light.png" alt="" fill sizes="492px" className="object-cover" preload /></div></div>
      <ReadingHero computed={computed} />
      <div className={styles.overview}>
        {result.error && <p role="alert" className={styles.feedback}>{result.error}</p>}
        {result.self && <ChartCard name={selfName} chart={result.self} selected={selfIndex} disabled={busy || example} onSelect={index => selectChart(index)} />}
        {result.favorite && <ChartCard name={favoriteName} favorite chart={result.favorite} selected={favoriteIndex} disabled={busy || example} onSelect={index => selectChart(index, true)} />}
        {computed && <AxisCard computed={computed} />}
        {computed && <aside className={styles.notice}>
          <strong>{report ? "여덟 장의 이야기가 완성됐어요" : "두 명식의 계산을 마쳤어요"}</strong>
          <p>{report ? `${selfName} 님과 ${favoriteName} 님의 명식에서 출발한 이야기를 아래에서 읽어보세요.` : "AI 보고서는 아래 버튼으로 별도 요청해요. 생성되지 않은 본문을 완성본으로 표시하지 않아요."}</p>
          <p>{result.self?.convention} · 시주는 궁합에서 제외해요.</p>
        </aside>}
      </div>
      {computed && !report && !example && <div className={styles.actions}>
        <GoldButton onClick={generate} disabled={busy}>{busy ? "보고서를 쓰고 있어요…" : "분석하기"}</GoldButton>
        {busy && <p role="status" className={styles.feedback}>8개 장의 근거·문장·분량을 검토하고 있어요. 최대 약 4분 걸릴 수 있어요.</p>}
        <p className={styles.privacy}>AI 요청에는 선택한 명식과 호칭의 글자 수만 전송해요. 생일·이름·성별·그룹명은 전송하지 않아요.</p>
        <Link href="/report/example" className={styles.exampleLink}>완성 보고서 레이아웃 예시 보기</Link>
        <p role="status" aria-live="polite" className={styles.feedback}>{message}</p>
      </div>}
      {report && <div ref={chapters} className="pt-10"><ReportChapters report={report} selfName={selfName} favoriteName={favoriteName} /></div>}
      <footer className={styles.footer}>
        {report && <>
          <button type="button" className={styles.share} onClick={share}>공유하기</button>
          <p className={styles.footnote}>보고서를 기기에 저장해 두고 다시 읽어보세요.<br />입력과 결과는 서버에 저장하지 않아요.</p>
          <p role="status" aria-live="polite" className={styles.feedback}>{shareMessage}</p>
        </>}
        <div className={styles.footerActions}>
          {report && <button type="button" onClick={save} className={styles.save}>보고서 저장</button>}
          <button type="button" onClick={onRestart} className={styles.restart}>{example ? "내 사주로 시작하기" : "처음으로"}</button>
        </div>
      </footer>
    </div>
  </div>;
}
