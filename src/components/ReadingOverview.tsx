import Image from "next/image";
import { getEarthlyBranchElement, getHeavenlyStemElement, type EarthlyBranch, type HeavenlyStem } from "manseryeok";
import { AXES, type compatibility } from "@/lib/compatibility";
import type { ChartResult } from "@/lib/engine";
import styles from "./ResultScreen.module.css";

type Compatibility = ReturnType<typeof compatibility>;

export function ReadingHero({ computed }: { computed: Compatibility | null }) {
  const score = computed ? Math.round(AXES.reduce((sum, axis) => sum + computed.scores[axis], 0) / AXES.length) : null;
  return <header className={styles.hero}>
    <div className={styles.halo} aria-hidden="true"><Image src="/report/back-circle.svg" alt="" fill sizes="465px" unoptimized /></div>
    <div className={styles.procession} aria-hidden="true">
      {[false, true].map((mirrored, group) => <div key={group} className={mirrored ? styles.mirrored : undefined}>
        {[0, 1, 2].map(item => <Image key={item} src="/report/side-mascot.png" alt="" width={31} height={42} sizes="31px" />)}
      </div>)}
    </div>
    <div className={styles.portrait}>
      <Image src="/report/lemon-guinea.png" alt="레몬을 안고 있는 기니피그" width={127} height={150} sizes="127px" preload className={styles.guinea} />
      <div className={styles.ring} aria-hidden="true"><Image src="/report/lemon-ring.png" alt="" fill sizes="326px" preload /></div>
    </div>
    <h1>레몬기니피그</h1>
    <p className={styles.heroSubtitle}>{computed?.compatibility_type ?? "별과 별이 만나는 이야기"}</p>
    {score !== null && <div className={styles.scoreWrap}>
      <div className={styles.scoreCard}>
        <span>궁합</span>
        <div className={styles.heroTrack} role="meter" aria-label="궁합 · 다섯 관계 축 평균" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
          <div className={styles.barFill} style={{ width: `${score}%` }} />
          <Image src="/report/score-mascot.png" alt="" width={35} height={42} sizes="35px" className={styles.scoreMascot} style={{ left: `${score}%` }} />
        </div>
        <strong>{score}</strong>
      </div>
      <p className={styles.scoreCaption}>다섯 관계 축의 평균 · 재미로 보는 지표</p>
    </div>}
  </header>;
}

export function ChartCard({ name, favorite, chart, selected, onSelect, disabled }: {
  name: string; favorite?: boolean; chart: ChartResult; selected: number; onSelect: (index: number) => void; disabled: boolean;
}) {
  const pillar = chart.variants[selected];
  return <section className={styles.overviewCard} aria-label={`${name} 님의 명식`}>
    <div className={styles.cardHeading}>
      <div><p className={styles.eyebrow}>{name} 님</p><h2>{favorite ? "최애의 생일 좌표" : "만세력"}</h2></div>
      <span className={styles.coverage}>{chart.coverage}</span>
    </div>
    {chart.variants.length > 1 && <div className={styles.variants}>
      <label>{name} 님의 명식 후보
        <select value={selected} onChange={event => onSelect(Number(event.target.value))} disabled={disabled}>
          {chart.variants.map((p, index) => <option key={index} value={index}>후보 {index + 1} · {p.year} / {p.month} / {p.day}</option>)}
        </select>
      </label>
      <p>시간 미상으로 가능한 명식이 여러 개예요. 선택은 실제 명식의 확정을 뜻하지 않아요.</p>
    </div>}
    <dl className={styles.pillars}>
      {([["year", "연주"], ["month", "월주"], ["day", "일주"], ["hour", "시주"]] as const).map(([key, label]) => {
        const value = pillar[key];
        const elements = value ? `${getHeavenlyStemElement(value[0] as HeavenlyStem)}·${getEarthlyBranchElement(value[1] as EarthlyBranch)}` : "시간 미입력";
        return <div key={key} className={value ? styles.pillar : `${styles.pillar} ${styles.unknown}`}>
          <dt>{label}</dt><dd>{value ?? "미상"}</dd><dd className={styles.elements}>{elements}</dd>
        </div>;
      })}
    </dl>
    {!pillar.hour && <p className={styles.smallCopy}>입력하지 않은 출생시각은 임의로 만들지 않아 시주를 제외했어요.</p>}
  </section>;
}

export function AxisCard({ computed }: { computed: Compatibility }) {
  return <section className={styles.overviewCard}>
    <div className={styles.cardHeading}>
      <div><p className={styles.eyebrow}>두 별의 거리</p><h2>다섯 가지 관계 축</h2></div>
      <span className={styles.coverage}>100점 기준</span>
    </div>
    <dl className={styles.axes}>{AXES.map(axis => <div key={axis}>
      <div className={styles.axisLabel}><dt>{axis}</dt><dd>{computed.scores[axis]}</dd></div>
      <div className={styles.axisTrack} role="meter" aria-label={axis} aria-valuemin={0} aria-valuemax={100} aria-valuenow={computed.scores[axis]}>
        <div className={styles.barFill} style={{ width: `${computed.scores[axis]}%` }} />
      </div>
    </div>)}</dl>
    <p className={styles.smallCopy}>점수는 명식 관계를 팬의 언어로 비교한 자체 지표이며 현실의 관계를 예언하지 않아요.</p>
    <details className={styles.calculationDetails}><summary>계산 근거 보기</summary>
      <ul>{computed.evidence.map(e => <li key={e.id}><strong>{e.label}</strong><br />{e.participants}<br />{e.meaning}</li>)}</ul>
      <p>실제 감정·성격 검사가 아니에요. 연도별 운세는 아직 계산하지 않아요.</p>
    </details>
  </section>;
}
