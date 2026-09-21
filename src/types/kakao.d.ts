import type { KakaoShareTemplate } from "@/lib/kakao-share";

declare global {
  interface Window {
    Kakao?: {
      init: (javascriptKey: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: KakaoShareTemplate) => void;
      };
    };
  }
}

export {};
