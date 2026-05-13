import React from "react";
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { colors } from "../../styles/theme";

interface GlassCardProps {
  children: React.ReactNode;
  delay?: number;
  width?: string | number;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  delay = 0,
  width = "auto",
  padding = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delay);
  const scale = spring({ frame: adjustedFrame, fps, config: { damping: 14, stiffness: 80 } });
  const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        background: `${colors.bg.secondary}CC`,
        border: `1px solid ${colors.bg.tertiary}`,
        borderRadius: 16,
        padding,
        backdropFilter: "blur(20px)",
        width,
        opacity,
        transform: `scale(${scale}) translateY(${interpolate(adjustedFrame, [0, 15], [20, 0], { extrapolateRight: "clamp" })}px)`,
      }}
    >
      {children}
    </div>
  );
};
