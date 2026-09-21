export const CANONICAL_ORIGIN = "https://otaku-saju-web.vercel.app";
export const SHARE_PREVIEW_PATH = "/report/share-preview.png";
export const SHARE_PREVIEW_URL = `${CANONICAL_ORIGIN}${SHARE_PREVIEW_PATH}`;

export const SHARE_TITLE = "성덕기니 보고서";
export const SHARE_DESCRIPTION =
  "성덕기니가 자네와 그이의 궁합을 봐주겠네.";

export type KakaoShareTemplate = {
  objectType: "feed";
  content: {
    title: string;
    description: string;
    imageUrl: string;
    imageWidth: 538;
    imageHeight: 272;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
};

/**
 * Kakao Developers only permits links on a registered web domain. Keeping
 * every share target on the canonical origin also prevents an API response
 * from turning the share button into an arbitrary-link launcher.
 */
function canonicalReportUrl(reportUrl: string | URL): string {
  const url = new URL(reportUrl, `${CANONICAL_ORIGIN}/`);

  if (url.origin !== CANONICAL_ORIGIN) {
    throw new TypeError("The shared report URL must use the canonical origin.");
  }

  url.hash = "";
  return url.toString();
}

export function kakaoShareTemplate(
  reportUrl: string | URL,
): KakaoShareTemplate {
  const url = canonicalReportUrl(reportUrl);
  const link = { mobileWebUrl: url, webUrl: url };

  return {
    objectType: "feed",
    content: {
      title: SHARE_TITLE,
      description: SHARE_DESCRIPTION,
      imageUrl: SHARE_PREVIEW_URL,
      imageWidth: 538,
      imageHeight: 272,
      link,
    },
    buttons: [
      {
        title: "보고서 보기",
        link,
      },
    ],
  };
}
