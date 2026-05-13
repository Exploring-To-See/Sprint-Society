import React from "react";
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../../styles/theme";

interface PaceDisplayProps {
  minutes: number;
  seconds: number;
  unit?: string;
  delay?: number;
}

export const PaceDisplay: React.FC<PaceDisplayProps> = ({
  minutes,
  seconds,
  unit = "min/km",
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delay);
  const scale = spring({ frame: adjustedFrame, fps, config: { damping: 10, stiffness: 100 } });
  const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div style={{ textAlign: "center", opacity, transform: `scale(${scale})` }}>
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          color: colors.accent.blue,
          fontFamily: fonts.mono,
          lineHeight: 1,
          textShadow: `0 0 30px ${colors.accent.blue}40`,
        }}
      >
        {formatted}
      </div>
      <div
        style={{
          fontSize: 16,
          color: colors.text.secondary,
          fontFamily: fonts.body,
          marginTop: 8,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        {unit}
      </div>
    </div>
  );
};
