import React from "react";
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../../styles/theme";

export const Logo: React.FC<{ size?: number }> = ({ size = 60 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.25,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${colors.accent.green}, ${colors.accent.blue})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 ${size * 0.4}px ${colors.accent.green}40`,
        }}
      >
        <span
          style={{
            fontSize: size * 0.5,
            fontWeight: 700,
            color: colors.bg.primary,
            fontFamily: fonts.heading,
          }}
        >
          SS
        </span>
      </div>
      <span
        style={{
          fontSize: size * 0.5,
          fontWeight: 700,
          color: colors.text.primary,
          fontFamily: fonts.heading,
          letterSpacing: "-0.02em",
        }}
      >
        Sprint Society
      </span>
    </div>
  );
};
