import { z } from "zod";

export const runRecapSchema = z.object({
  runnerName: z.string(),
  date: z.string(),
  distance: z.number(),
  distanceUnit: z.enum(["km", "mi"]).default("km"),
  duration: z.string(),
  paceMinutes: z.number(),
  paceSeconds: z.number(),
  calories: z.number().optional(),
  elevationGain: z.number().optional(),
  averageHeartRate: z.number().optional(),
  achievements: z.array(z.string()).default([]),
  tier: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  xpEarned: z.number().optional(),
  backgroundImage: z.string().optional(),
  style: z.enum(["hype", "clean", "celebratory", "cinematic"]).default("clean"),
});

export type RunRecapProps = z.infer<typeof runRecapSchema>;
