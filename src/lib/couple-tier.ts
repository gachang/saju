export type CoupleTier = {
  min: number;
  max: number;
  name: string;
  tagline: string;
  compatibility: string;
  fandom: string;
  art: "mint" | "pickle" | "lemon" | "twisted" | "onigiri";
  image: string;
};

export const COUPLE_TIERS: readonly CoupleTier[] = [
  {
    min: 81,
    max: 100,
    name: "민트초코기니피그",
    tagline: "남들은 몰라도 나한테는 완벽한, 취향 확신형 궁합",
    compatibility:
      "궁합 기운의 결이 선명하게 맞물리고 서로에게 없는 부분까지 자연스럽게 채워주는, 남의 평가와 상관없이 둘 사이에서는 유독 잘 맞는 최상위 조합이에요.",
    fandom:
      "덕질 인기 순위나 남의 평가에는 전혀 흔들리지 않고, 아직 아무도 알아보지 못한 매력을 먼저 발견해 끝까지 믿고 파는 확신형 덕질이에요.",
    art: "mint",
    image: "/report/couples/layers/mint-choco.png",
  },
  {
    min: 61,
    max: 80,
    name: "피클기니피그",
    tagline: "퍽퍽한 삶 속에서, 없어선 안 될 톡 쏘는 피클 같은 궁합",
    compatibility:
      "궁합 사주에서 부족한 기운을 상대가 정확하게 채워주는 자리에 있어, 화려하게 불타오르진 않아도 곁에 있을수록 은근히 균형이 맞는 조합이에요.",
    fandom:
      "덕질 시간과 돈을 크게 쓰지는 않아도 노래 한 곡, 무대 영상 하나만으로 퍽퍽한 하루를 버티게 해주는 생활밀착형 덕질이에요.",
    art: "pickle",
    image: "/report/couples/layers/pickle.png",
  },
  {
    min: 41,
    max: 60,
    name: "레몬기니피그",
    tagline: "첫인상은 시큼했는데 알고 보니 없으면 허전한, 뒤늦은 입덕형 궁합",
    compatibility:
      "궁합 천간에서는 부딪히는 기운이 있지만 지지에서는 서로 맞물리는 부분이 있어, 처음보다 알아갈수록 점점 매력이 살아나는 조합이에요.",
    fandom:
      "덕질 괜한 선입견이나 관심 없는 척을 하다가 무대 하나에 제대로 뒤통수를 맞고, 뒤늦게 데뷔 초 콘텐츠까지 역주행하며 파는 늦덕이에요.",
    art: "lemon",
    image: "/report/couples/layers/lemon.png",
  },
  {
    min: 21,
    max: 40,
    name: "꽈배기니피그",
    tagline: "결이 안 맞아 자꾸 엇갈려도, 꼬인 채로 함께 가는 궁합",
    compatibility:
      "궁합 여러 자리에서 기운이 어긋나고 타이밍도 자주 꼬이지만, 이상하게 완전히 끊어지지는 않고 다시 돌아오게 되는 힘이 남아 있는 조합이에요.",
    fandom:
      "덕질 활동 방향이 아쉽다며 탈덕 선언을 몇 번이나 해놓고도, 티저 하나 뜨면 슬쩍 확인하고 컴백 무대까지 결국 챙겨보는 미련형 덕질이에요.",
    art: "twisted",
    image: "/report/couples/layers/twisted.png",
  },
  {
    min: 0,
    max: 20,
    name: "오니기리피그",
    tagline: "심심해 보여도 속은 꽉 찬, 오래 남는 차애 궁합",
    compatibility:
      "궁합에서 강한 합도 충도 두드러지지 않아 기운이 크게 맞물리지는 않지만, 그만큼 감정 소모도 적어 조용하고 담백하게 이어지는 조합이에요.",
    fandom:
      "덕질 좋아하는 아이돌이 따로 있고 1순위가 되는 일도 드물지만, 플레이리스트와 관심 목록에서는 이상하게 한 번도 완전히 빠진 적 없는 꾸준한 차애 포지션이에요.",
    art: "onigiri",
    image: "/report/couples/layers/onigiri.png",
  },
] as const;

export function getCoupleTier(score: number): CoupleTier {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  return COUPLE_TIERS.find((tier) => normalized >= tier.min && normalized <= tier.max) ?? COUPLE_TIERS.at(-1)!;
}
