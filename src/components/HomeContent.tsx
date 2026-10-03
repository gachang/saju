import Link from "next/link";
import { GUIDES } from "@/lib/public-content";
import styles from "./HomeContent.module.css";

export function HomeContent() {
  return (
    <div id="service-guide" className={styles.content}>
      <section className={styles.introduction} aria-labelledby="service-title">
        <p className={styles.eyebrow}>성덕기니 사용 안내</p>
        <h1 id="service-title">좋아하는 마음을<br />새로운 이야기로 읽어보기</h1>
        <p>
          유독 눈길이 가는 무대, 자꾸 다시 듣게 되는 한 소절. 우리는 왜 그 사람을
          좋아하게 됐을까요? 성덕기니는 나와 최애의 출생 정보로 만세력을 계산하고,
          명리의 상징을 팬과 아티스트의 이야기로 풀어드려요. 첫 입덕의 장면부터
          나에게 맞는 덕질 방식까지, 익숙한 팬심을 조금 다른 각도로 만나보세요.
        </p>
        <p>
          생년월일에서 나온 만세력은 계산 결과예요. 그 글자들을 덕질 장면에 연결한
          보고서는 재미로 읽는 이야기고요. 최애의 속마음이나 미래의 만남을 맞히는
          대신, 좋아하는 동안 내 일상에 어떤 즐거움이 생기는지 함께 살펴볼게요.
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
              <p>나와 최애의 생년월일, 양력·음력, 알고 있는 출생 시각을 알려주세요. 성덕기니가 달력과 절기, 날짜 경계를 확인해 네 기둥을 계산할게요. 시각을 모르면 ‘태어난 시간을 몰라요’를 선택해 주세요. 시주를 임의로 만들지는 않아요.</p>
            </div>
          </li>
          <li>
            <span className={styles.number} aria-hidden="true">02</span>
            <div>
              <h3>두 명식의 관계를 비교해요</h3>
              <p>연주·월주·일주의 천간과 지지가 어떻게 이어지는지 살펴봐요. 오행의 관계와 합·충 등을 정해둔 규칙에 대입해서 끌림, 소통, 안정, 성장, 덕질 텐션의 다섯 항목을 계산해요.</p>
            </div>
          </li>
          <li>
            <span className={styles.number} aria-hidden="true">03</span>
            <div>
              <h3>여덟 챕터의 이야기로 풀어요</h3>
              <p>계산한 근거를 AI에 전달해 성덕기니의 여덟 챕터로 풀어드려요. 처음 눈길이 갔던 순간부터 끌림의 이유, 나에게 맞는 덕질과 쉬어 갈 때까지. 각 장에서 좋아하는 마음의 다른 면을 들여다봐요.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className={styles.scoreCard} aria-labelledby="score-title">
        <p className={styles.eyebrow}>숫자 읽는 법</p>
        <h2 id="score-title">궁합 점수는 무엇을 뜻하나요?</h2>
        <p>
          1~100점은 두 사주의 관계를 보기 쉽게 옮긴 성덕기니의 콘텐츠 점수예요.
          연주 20%, 월주 30%, 일주 50%의 비중을 적용한 다섯 항목의 평균을
          서비스 기준에 맞춰 1~100으로 보정해요. 시각을 알고 있어도 점수 계산에는 시주를 넣지 않아요.
        </p>
        <p>
          높게 나오면 반갑겠지만, 낮게 나왔다고 팬심까지 줄일 필요는 없어요.
          최애가 나를 좋아할 확률을 알려주는 숫자는 아니거든요. 점수 옆 설명과
          각 챕터를 함께 읽으며 재미있는 차이와 닮은 점을 찾아보세요.
        </p>
        <Link className={styles.textLink} href="/guides/compatibility">점수 계산 기준 자세히 읽기 <span aria-hidden="true">→</span></Link>
      </section>

      <section className={styles.section} aria-labelledby="guide-list-title">
        <p className={styles.eyebrow}>성덕기니가 알려드릴게요</p>
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
          <p>물론이죠. ‘태어난 시간을 몰라요’를 선택하면 시주를 비운 명식으로 읽어드려요. 절기 경계에 걸린 날에는 후보가 여럿 생길 수도 있어요. 그럴 때 대표 명식을 고르는 방식은 출생 시각 안내서에서 차근차근 알려드릴게요.</p>
          <h3>최애의 생일만 알고 있어요.</h3>
          <p>공개된 생일을 입력하고 시각은 미상으로 두면 돼요. 알려지지 않은 시간을 추측할 필요는 없어요. 그룹명은 선택 사항이에요. 생일로 만세력을 계산해도 실제 사적인 성격을 알 수 있는 건 아니라는 점은 기억해 주세요.</p>
          <h3>예시 보고서도 직접 생성해야 하나요?</h3>
          <p>아니요, 바로 펼쳐보면 돼요. 민서와 하루의 예시 이야기는 입력하거나 기다리지 않고 읽을 수 있어요. 내 보고서의 공유 링크는 3일 동안 열리지만, 예시 보고서와 안내서는 언제든 다시 찾아올 수 있어요.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link href="/example-report">공개 예시 보고서</Link>
        <span aria-hidden="true">·</span>
        <Link href="/guides">만세력·궁합 안내서</Link>
        <p>성덕기니 · 좋아하는 마음을 조금 다르게 읽어드려요</p>
      </footer>
    </div>
  );
}
