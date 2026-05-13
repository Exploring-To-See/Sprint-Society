import React from "react";
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../../styles/theme";

interface HeadingProps {
  text: string;
  size?: number;
  color?: string;
  delay?: number;
}

export const Heading: React.FC<HeadingProps> = ({
  text,
  size = 48,
  color = colors.text.primary,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delay);
  const y = spring({ frame: adjustedFrame, fps, config: { damping: 12, stiffness: 80 } });
  const opacity = interpolate(adjustedFrame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <h1
      style={{
        fontSize: size,
        fontWeight: 700,
        color,
        fontFamily: fonts.heading,
        letterSpacing: "-0.02em",
        margin: 0,
        opacity,
        transform: `translateY(${interpolate(y, [0, 1], [30, 0])}px)`,
      }}
    >
      {text}
    </h1>
  );
};
