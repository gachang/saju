import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SharedReportClient } from "@/components/SharedReportClient";
import {
  CANONICAL_ORIGIN,
  SHARE_DESCRIPTION,
  SHARE_PREVIEW_PATH,
  SHARE_TITLE,
} from "@/lib/kakao-share";
import {
  loadSharedReport,
  SharedReportStorageUnavailableError,
} from "@/lib/shared-reports.server";

type SharedReportPageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: SharedReportPageProps): Promise<Metadata> {
  const { token } = await params;
  const path = `/report/${encodeURIComponent(token)}`;

  return {
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    referrer: "no-referrer",
    robots: { index: false, follow: false, noarchive: true },
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: path,
      siteName: "성덕기니",
      title: SHARE_TITLE,
      description: SHARE_DESCRIPTION,
      images: [
        {
          url: SHARE_PREVIEW_PATH,
          width: 538,
          height: 272,
          alt: "성덕기니 궁합 보고서",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SHARE_TITLE,
      description: SHARE_DESCRIPTION,
      images: [SHARE_PREVIEW_PATH],
    },
  };
}

export default async function SharedReportPage({ params }: SharedReportPageProps) {
  const { token } = await params;
  let report;

  try {
    report = await loadSharedReport(token);
  } catch (error) {
    if (!(error instanceof SharedReportStorageUnavailableError)) throw error;
    return (
      <ReportShell>
        <section className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
          <h1 className="font-hambak text-2xl text-gold">보고서를 잠시 불러올 수 없어요</h1>
          <p className="break-keep text-sm leading-7 text-white/80">잠시 뒤 다시 열어 주세요.</p>
          <Link className="rounded-2xl border border-gold px-8 py-3 font-hambak text-gold" href="/">처음으로</Link>
        </section>
      </ReportShell>
    );
  }

  if (!report) notFound();

  const shareUrl = new URL(`/report/${token}`, CANONICAL_ORIGIN).toString();
  return (
    <ReportShell>
      <SharedReportClient report={report} shareUrl={shareUrl} />
    </ReportShell>
  );
}

function ReportShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-dvh w-dvw justify-center overflow-hidden bg-ink sm:items-center sm:bg-ink-deep">
      <div className="relative h-full w-full overflow-hidden bg-ink sm:max-h-[874px] sm:max-w-[402px] sm:shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-0">{children}</div>
      </div>
    </main>
  );
}
