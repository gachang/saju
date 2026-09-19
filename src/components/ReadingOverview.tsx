import Image from "next/image";
import {
  EARTHLY_BRANCHES,
  EARTHLY_BRANCHES_HANJA,
  HEAVENLY_STEMS,
  HEAVENLY_STEMS_HANJA,
  getBranchTenGod,
  getEarthlyBranchElement,
  getHeavenlyStemElement,
  getTenGod,
  type EarthlyBranch,
  type HeavenlyStem,
} from "manseryeok";
import { chartOneLineSummary, compatibility, compatibilityScore } from "@/lib/compatibility";
import { getCoupleTier } from "@/lib/couple-tier";
import type { ChartResult } from "@/lib/engine";
import styles from "./ResultScreen.module.css";

type Compatibility = ReturnType<typeof compatibility>;

const stars = [
  [-64, 38, 14],
  [125, 55, 10],
  [-137, 116, 10],
  [-101, 271, 20],
  [-9, 240, 10],
  [23, 70, 10],
  [170, 192, 10],
] as const;

export function ReadingHero({ computed }: { computed: Compatibility }) {
  const score = compatibilityScore(computed);
  const tier = getCoupleTier(score);

  return (
    <header className={styles.hero}>
      <div className={styles.heroScene}>
        <div aria-hidden="true">
          {stars.map(([x, y, size], index) => (
            <Image
              key={index}
              src="/report/star.svg"
              alt=""
              width={size}
              height={size}
              unoptimized
              style={{ position: "absolute", left: `calc(50% + ${x}px)`, top: y }}
            />
          ))}
        </div>
        <div className={styles.halo} aria-hidden="true">
          <Image src="/report/back-circle.svg" alt="" fill sizes="465px" unoptimized />
        </div>
        <div className={styles.procession} aria-hidden="true">
          {[false, true].map((mirrored, group) => (
            <div key={group} className={mirrored ? styles.mirrored : undefined}>
              {[0, 1, 2].map((item) => (
                <Image key={item} src="/report/side-mascot.png" alt="" width={31} height={42} sizes="31px" />
              ))}
            </div>
          ))}
        </div>
        <div className={styles.ring} aria-hidden="true">
          <Image src="/report/lemon-ring.png" alt="" fill sizes="328px" preload />
        </div>
        <div className={styles.orbitRings} aria-hidden="true">
          <Image
            src="/report/orbit-outer.svg"
            alt=""
            width={252}
            height={252}
            className={styles.orbitOuter}
            unoptimized
          />
          <Image
            src="/report/orbit-inner.svg"
            alt=""
            width={234}
            height={234}
            className={styles.orbitInner}
            unoptimized
          />
        </div>
        <div className={styles.portrait}>
          {tier.art === "lemon" ? (
            <Image src={tier.image} alt={`${tier.name} 커플`} width={224} height={168} sizes="224px" preload className={styles.lemonPair} />
          ) : (
            <>
              <div className={styles.guideCrop}>
                <Image src="/report/couples/layers/guide.png" alt="" width={224} height={168} sizes="224px" preload className={styles.guideImage} />
              </div>
              {tier.art === "mint" && (
                <div className={styles.mintPartner}><Image src={tier.image} alt={`${tier.name} 커플`} width={177} height={132} sizes="177px" preload /></div>
              )}
              {tier.art === "pickle" && (
                <Image src={tier.image} alt={`${tier.name} 커플`} width={125} height={83} sizes="125px" preload className={styles.picklePartner} />
              )}
              {tier.art === "twisted" && (
                <Image src={tier.image} alt={`${tier.name} 커플`} width={120} height={80} sizes="120px" preload className={styles.twistedPartner} />
              )}
              {tier.art === "onigiri" && (
                <Image src={tier.image} alt={`${tier.name} 커플`} width={89} height={89} sizes="89px" preload className={styles.onigiriPartner} />
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles.heroCopy}>
        <div className={styles.tierHeading}>
          <h1>{tier.name} 커플</h1>
          <p>{tier.tagline}</p>
        </div>
        <div className={styles.scoreSummary}>
          <div className={styles.scoreCard}>
            <span>궁합</span>
            <div
              className={styles.heroTrack}
              role="meter"
              aria-label="궁합 · 다섯 관계 축 평균"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={score}
            >
              <div className={styles.barFill} style={{ width: `${score}%` }} />
              <Image
                src="/report/score-mascot.png"
                alt=""
                width={35}
                height={42}
                sizes="35px"
                className={styles.scoreMascot}
                style={{ left: `${score}%` }}
              />
            </div>
            <strong>{score}점</strong>
          </div>
          <p className={styles.scoreDescription}>
            {tier.compatibility} {tier.fandom}
          </p>
        </div>
      </div>
    </header>
  );
}

export function ChartCard({ name, favorite, chart }: { name: string; favorite?: boolean; chart: ChartResult }) {
  const pillar = chart.variants[0];

  return (
    <section className={`${styles.overviewCard} ${favorite ? styles.favoriteCard : styles.selfCard}`} aria-label={`${name} 님의 명식`}>
      <div className={styles.cardHeading}>
        <div>
          <p className={styles.eyebrow}>{name}님의 만세력</p>
          <h2>{favorite ? "마음이 향하는 별의 좌표" : "흙더미 속 다이아 원석"}</h2>
        </div>
      </div>
      <dl className={styles.pillars}>
        {([0, 1] as const).flatMap((row) =>
          ([
            ["hour", "시주"],
            ["day", "일주"],
            ["month", "월주"],
            ["year", "연주"],
          ] as const).map(([key, label]) => {
            const value = pillar[key];
            const stem = value?.[0] as HeavenlyStem;
            const branch = value?.[1] as EarthlyBranch;
            const dayMaster = pillar.day[0] as HeavenlyStem;
            const element = value
              ? row === 0
                ? getHeavenlyStemElement(stem)
                : getEarthlyBranchElement(branch)
              : "미상";
            const hanja = !value
              ? "—"
              : row === 0
                ? HEAVENLY_STEMS_HANJA[HEAVENLY_STEMS.indexOf(stem)]
                : EARTHLY_BRANCHES_HANJA[EARTHLY_BRANCHES.indexOf(branch)];
            const tenGod = !value
              ? "시간 미입력"
              : row === 0 && key === "day"
                ? "일간"
                : row === 0
                  ? getTenGod(dayMaster, stem)
                  : getBranchTenGod(dayMaster, branch);

            return (
              <div key={`${key}-${row}`} className={value ? styles.pillar : `${styles.pillar} ${styles.unknown}`}>
                <dt>{label}·{element}</dt>
                <dd aria-label={`${label} ${row === 0 ? "천간" : "지지"} ${value?.[row] ?? "미상"}`}>{hanja}</dd>
                <dd className={styles.elements}>{tenGod}</dd>
              </div>
            );
          }),
        )}
      </dl>
      {!favorite && (
        <div className={styles.chartSummary}>
          <p className={styles.chartSummaryLabel}>한 줄 요약</p>
          <p className={styles.chartSummaryText}>{chartOneLineSummary(pillar, name)}</p>
        </div>
      )}
      {!pillar.hour && <p className={styles.smallCopy}>입력하지 않은 출생시각은 임의로 만들지 않아 시주를 제외했어요.</p>}
    </section>
  );
}
