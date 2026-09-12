"use client";

import { useRouter } from "next/navigation";
import { ResultScreen } from "./ResultScreen";
import { emptyPerson, type FormState } from "@/lib/saju";
import type { Report } from "@/lib/reading-schema";

// Synthetic fixture used for the accepted API report; never substitute it for a user's result.
const exampleForm: FormState = {
  self: { ...emptyPerson, name: "사용자", year: "2000", month: "2", day: "29", timeUnknown: true },
  partner: { ...emptyPerson, name: "최애", year: "1995", month: "8", day: "17", timeUnknown: true },
  groupName: "",
};

export function ReportExample({ report }: { report: Report }) {
  const router = useRouter();
  return <main className="flex min-h-dvh justify-center bg-ink-deep"><div className="h-dvh w-full max-w-(--stage-width)">
    <ResultScreen form={exampleForm} initialReport={report} example onRestart={() => router.push("/")} />
  </div></main>;
}
