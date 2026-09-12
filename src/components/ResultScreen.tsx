"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Backdrop } from "./Backdrop";
import { GoldButton } from "./ui/GoldButton";
import { calculateChart } from "@/lib/engine";
import { AXES, compatibility } from "@/lib/compatibility";
import { countText, displayText, reportSchema, type Report } from "@/lib/reading-schema";
import type { FormState, Person } from "@/lib/saju";

function chartFor(p: Person) {
  const [hour, minute] = p.birthTime.split(":").map(Number);
  return calculateChart({ year: Number(p.year), month: Number(p.month), day: Number(p.day), isLunar: p.calendar === "lunar", isLeapMonth: p.isLeapMonth, ...(p.timeUnknown ? {} : { hour, minute }), dayBoundary: "midnight" });
}

export function ResultScreen({ form, onRestart }: { form: FormState; onRestart: () => void }) {
  const result = useMemo(() => {
    try { return { self: chartFor(form.self), favorite: chartFor(form.partner), error: "" }; }
    catch { return { self: null, favorite: null, error: "출생일·출생시각·윤달 여부를 다시 확인해 주세요." }; }
  }, [form]);
  const [selfIndex, setSelfIndex] = useState(0), [favoriteIndex, setFavoriteIndex] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const pair = result.self && result.favorite ? { self: result.self.variants[selfIndex], favorite: result.favorite.variants[favoriteIndex] } : null;
  const computed = pair ? compatibility(pair) : null;
  const format = (text: string) => displayText(text, form.self.name.trim() || "사용자", form.partner.name.trim() || "최애");
  async function generate() {
    if (!pair || busy) return;
    setBusy(true); setMessage(""); setReport(null);
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 235_000);
    try {
      const name_lengths = { self: countText(form.self.name.trim() || "사용자"), favorite: countText(form.partner.name.trim() || "최애") };
      const response = await fetch("/api/reading-copy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...pair, name_lengths }), signal: abort.signal });
      const body = await response.json();
      if (!response.ok) { setMessage(body.error || "잠시 후 다시 시도해 주세요."); return; }
      setReport(reportSchema.parse(body.report));
    } catch { setMessage("보고서를 불러오지 못했어요. 계산 결과는 아래에서 확인할 수 있어요."); }
    finally { clearTimeout(timeout); setBusy(false); }
  }
  return <div className="relative h-full overflow-y-auto">
    <Backdrop dim />
    <div className="relative space-y-6 px-6 py-10 font-gmarket text-sm text-white/85">
      <h1 className="text-center font-hambak text-3xl text-gold">성덕기니</h1>
      <p className="text-center">{form.self.name || "사용자"} 님 × {form.partner.name || "최애"} 님</p>
      {result.error && <p role="alert">{result.error}</p>}
      {([ ["본인", result.self, selfIndex, setSelfIndex], ["최애", result.favorite, favoriteIndex, setFavoriteIndex] ] as const).map(([label, chart, selected, setSelected]) => chart && <section key={label} className="rounded-2xl border border-gold/25 bg-ink-deep/80 p-4">
        <h2 className="mb-2 text-gold">{label} · {chart.coverage}</h2>
        <p className="text-xs text-white/60">{chart.convention}</p>
        {chart.variants.length > 1 && <p className="my-2 text-xs">시간 미상으로 가능한 명식이 여러 개예요. 비교할 후보를 선택해 주세요. 선택은 실제 명식의 확정을 뜻하지 않아요.</p>}
        {chart.variants.map((p, i) => <label key={i} className="my-3 block text-xs leading-loose">
          {chart.variants.length > 1 && <input type="radio" name={label} checked={selected === i} disabled={busy} onChange={() => { setSelected(i); setReport(null); setMessage(""); }} />}
          연 {p.year} · 월 {p.month} · 일 {p.day} · 시 {p.hour ?? "모름"}
        </label>)}
      </section>)}
      {computed && <section className="space-y-4 rounded-2xl border border-gold/25 bg-ink-deep/80 p-4">
        <h2 className="text-lg text-gold">{computed.compatibility_type}</h2>
        <p className="text-xs text-white/60">연·월·일주만 사용한 재미용 자체 지표예요. 실제 연애 확률이나 과학적 성격 검사가 아니에요.</p>
        {AXES.map(axis => <div key={axis}><div className="mb-1 flex justify-between"><span>{axis}</span><span>{computed.scores[axis]}</span></div><progress aria-label={axis} value={computed.scores[axis]} max={100} className="h-2 w-full accent-yellow-200" /></div>)}
        <details><summary className="cursor-pointer text-gold">계산 근거 보기</summary><ul className="mt-3 space-y-3 text-xs leading-relaxed">{computed.evidence.map(e => <li key={e.id}>{e.participants}: {e.label}<br />{e.meaning}<br /><span className="text-white/40">{e.id}</span></li>)}</ul></details>
        <p className="text-xs text-white/50">출생시각을 모르면 시주 해석을 생략해요. 연도별 운세는 아직 계산하지 않아요.</p>
      </section>}
      {computed && <>
        <GoldButton onClick={generate} disabled={busy}>{busy ? "보고서를 쓰고 있어요…" : "AI 보고서 만들기"}</GoldButton>
        {busy && <p role="status" className="text-xs leading-relaxed text-gold">8개 장을 작성하고 근거·문장·분량을 검토하고 있어요. 필요한 장만 다시 다듬으며, 최대 약 4분 걸릴 수 있어요.</p>}
        <p className="text-xs leading-relaxed text-white/60">AI 요청에는 선택한 명식과 호칭의 글자 수만 전송해요. 생일·이름·성별·그룹명은 전송하지 않아요. 입력과 결과는 새로고침하면 사라져요.</p>
      </>}
      <p role="status" aria-live="polite" className="text-sm text-gold">{message}</p>
      {report?.sections.map(section => <section key={section.id} className="rounded-2xl border border-gold/25 bg-ink-deep/80 p-5">
        <h2 className="mb-4 font-hambak text-xl leading-relaxed text-gold">{section.id}. {section.title}</h2>
        <div className="space-y-4 leading-7">{section.paragraphs.map((p, i) => <p key={i}>{format(p)}</p>)}</div>
      </section>)}
      <button type="button" onClick={onRestart} className="h-12 w-full rounded-2xl border border-white/30">처음으로</button>
    </div>
  </div>;
}
