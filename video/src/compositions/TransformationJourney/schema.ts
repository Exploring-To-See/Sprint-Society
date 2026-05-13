import { z } from "zod";

export const transformationSchema = z.object({
  runnerName: z.string(),
  beforeLabel: z.string().default("Week 1"),
  afterLabel: z.string().default("Now"),
  beforeStats: z.object({
    pace: z.string(),
    distance: z.string(),
    frequency: z.string().optional(),
    tier: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  }),
  afterStats: z.object({
    pace: z.string(),
    distance: z.string(),
    frequency: z.string().optional(),
    tier: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  }),
  improvements: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).default([]),
  motivationalText: z.string().optional(),
  weeksCompleted: z.number().optional(),
  style: z.enum(["hype", "clean", "celebratory", "cinematic"]).default("cinematic"),
});

export type TransformationProps = z.infer<typeof transformationSchema>;
