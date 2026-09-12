import type { Metadata } from "next";
import { ReportExample } from "@/components/ReportExample";
import { reportSchema } from "@/lib/reading-schema";
import fixture from "../../../../tests/fixtures/accepted-report.json";

export const metadata: Metadata = { title: "완성 보고서 예시 | 성덕기니", robots: { index: false, follow: false } };

export default function ExamplePage() {
  return <ReportExample report={reportSchema.parse(fixture.report)} />;
}
