import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig, interpolate, useCurrentFrame } from "remotion";
import { DarkCanvas } from "../../components/Layout/DarkCanvas";
import { GlassCard } from "../../components/Layout/GlassCard";
import { Logo } from "../../components/Brand/Logo";
import { Footer } from "../../components/Brand/Footer";
import { Watermark } from "../../components/Brand/Watermark";
import { Heading } from "../../components/Typography/Heading";
import { MonoStat } from "../../components/Typography/MonoStat";
import { TextOverlay } from "../../components/Typography/TextOverlay";
import { GradientWipe } from "../../components/Effects/GradientWipe";
import { colors, fonts } from "../../styles/theme";
import type { TransformationProps } from "./schema";

const TimelineBar: React.FC<{ progress: number; color: string }> = ({ progress, color }) => {
  return (
    <div
      style={{
        width: "80%",
        height: 6,
        background: `${colors.bg.tertiary}`,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${color}, ${colors.accent.blue})`,
          borderRadius: 3,
          boxShadow: `0 0 10px ${color}60`,
        }}
      />
    </div>
  );
};

const StatBlock: React.FC<{
  label: string;
  pace: string;
  distance: string;
  frequency?: string;
  tier?: "beginner" | "intermediate" | "advanced";
  delay: number;
  side: "before" | "after";
}> = ({ label, pace, distance, frequency, tier, delay, side }) => {
  const borderColor = side === "before" ? colors.text.muted : colors.accent.green;

  return (
    <GlassCard delay={delay} padding={24}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 14,
            color: borderColor,
            fontFamily: fonts.body,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: 16,
          }}
        >
          {label}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: colors.text.primary, fontFamily: fonts.mono }}>
              {pace}
            </div>
            <div style={{ fontSize: 11, color: colors.text.secondary, fontFamily: fonts.body }}>PACE</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: colors.text.primary, fontFamily: fonts.mono }}>
              {distance}
            </div>
            <div style={{ fontSize: 11, color: colors.text.secondary, fontFamily: fonts.body }}>DISTANCE</div>
          </div>
          {frequency && (
            <div>
              <div style={{ fontSize: 18, color: colors.text.secondary, fontFamily: fonts.mono }}>
                {frequency}
              </div>
              <div style={{ fontSize: 11, color: colors.text.secondary, fontFamily: fonts.body }}>FREQUENCY</div>
            </div>
          )}
          {tier && (
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                color: colors.tier[tier],
                fontFamily: fonts.heading,
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {tier}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export const TransformationJourney: React.FC<TransformationProps> = ({
  runnerName,
  beforeLabel,
  afterLabel,
  beforeStats,
  afterStats,
  improvements,
  motivationalText,
  weeksCompleted,
}) => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const isVertical = height > width;

  return (
    <AbsoluteFill>
      <DarkCanvas>
        <Watermark />

        {/* Scene 1: Intro */}
        <Sequence from={0} durationInFrames={Math.round(fps * 2.5)}>
          <AbsoluteFill
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}
          >
            <Logo size={40} />
            <Heading text="Transformation" size={isVertical ? 36 : 44} delay={10} />
            <Heading text={runnerName} size={22} color={colors.text.secondary} delay={20} />
            {weeksCompleted && (
              <MonoStat value={`${weeksCompleted}`} label="Weeks" color={colors.accent.blue} size={28} delay={28} />
            )}
          </AbsoluteFill>
        </Sequence>

        {/* Scene 2: Before/After comparison */}
        <Sequence from={Math.round(fps * 2.5)} durationInFrames={Math.round(fps * 5)}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: isVertical ? "column" : "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              padding: isVertical ? "80px 30px" : "40px 60px",
            }}
          >
            <StatBlock
              label={beforeLabel}
              pace={beforeStats.pace}
              distance={beforeStats.distance}
              frequency={beforeStats.frequency}
              tier={beforeStats.tier}
              delay={0}
              side="before"
            />

            <div style={{ fontSize: 36, color: colors.accent.green }}>→</div>

            <StatBlock
              label={afterLabel}
              pace={afterStats.pace}
              distance={afterStats.distance}
              frequency={afterStats.frequency}
              tier={afterStats.tier}
              delay={15}
              side="after"
            />
          </AbsoluteFill>

          {/* Timeline bar at bottom */}
          <AbsoluteFill style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 80 }}>
            <TimelineBar
              progress={interpolate(frame - Math.round(fps * 2.5), [0, fps * 3], [0, 1], { extrapolateRight: "clamp" })}
              color={colors.accent.green}
            />
          </AbsoluteFill>
        </Sequence>

        {/* Scene 3: Improvements + motivation */}
        <Sequence from={Math.round(fps * 7.5)} durationInFrames={Math.round(fps * 4)}>
          <AbsoluteFill
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 40 }}
          >
            {improvements.length > 0 && (
              <div style={{ display: "flex", gap: 30, flexWrap: "wrap", justifyContent: "center" }}>
                {improvements.map((imp, i) => (
                  <MonoStat
                    key={i}
                    value={imp.value}
                    label={imp.label}
                    color={colors.accent.green}
                    size={24}
                    delay={i * 8}
                  />
                ))}
              </div>
            )}

            {motivationalText && (
              <TextOverlay text={motivationalText} position="bottom" size={20} delay={30} />
            )}
          </AbsoluteFill>
          <GradientWipe startFrame={fps * 3.5} color={colors.accent.blue} />
        </Sequence>

        {/* Scene 4: Outro */}
        <Sequence from={Math.round(fps * 11.5)} durationInFrames={Math.round(fps * 2.5)}>
          <AbsoluteFill
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}
          >
            <Logo size={36} />
            <Heading text="The Journey Continues" size={24} color={colors.accent.green} delay={8} />
          </AbsoluteFill>
          <Footer />
        </Sequence>
      </DarkCanvas>
    </AbsoluteFill>
  );
};
