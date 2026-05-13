import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors, fonts } from "../../styles/theme";

export const Footer: React.FC<{ text?: string }> = ({
  text = "Kendu Entertainment",
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 0.6], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity,
      }}
    >
      <span
        style={{
          fontSize: 14,
          color: colors.text.muted,
          fontFamily: fonts.body,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {text}
      </span>
    </div>
  );
};
