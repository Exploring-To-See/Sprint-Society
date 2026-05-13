import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors } from "../../styles/theme";

interface GradientWipeProps {
  direction?: "left" | "right" | "up" | "down";
  color?: string;
  startFrame?: number;
  duration?: number;
}

export const GradientWipe: React.FC<GradientWipeProps> = ({
  direction = "right",
  color = colors.accent.green,
  startFrame = 0,
  duration = 15,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - startFrame);

  const progress = interpolate(adjustedFrame, [0, duration], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const gradientDirection = {
    left: "to left",
    right: "to right",
    up: "to top",
    down: "to bottom",
  }[direction];

  const opacity = interpolate(adjustedFrame, [0, duration * 0.3, duration * 0.7, duration], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(${gradientDirection}, ${color}00 ${progress - 50}%, ${color}40 ${progress}%, ${color}00 ${progress + 50}%)`,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};
