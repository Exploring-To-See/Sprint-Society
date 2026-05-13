import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
  Img,
  staticFile,
} from "remotion";
import { DarkCanvas } from "../../components/Layout/DarkCanvas";
import { GlassCard } from "../../components/Layout/GlassCard";
import { Logo } from "../../components/Brand/Logo";
import { Footer } from "../../components/Brand/Footer";
import { Watermark } from "../../components/Brand/Watermark";
import { Heading } from "../../components/Typography/Heading";
import { MonoStat } from "../../components/Typography/MonoStat";
import { StatCard } from "../../components/Stats/StatCard";
import { PaceDisplay } from "../../components/Stats/PaceDisplay";
import { NeonGlow } from "../../components/Effects/NeonGlow";
import { GradientWipe } from "../../components/Effects/GradientWipe";
import { colors } from "../../styles/theme";
import type { RunRecapProps } from "./schema";

export const RunRecap: React.FC<RunRecapProps> = ({
  runnerName,
  date,
  distance,
  distanceUnit,
  duration,
  paceMinutes,
  paceSeconds,
  calories,
  elevationGain,
  achievements,
  tier,
  xpEarned,
  backgroundImage,
  style: videoStyle,
}) => {
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  return (
    <AbsoluteFill>
      <DarkCanvas>
        {backgroundImage && (
          <AbsoluteFill style={{ opacity: 0.15 }}>
            <Img
              src={staticFile(backgroundImage)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        )}

        <Watermark />

        {/* Scene 1: Logo + Date intro */}
        <Sequence from={0} durationInFrames={fps * 2.5}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 30,
            }}
          >
            <Logo size={isVertical ? 50 : 60} />
            <Heading text={date} size={isVertical ? 24 : 28} color={colors.text.secondary} delay={15} />
            <Heading text={`${runnerName}'s Run`} size={isVertical ? 36 : 44} delay={25} />
          </AbsoluteFill>
          <GradientWipe startFrame={fps * 2} duration={15} color={colors.accent.green} />
        </Sequence>

        {/* Scene 2: Main Stats */}
        <Sequence from={Math.round(fps * 2.5)} durationInFrames={fps * 4}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: isVertical ? 40 : 30,
              padding: isVertical ? "60px 40px" : "40px 80px",
            }}
          >
            <NeonGlow color={colors.accent.blue}>
              <PaceDisplay minutes={paceMinutes} seconds={paceSeconds} unit={`min/${distanceUnit}`} />
            </NeonGlow>

            <div
              style={{
                display: "flex",
                flexDirection: isVertical ? "column" : "row",
                gap: 16,
                width: "100%",
                maxWidth: 500,
              }}
            >
              <StatCard
                value={`${distance} ${distanceUnit}`}
                label="Distance"
                icon="🏃"
                color={colors.accent.green}
                delay={10}
              />
              <StatCard
                value={duration}
                label="Duration"
                icon="⏱️"
                color={colors.accent.blue}
                delay={18}
              />
            </div>

            {(calories || elevationGain) && (
              <div
                style={{
                  display: "flex",
                  flexDirection: isVertical ? "column" : "row",
                  gap: 16,
                  width: "100%",
                  maxWidth: 500,
                }}
              >
                {calories && (
                  <StatCard
                    value={`${calories}`}
                    label="Calories"
                    icon="🔥"
                    color={colors.accent.pink}
                    delay={26}
                  />
                )}
                {elevationGain && (
                  <StatCard
                    value={`${elevationGain}m`}
                    label="Elevation"
                    icon="⛰️"
                    color={colors.accent.gold}
                    delay={32}
                  />
                )}
              </div>
            )}
          </AbsoluteFill>
        </Sequence>

        {/* Scene 3: Achievements + XP */}
        <Sequence from={Math.round(fps * 6.5)} durationInFrames={fps * 3}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
              padding: "40px",
            }}
          >
            {achievements.length > 0 && (
              <GlassCard delay={0} width={isVertical ? "90%" : "60%"}>
                <Heading text="Achievements" size={24} color={colors.accent.gold} />
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {achievements.map((a, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 18,
                        color: colors.text.primary,
                        fontFamily: "Inter",
                        padding: "8px 0",
                        borderBottom: i < achievements.length - 1 ? `1px solid ${colors.bg.tertiary}` : "none",
                      }}
                    >
                      🏅 {a}
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {(tier || xpEarned) && (
              <div style={{ display: "flex", gap: 30, marginTop: 10 }}>
                {tier && (
                  <MonoStat
                    value={tier.toUpperCase()}
                    label="Tier"
                    color={colors.tier[tier]}
                    size={28}
                    delay={15}
                  />
                )}
                {xpEarned && (
                  <MonoStat
                    value={`+${xpEarned}`}
                    label="XP Earned"
                    color={colors.accent.gold}
                    size={28}
                    delay={22}
                  />
                )}
              </div>
            )}
          </AbsoluteFill>
        </Sequence>

        {/* Scene 4: Outro */}
        <Sequence from={Math.round(fps * 9.5)} durationInFrames={Math.round(fps * 2.5)}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <Logo size={40} />
            <Heading text="Keep Running." size={32} color={colors.accent.green} delay={10} />
          </AbsoluteFill>
          <Footer />
        </Sequence>
      </DarkCanvas>
    </AbsoluteFill>
  );
};
