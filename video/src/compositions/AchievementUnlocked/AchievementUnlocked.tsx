import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig, interpolate, useCurrentFrame, spring } from "remotion";
import { DarkCanvas } from "../../components/Layout/DarkCanvas";
import { GlassCard } from "../../components/Layout/GlassCard";
import { Logo } from "../../components/Brand/Logo";
import { Footer } from "../../components/Brand/Footer";
import { Watermark } from "../../components/Brand/Watermark";
import { Heading } from "../../components/Typography/Heading";
import { MonoStat } from "../../components/Typography/MonoStat";
import { Confetti } from "../../components/Effects/Confetti";
import { NeonGlow } from "../../components/Effects/NeonGlow";
import { colors, fonts } from "../../styles/theme";
import type { AchievementProps } from "./schema";

const PulseRing: React.FC<{ color: string; delay: number }> = ({ color, delay }) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - delay);
  const scale = interpolate(adjustedFrame % 40, [0, 40], [0.8, 2.5]);
  const opacity = interpolate(adjustedFrame % 40, [0, 40], [0.6, 0]);

  return (
    <div
      style={{
        position: "absolute",
        width: 200,
        height: 200,
        borderRadius: "50%",
        border: `3px solid ${color}`,
        opacity,
        transform: `scale(${scale})`,
      }}
    />
  );
};

export const AchievementUnlocked: React.FC<AchievementProps> = ({
  runnerName,
  achievementTitle,
  achievementDescription,
  type,
  tier,
  level,
  streakDays,
  milestoneValue,
  xpTotal,
}) => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const isVertical = height > width;

  const badgeColor = tier ? colors.tier[tier] : colors.accent.gold;

  const badgeIcon = {
    tier_up: "🏆",
    streak: "🔥",
    xp_level: "⚡",
    distance_milestone: "🎯",
    custom: "🏅",
  }[type];

  return (
    <AbsoluteFill>
      <DarkCanvas>
        <Watermark />

        {/* Scene 1: Build-up — dark with pulsing rings */}
        <Sequence from={0} durationInFrames={Math.round(fps * 2)}>
          <AbsoluteFill
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PulseRing color={badgeColor} delay={0} />
            <PulseRing color={badgeColor} delay={15} />
            <Heading text="ACHIEVEMENT" size={isVertical ? 20 : 24} color={colors.text.muted} delay={10} />
          </AbsoluteFill>
        </Sequence>

        {/* Scene 2: Badge reveal */}
        <Sequence from={Math.round(fps * 2)} durationInFrames={Math.round(fps * 3.5)}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
            }}
          >
            <NeonGlow color={badgeColor} intensity={1.5}>
              <div
                style={{
                  fontSize: isVertical ? 80 : 100,
                  lineHeight: 1,
                }}
              >
                {badgeIcon}
              </div>
            </NeonGlow>

            <Heading
              text="UNLOCKED"
              size={isVertical ? 18 : 22}
              color={badgeColor}
              delay={8}
            />

            <GlassCard delay={12} width={isVertical ? "85%" : "50%"} padding={24}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: isVertical ? 28 : 36,
                    fontWeight: 700,
                    color: colors.text.primary,
                    fontFamily: fonts.heading,
                    marginBottom: 8,
                  }}
                >
                  {achievementTitle}
                </div>
                {achievementDescription && (
                  <div
                    style={{
                      fontSize: 16,
                      color: colors.text.secondary,
                      fontFamily: fonts.body,
                    }}
                  >
                    {achievementDescription}
                  </div>
                )}
              </div>
            </GlassCard>

            <div style={{ display: "flex", gap: 40, marginTop: 10 }}>
              {tier && (
                <MonoStat value={tier.toUpperCase()} label="New Tier" color={colors.tier[tier]} size={24} delay={25} />
              )}
              {level && (
                <MonoStat value={`LVL ${level}`} label="Level" color={colors.accent.gold} size={24} delay={28} />
              )}
              {streakDays && (
                <MonoStat value={`${streakDays}d`} label="Streak" color={colors.accent.pink} size={24} delay={30} />
              )}
            </div>
          </AbsoluteFill>

          <Confetti count={50} startFrame={5} />
        </Sequence>

        {/* Scene 3: Outro */}
        <Sequence from={Math.round(fps * 5.5)} durationInFrames={Math.round(fps * 2.5)}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <Logo size={40} />
            <Heading text={runnerName} size={28} delay={5} />
            {xpTotal && (
              <MonoStat value={`${xpTotal} XP`} label="Total XP" color={colors.accent.gold} size={22} delay={12} />
            )}
          </AbsoluteFill>
          <Footer />
        </Sequence>
      </DarkCanvas>
    </AbsoluteFill>
  );
};
