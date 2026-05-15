import React from "react";
import { Composition } from "remotion";
import { RunRecap } from "./compositions/RunRecap/RunRecap";
import { AchievementUnlocked } from "./compositions/AchievementUnlocked/AchievementUnlocked";
import { TransformationJourney } from "./compositions/TransformationJourney/TransformationJourney";
import { WeeklyMontage } from "./compositions/WeeklyMontage/WeeklyMontage";
import { ComingSoon } from "./compositions/ComingSoon/ComingSoon";
import { aspectRatios, fps } from "./styles/theme";

const defaultRunRecapProps = {
  runnerName: "Runner",
  date: "May 14, 2026",
  distance: 5.2,
  distanceUnit: "km" as const,
  duration: "28:45",
  paceMinutes: 5,
  paceSeconds: 32,
  calories: 420,
  elevationGain: 85,
  achievements: ["Personal Best 5K"],
  tier: "intermediate" as const,
  xpEarned: 150,
  style: "clean" as const,
};

const defaultAchievementProps = {
  runnerName: "Runner",
  achievementTitle: "Level Up!",
  achievementDescription: "You've reached a new tier",
  type: "tier_up" as const,
  tier: "intermediate" as const,
  level: 12,
  xpTotal: 2400,
  style: "celebratory" as const,
};

const defaultTransformationProps = {
  runnerName: "Runner",
  beforeLabel: "Week 1",
  afterLabel: "Week 8",
  beforeStats: { pace: "6:45", distance: "3km", frequency: "2x/week", tier: "beginner" as const },
  afterStats: { pace: "5:20", distance: "8km", frequency: "4x/week", tier: "intermediate" as const },
  improvements: [
    { label: "Pace", value: "-1:25" },
    { label: "Distance", value: "+167%" },
    { label: "Consistency", value: "+100%" },
  ],
  motivationalText: "Every step counts.",
  weeksCompleted: 8,
  style: "cinematic" as const,
};

const defaultComingSoonProps = {
  clips: [
    "assets/demo-run/clips/VIDEO-2025-07-06-13-53-25.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-06-13-54-39.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-06-13-55-23.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-06-13-55-43.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-06-13-54-05.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-23-10-23-24.mp4",
  ],
  tagline: "For the runners, by the runners.",
  launchText: "COMING SOON",
  style: "hype" as const,
};

const defaultWeeklyMontageProps = {
  runnerName: "Runner",
  weekNumber: 4,
  weekDateRange: "May 5 - May 11",
  runs: [
    { day: "Monday", distance: "5.1km", pace: "5:30", duration: "28:03" },
    { day: "Wednesday", distance: "3.2km", pace: "5:10", duration: "16:32", highlight: "Fastest 3K" },
    { day: "Saturday", distance: "10.0km", pace: "5:45", duration: "57:30" },
  ],
  weeklyTotals: { totalDistance: "18.3km", totalTime: "1h 42m", avgPace: "5:28", runsCompleted: 3 },
  tier: "intermediate" as const,
  streakDays: 21,
  xpEarned: 320,
  style: "hype" as const,
};

export const Root: React.FC = () => {
  return (
    <>
      {/* RunRecap — all aspect ratios */}
      <Composition
        id="RunRecap-Story"
        component={RunRecap}
        durationInFrames={fps * 12}
        fps={fps}
        width={aspectRatios.story.width}
        height={aspectRatios.story.height}
        defaultProps={defaultRunRecapProps}
      />
      <Composition
        id="RunRecap-Square"
        component={RunRecap}
        durationInFrames={fps * 12}
        fps={fps}
        width={aspectRatios.square.width}
        height={aspectRatios.square.height}
        defaultProps={defaultRunRecapProps}
      />
      <Composition
        id="RunRecap-Landscape"
        component={RunRecap}
        durationInFrames={fps * 12}
        fps={fps}
        width={aspectRatios.landscape.width}
        height={aspectRatios.landscape.height}
        defaultProps={defaultRunRecapProps}
      />

      {/* AchievementUnlocked — all aspect ratios */}
      <Composition
        id="Achievement-Story"
        component={AchievementUnlocked}
        durationInFrames={fps * 8}
        fps={fps}
        width={aspectRatios.story.width}
        height={aspectRatios.story.height}
        defaultProps={defaultAchievementProps}
      />
      <Composition
        id="Achievement-Square"
        component={AchievementUnlocked}
        durationInFrames={fps * 8}
        fps={fps}
        width={aspectRatios.square.width}
        height={aspectRatios.square.height}
        defaultProps={defaultAchievementProps}
      />
      <Composition
        id="Achievement-Landscape"
        component={AchievementUnlocked}
        durationInFrames={fps * 8}
        fps={fps}
        width={aspectRatios.landscape.width}
        height={aspectRatios.landscape.height}
        defaultProps={defaultAchievementProps}
      />

      {/* TransformationJourney — all aspect ratios */}
      <Composition
        id="Transformation-Story"
        component={TransformationJourney}
        durationInFrames={fps * 14}
        fps={fps}
        width={aspectRatios.story.width}
        height={aspectRatios.story.height}
        defaultProps={defaultTransformationProps}
      />
      <Composition
        id="Transformation-Square"
        component={TransformationJourney}
        durationInFrames={fps * 14}
        fps={fps}
        width={aspectRatios.square.width}
        height={aspectRatios.square.height}
        defaultProps={defaultTransformationProps}
      />
      <Composition
        id="Transformation-Landscape"
        component={TransformationJourney}
        durationInFrames={fps * 14}
        fps={fps}
        width={aspectRatios.landscape.width}
        height={aspectRatios.landscape.height}
        defaultProps={defaultTransformationProps}
      />

      {/* WeeklyMontage — all aspect ratios */}
      <Composition
        id="Montage-Story"
        component={WeeklyMontage}
        durationInFrames={fps * 18}
        fps={fps}
        width={aspectRatios.story.width}
        height={aspectRatios.story.height}
        defaultProps={defaultWeeklyMontageProps}
      />
      <Composition
        id="Montage-Square"
        component={WeeklyMontage}
        durationInFrames={fps * 18}
        fps={fps}
        width={aspectRatios.square.width}
        height={aspectRatios.square.height}
        defaultProps={defaultWeeklyMontageProps}
      />
      <Composition
        id="Montage-Landscape"
        component={WeeklyMontage}
        durationInFrames={fps * 18}
        fps={fps}
        width={aspectRatios.landscape.width}
        height={aspectRatios.landscape.height}
        defaultProps={defaultWeeklyMontageProps}
      />

      {/* ComingSoon — all aspect ratios */}
      <Composition
        id="ComingSoon-Story"
        component={ComingSoon}
        durationInFrames={540}
        fps={fps}
        width={aspectRatios.story.width}
        height={aspectRatios.story.height}
        defaultProps={defaultComingSoonProps}
      />
      <Composition
        id="ComingSoon-Square"
        component={ComingSoon}
        durationInFrames={fps * 12}
        fps={fps}
        width={aspectRatios.square.width}
        height={aspectRatios.square.height}
        defaultProps={defaultComingSoonProps}
      />
      <Composition
        id="ComingSoon-Landscape"
        component={ComingSoon}
        durationInFrames={fps * 12}
        fps={fps}
        width={aspectRatios.landscape.width}
        height={aspectRatios.landscape.height}
        defaultProps={defaultComingSoonProps}
      />
    </>
  );
};
