import React, { useMemo } from "react";
import { interpolate, useCurrentFrame, random } from "remotion";
import { colors } from "../../styles/theme";

interface ConfettiProps {
  count?: number;
  startFrame?: number;
}

const COLORS = [colors.accent.green, colors.accent.blue, colors.accent.pink, colors.accent.gold];

export const Confetti: React.FC<ConfettiProps> = ({ count = 40, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - startFrame);

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: random(`x-${i}`) * 100,
      speed: 2 + random(`speed-${i}`) * 4,
      size: 6 + random(`size-${i}`) * 10,
      color: COLORS[Math.floor(random(`color-${i}`) * COLORS.length)],
      rotation: random(`rot-${i}`) * 360,
      rotSpeed: (random(`rotspeed-${i}`) - 0.5) * 10,
      delay: random(`delay-${i}`) * 15,
    }));
  }, [count]);

  if (adjustedFrame <= 0) return null;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const particleFrame = Math.max(0, adjustedFrame - p.delay);
        const y = interpolate(particleFrame, [0, 60], [-10, 110], { extrapolateRight: "clamp" });
        const opacity = interpolate(particleFrame, [40, 60], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const rotation = p.rotation + particleFrame * p.rotSpeed;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
              borderRadius: 2,
              opacity,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      })}
    </div>
  );
};
