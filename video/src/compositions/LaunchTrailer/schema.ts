import { z } from "zod";

export const launchTrailerSchema = z.object({
  clips: z.array(z.string()).default([]),
  aiClips: z.array(z.string()).default([]),
  tagline: z.string().default("For the runners, by the runners."),
  ctaText: z.string().default("JOIN THE WAITLIST"),
  ctaUrl: z.string().default("sprintsociety.run"),
  style: z.enum(["hype", "cinematic"]).default("hype"),
});

export type LaunchTrailerProps = z.infer<typeof launchTrailerSchema>;
