import "server-only";

export function getKakaoJavascriptKey() {
  return (
    process.env.KAKAO_JAVASCRIPT_KEY?.trim()
    || process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim()
    || ""
  );
}
