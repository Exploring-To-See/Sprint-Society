import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors, fonts } from "../../styles/theme";

interface TextOverlayProps {
  text: string;
  position?: "top" | "center" | "bottom";
  size?: number;
  delay?: number;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  text,
  position = "center",
  size = 24,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - delay);
  const opacity = interpolate(adjustedFrame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { top: 80, left: 0, right: 0 },
    center: { top: "50%", left: 0, right: 0, transform: "translateY(-50%)" },
    bottom: { bottom: 100, left: 0, right: 0 },
  };

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyles[position],
        textAlign: "center",
        padding: "0 40px",
        opacity,
      }}
    >
      <span
        style={{
          fontSize: size,
          color: colors.text.primary,
          fontFamily: fonts.body,
          fontWeight: 500,
          lineHeight: 1.4,
        }}
      >
        {text}
      </span>
    </div>
  );
};
