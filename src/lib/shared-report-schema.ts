import { z } from "zod";
import { chartSchema, type ChartResult } from "./engine";
import { reportSchema } from "./reading-schema";

const displayNameSchema = z.string().trim().min(1).max(40);

/**
 * Only the chart selected for rendering is shared. Raw birth dates, times,
 * calendars, and the other uncertain chart candidates never leave the device.
 */
export const sharedChartSchema = z.object({
  variants: z.array(chartSchema).length(1),
  coverage: z.enum(["4주", "3주", "복수 명식"]),
  convention: z.string().trim().min(1).max(120),
}).strict();

export const sharedReportInputSchema = z.object({
  selfName: displayNameSchema,
  favoriteName: displayNameSchema,
  groupName: z.string().trim().max(80),
  selfChart: sharedChartSchema,
  favoriteChart: sharedChartSchema,
  report: reportSchema,
}).strict();

export const sharedReportRecordSchema = sharedReportInputSchema.extend({
  createdAt: z.iso.datetime({ offset: true }),
  expiresAt: z.iso.datetime({ offset: true }),
}).strict();

export type SharedChart = z.infer<typeof sharedChartSchema>;
export type SharedReportInput = z.infer<typeof sharedReportInputSchema>;
export type SharedReportRecord = z.infer<typeof sharedReportRecordSchema>;

export function selectSharedChart(chart: ChartResult): SharedChart {
  return sharedChartSchema.parse({
    variants: chart.variants.slice(0, 1),
    coverage: chart.coverage,
    convention: chart.convention,
  });
}
