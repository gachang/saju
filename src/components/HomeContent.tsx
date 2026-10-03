import Link from "next/link";
import { GUIDES } from "@/lib/public-content";
import styles from "./HomeContent.module.css";

export function HomeContent() {
  return (
    <div id="service-guide" className={styles.content}>
      <section className={styles.introduction} aria-labelledby="service-title">
        <p className={styles.eyebrow}>성덕기니 사용 안내</p>
        <h2 id="service-title">좋아하는 마음을<br />새로운 이야기로 읽어보기</h2>
        <p>
          성덕기니는 나와 최애의 출생 정보로 만세력을 계산하고, 전통 명리의 상징을
          팬과 아티스트의 관계에 빗대어 읽는 궁합 콘텐츠예요. 첫 입덕의 장면부터
          나에게 맞는 덕질 방식까지, 좋아하는 마음을 다른 각도로 살펴볼 수 있어요.
        </p>
        <p>
          계산된 명식과 그 명식을 바탕으로 쓴 이야기는 서로 달라요. 생년월일에서
          나온 간지는 계산 결과이고, 팬 활동에 연결한 해석은 재미로 읽는 상징적
          이야기예요. 상대의 실제 성격이나 마음, 만남과 미래를 알아내는 검사는 아니에요.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryLink} href="/example-report">공개 예시 보고서 읽기 <span aria-hidden="true">↗</span></Link>
          <Link className={styles.secondaryLink} href="/guides">만세력·궁합 안내서 보기 <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="calculation-title">
        <p className={styles.eyebrow}>계산에서 이야기까지</p>
        <h2 id="calculation-title">어떻게 만들어지나요?</h2>
        <ol className={styles.steps}>
          <li>
            <span className={styles.number} aria-hidden="true">01</span>
            <div>
              <h3>출생 정보로 만세력을 계산해요</h3>
              <p>양력·음력과 생년월일, 알고 있는 출생 시각을 입력해요. 달력을 변환하고 절기와 날짜 경계를 적용해 연주·월주·일주·시주를 구해요. 시간을 모르면 시주를 임의로 채우지 않아요.</p>
            </div>
          </li>
          <li>
            <span className={styles.number} aria-hidden="true">02</span>
            <div>
              <h3>두 명식의 관계를 비교해요</h3>
              <p>연주·월주·일주의 천간과 지지를 비교해요. 오행의 관계와 합·충 등 정해진 규칙으로 끌림, 소통, 안정, 성장, 덕질 텐션의 다섯 항목을 계산해요.</p>
            </div>
          </li>
          <li>
            <span className={styles.number} aria-hidden="true">03</span>
            <div>
              <h3>여덟 챕터의 이야기로 풀어요</h3>
              <p>AI는 계산 결과를 바탕으로 입덕 장면, 끌리는 이유, 팬 활동 방식, 몰입과 휴식, 궁합, 쉬어 가는 선택, 상상 속 만남, 오래 즐길 조건을 서로 다른 관점으로 써요.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className={styles.scoreCard} aria-labelledby="score-title">
        <p className={styles.eyebrow}>숫자 읽는 법</p>
        <h2 id="score-title">궁합 점수는 무엇을 뜻하나요?</h2>
        <p>
          1~100점은 성덕기니의 비교 규칙을 보기 쉽게 표현한 콘텐츠 점수예요.
          연주 20%, 월주 30%, 일주 50%의 비중을 적용하고, 다섯 항목의 평균을
          서비스 기준에 따라 1~100 범위로 보정해요. 출생 시각을 알더라도 현재 점수에는 시주를 넣지 않아요.
        </p>
        <p>
          점수가 높다고 최애가 나를 좋아할 확률이 높아지거나, 낮다고 팬 활동이
          어울리지 않는다는 뜻은 아니에요. 점수 옆 설명과 각 챕터를 함께 읽으며
          재미있는 차이와 닮은 점을 찾아보세요.
        </p>
        <Link className={styles.textLink} href="/guides/compatibility">점수 계산 기준 자세히 읽기 <span aria-hidden="true">→</span></Link>
      </section>

      <section className={styles.section} aria-labelledby="guide-list-title">
        <p className={styles.eyebrow}>입력 없이 읽는 안내서</p>
        <h2 id="guide-list-title">보고서가 궁금하다면</h2>
        <div className={styles.guideList}>
          {GUIDES.map((guide) => (
            <Link className={styles.guideCard} key={guide.slug} href={`/guides/${guide.slug}`}>
              <span className={styles.eyebrow}>{guide.eyebrow}</span>
              <h3>{guide.title}</h3>
              <p>{guide.description}</p>
              <span className={styles.readMore}>안내서 읽기 <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <p className={styles.eyebrow}>자주 묻는 질문</p>
        <h2 id="faq-title">시작하기 전에</h2>
        <div className={styles.faq}>
          <h3>태어난 시간을 몰라도 되나요?</h3>
          <p>네. 입력 화면에서 ‘태어난 시간을 몰라요’를 선택하세요. 보고서에는 시간을 제외한 명식이 표시돼요. 날짜 경계에 따라 명식 후보가 여러 개 생기는 경우와 현재 대표 명식을 쓰는 방식은 출생 시각 안내서에서 확인할 수 있어요.</p>
          <h3>최애의 생일만 알고 있어요.</h3>
          <p>공개된 생일을 입력하고 시각은 미상으로 두세요. 알려지지 않은 시각을 추측해서 넣지 않는 편이 좋아요. 그룹명은 선택 사항이고, 같은 생일의 아티스트라도 실제 개인의 성격을 판별하는 결과는 아니에요.</p>
          <h3>예시 보고서도 직접 생성해야 하나요?</h3>
          <p>아니요. 공개 예시 보고서는 가상의 팬과 아티스트로 구성한 편집 예시라서 입력이나 생성 대기 없이 바로 읽을 수 있어요. 개인 보고서를 공유할 때 만들어지는 3일 유효 링크와 달리, 이 예시와 안내서는 계속 공개돼요.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link href="/example-report">공개 예시 보고서</Link>
        <span aria-hidden="true">·</span>
        <Link href="/guides">만세력·궁합 안내서</Link>
        <p>성덕기니 · 팬의 일상에서 즐기는 상징적 사주 이야기</p>
      </footer>
    </div>
  );
}
