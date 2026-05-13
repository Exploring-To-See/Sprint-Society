import { z } from "zod";

export const weeklyMontageSchema = z.object({
  runnerName: z.string(),
  weekNumber: z.number(),
  weekDateRange: z.string(),
  runs: z.array(z.object({
    day: z.string(),
    distance: z.string(),
    pace: z.string(),
    duration: z.string(),
    highlight: z.string().optional(),
  })),
  weeklyTotals: z.object({
    totalDistance: z.string(),
    totalTime: z.string(),
    avgPace: z.string(),
    runsCompleted: z.number(),
  }),
  tier: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  streakDays: z.number().optional(),
  xpEarned: z.number().optional(),
  style: z.enum(["hype", "clean", "celebratory", "cinematic"]).default("hype"),
});

export type WeeklyMontageProps = z.infer<typeof weeklyMontageSchema>;
