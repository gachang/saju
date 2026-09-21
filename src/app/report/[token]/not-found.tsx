import Link from "next/link";

export default function SharedReportNotFound() {
  return (
    <main className="flex h-dvh w-dvw justify-center overflow-hidden bg-ink sm:items-center sm:bg-ink-deep">
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 overflow-hidden bg-ink px-8 text-center sm:max-h-[874px] sm:max-w-[402px] sm:shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        <h1 className="font-hambak text-2xl text-gold">보고서 링크가 사라졌어요</h1>
        <p className="break-keep text-sm leading-7 text-white/80">공유 후 3일이 지났거나 올바르지 않은 링크예요.</p>
        <Link className="rounded-2xl border border-gold px-8 py-3 font-hambak text-gold" href="/">새로 분석하기</Link>
      </div>
    </main>
  );
}
