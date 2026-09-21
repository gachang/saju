"use client";

import { useRouter } from "next/navigation";
import { ResultScreen } from "./ResultScreen";
import type { SharedReportRecord } from "@/lib/shared-report-schema";

export function SharedReportClient({
  kakaoJavascriptKey,
  report,
  shareUrl,
}: {
  kakaoJavascriptKey: string;
  report: SharedReportRecord;
  shareUrl: string;
}) {
  const router = useRouter();

  return (
    <ResultScreen
      kakaoJavascriptKey={kakaoJavascriptKey}
      sharedReport={report}
      initialShareUrl={shareUrl}
      onRestart={() => router.push("/")}
    />
  );
}
