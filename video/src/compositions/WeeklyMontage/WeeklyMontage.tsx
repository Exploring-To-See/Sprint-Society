import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { DarkCanvas } from "../../components/Layout/DarkCanvas";
import { GlassCard } from "../../components/Layout/GlassCard";
import { Logo } from "../../components/Brand/Logo";
import { Footer } from "../../components/Brand/Footer";
import { Watermark } from "../../components/Brand/Watermark";
import { Heading } from "../../components/Typography/Heading";
import { MonoStat } from "../../components/Typography/MonoStat";
import { StatCard } from "../../components/Stats/StatCard";
import { GradientWipe } from "../../components/Effects/GradientWipe";
import { NeonGlow } from "../../components/Effects/NeonGlow";
import { colors, fonts } from "../../styles/theme";
import type { WeeklyMontageProps } from "./schema";

const RunCard: React.FC<{
  day: string;
  distance: string;
  pace: string;
  duration: string;
  highlight?: string;
  index: number;
  isVertical: boolean;
}> = ({ day, distance, pace, duration, highlight, index, isVertical }) => {
  return (
    <GlassCard delay={index * 6} padding={isVertical ? 20 : 24}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: colors.text.primary, fontFamily: fonts.heading }}>
            {day}
          </span>
          <span style={{ fontSize: 14, color: colors.accent.green, fontFamily: fonts.mono }}>
            {distance}
          </span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <span style={{ fontSize: 13, color: colors.text.secondary, fontFamily: fonts.mono }}>
            {pace} pace
          </span>
          <span style={{ fontSize: 13, color: colors.text.muted, fontFamily: fonts.mono }}>
            {duration}
          </span>
        </div>
        {highlight && (
          <span style={{ fontSize: 12, color: colors.accent.gold, fontFamily: fonts.body, marginTop: 4 }}>
            ⭐ {highlight}
          </span>
        )}
      </div>
    </GlassCard>
  );
};

export const WeeklyMontage: React.FC<WeeklyMontageProps> = ({
  runnerName,
  weekNumber,
  weekDateRange,
  runs,
  weeklyTotals,
  tier,
  streakDays,
  xpEarned,
}) => {
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const framesPerRun = Math.round(fps * 1.2);
  const runsSceneDuration = runs.length * framesPerRun + fps;

  return (
    <AbsoluteFill>
      <DarkCanvas>
        <Watermark />

        {/* Scene 1: Week header */}
        <Sequence from={0} durationInFrames={Math.round(fps * 2.5)}>
          <AbsoluteFill
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}
          >
            <Logo size={36} />
            <Heading text={`Week ${weekNumber}`} size={isVertical ? 42 : 52} delay={8} />
            <Heading text={weekDateRange} size={18} color={colors.text.secondary} delay={16} />
            <Heading text={runnerName} size={22} color={colors.accent.blue} delay={22} />
          </AbsoluteFill>
          <GradientWipe startFrame={Math.round(fps * 2)} duration={12} color={colors.accent.green} />
        </Sequence>

        {/* Scene 2: Run cards rapid-fire */}
        <Sequence from={Math.round(fps * 2.5)} durationInFrames={runsSceneDuration}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: isVertical ? "60px 30px" : "40px 80px",
            }}
          >
            <Heading text="Your Runs" size={20} color={colors.text.muted} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 500 }}>
              {runs.map((run, i) => (
                <RunCard
                  key={i}
                  day={run.day}
                  distance={run.distance}
                  pace={run.pace}
                  duration={run.duration}
                  highlight={run.highlight}
                  index={i}
                  isVertical={isVertical}
                />
              ))}
            </div>
          </AbsoluteFill>
        </Sequence>

        {/* Scene 3: Weekly totals */}
        <Sequence from={Math.round(fps * 2.5) + runsSceneDuration} durationInFrames={Math.round(fps * 4)}>
          <AbsoluteFill
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: 40 }}
          >
            <Heading text="Weekly Summary" size={isVertical ? 28 : 32} color={colors.text.primary} />

            <NeonGlow color={colors.accent.green}>
              <MonoStat
                value={weeklyTotals.totalDistance}
                label="Total Distance"
                color={colors.accent.green}
                size={isVertical ? 40 : 48}
                delay={5}
              />
            </NeonGlow>

            <div style={{ display: "flex", gap: isVertical ? 20 : 40, flexWrap: "wrap", justifyContent: "center" }}>
              <MonoStat value={weeklyTotals.totalTime} label="Time" color={colors.accent.blue} size={22} delay={12} />
              <MonoStat value={weeklyTotals.avgPace} label="Avg Pace" color={colors.accent.pink} size={22} delay={18} />
              <MonoStat value={`${weeklyTotals.runsCompleted}`} label="Runs" color={colors.accent.gold} size={22} delay={24} />
            </div>

            <div style={{ display: "flex", gap: 30, marginTop: 16 }}>
              {tier && <MonoStat value={tier.toUpperCase()} label="Tier" color={colors.tier[tier]} size={18} delay={30} />}
              {streakDays && <MonoStat value={`${streakDays}d`} label="Streak" color={colors.accent.pink} size={18} delay={34} />}
              {xpEarned && <MonoStat value={`+${xpEarned}`} label="XP" color={colors.accent.gold} size={18} delay={38} />}
            </div>
          </AbsoluteFill>
        </Sequence>

        {/* Scene 4: Outro */}
        <Sequence from={Math.round(fps * 6.5) + runsSceneDuration} durationInFrames={Math.round(fps * 2)}>
          <AbsoluteFill
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}
          >
            <Logo size={36} />
            <Heading text="See You Next Week" size={24} color={colors.accent.green} delay={8} />
          </AbsoluteFill>
          <Footer />
        </Sequence>
      </DarkCanvas>
    </AbsoluteFill>
  );
};
