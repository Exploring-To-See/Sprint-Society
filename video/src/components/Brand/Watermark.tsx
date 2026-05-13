import React from "react";
import { colors, fonts } from "../../styles/theme";

export const Watermark: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        top: 30,
        right: 30,
        opacity: 0.4,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: colors.text.muted,
          fontFamily: fonts.mono,
          letterSpacing: "0.05em",
        }}
      >
        @sprintsociety
      </span>
    </div>
  );
};
