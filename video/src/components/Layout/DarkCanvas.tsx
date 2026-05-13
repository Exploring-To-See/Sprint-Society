import React from "react";
import { AbsoluteFill } from "remotion";
import { colors } from "../../styles/theme";

export const DarkCanvas: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 30%, ${colors.bg.tertiary}, ${colors.bg.primary})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
