import { Stage } from "@/components/Stage";
import { getKakaoJavascriptKey } from "@/lib/kakao-config.server";

export default function Home() {
  return <Stage kakaoJavascriptKey={getKakaoJavascriptKey()} />;
}
