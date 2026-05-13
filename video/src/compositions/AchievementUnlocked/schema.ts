import { z } from "zod";

export const achievementSchema = z.object({
  runnerName: z.string(),
  achievementTitle: z.string(),
  achievementDescription: z.string().optional(),
  type: z.enum(["tier_up", "streak", "xp_level", "distance_milestone", "custom"]),
  tier: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  level: z.number().optional(),
  streakDays: z.number().optional(),
  milestoneValue: z.string().optional(),
  xpTotal: z.number().optional(),
  style: z.enum(["hype", "clean", "celebratory", "cinematic"]).default("celebratory"),
});

export type AchievementProps = z.infer<typeof achievementSchema>;
