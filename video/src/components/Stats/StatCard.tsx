import React from "react";
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../../styles/theme";

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: string;
  color?: string;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  color = colors.accent.green,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delay);
  const progress = spring({ frame: adjustedFrame, fps, config: { damping: 12, stiffness: 90 } });
  const opacity = interpolate(adjustedFrame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        background: `${colors.bg.secondary}CC`,
        border: `1px solid ${color}30`,
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity,
        transform: `scale(${progress}) translateX(${interpolate(progress, [0, 1], [-20, 0])}px)`,
      }}
    >
      {icon && (
        <span style={{ fontSize: 28 }}>{icon}</span>
      )}
      <div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color,
            fontFamily: fonts.mono,
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 13,
            color: colors.text.secondary,
            fontFamily: fonts.body,
            marginTop: 4,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};
