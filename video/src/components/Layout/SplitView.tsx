import React from "react";
import { AbsoluteFill } from "remotion";

interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  gap?: number;
}

export const SplitView: React.FC<SplitViewProps> = ({ left, right, gap = 20 }) => {
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        gap,
      }}
    >
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>{left}</div>
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>{right}</div>
    </AbsoluteFill>
  );
};
