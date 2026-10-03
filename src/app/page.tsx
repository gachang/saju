import { Stage } from "@/components/Stage";
import { HomeContent } from "@/components/HomeContent";
import { getKakaoJavascriptKey } from "@/lib/kakao-config.server";

export default function Home() {
  return <Stage kakaoJavascriptKey={getKakaoJavascriptKey()} introContent={<HomeContent />} />;
}
