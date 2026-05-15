import { z } from "zod";

export const comingSoonSchema = z.object({
  clips: z.array(z.string()).default([]),
  tagline: z.string().default("For the runners, by the runners."),
  launchText: z.string().default("COMING SOON"),
  style: z.enum(["hype", "cinematic"]).default("hype"),
});

export type ComingSoonProps = z.infer<typeof comingSoonSchema>;
