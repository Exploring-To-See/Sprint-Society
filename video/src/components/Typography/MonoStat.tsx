import React from "react";
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../../styles/theme";

interface MonoStatProps {
  value: string | number;
  label: string;
  color?: string;
  size?: number;
  delay?: number;
}

export const MonoStat: React.FC<MonoStatProps> = ({
  value,
  label,
  color = colors.accent.green,
  size = 56,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delay);
  const scale = spring({ frame: adjustedFrame, fps, config: { damping: 10, stiffness: 100 } });
  const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ textAlign: "center", opacity, transform: `scale(${scale})` }}>
      <div
        style={{
          fontSize: size,
          fontWeight: 700,
          color,
          fontFamily: fonts.mono,
          lineHeight: 1.1,
          textShadow: `0 0 20px ${color}60`,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: size * 0.28,
          color: colors.text.secondary,
          fontFamily: fonts.body,
          marginTop: 6,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </div>
    </div>
  );
};
