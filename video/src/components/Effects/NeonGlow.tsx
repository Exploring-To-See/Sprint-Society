import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors } from "../../styles/theme";

interface NeonGlowProps {
  color?: string;
  intensity?: number;
  children: React.ReactNode;
}

export const NeonGlow: React.FC<NeonGlowProps> = ({
  color = colors.accent.green,
  intensity = 1,
  children,
}) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame * 0.1) * 0.3 + 0.7;
  const glowSize = 20 * intensity * pulse;

  return (
    <div
      style={{
        filter: `drop-shadow(0 0 ${glowSize}px ${color}) drop-shadow(0 0 ${glowSize * 2}px ${color}60)`,
      }}
    >
      {children}
    </div>
  );
};
