import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Video,
  Img,
  staticFile,
  random,
} from "remotion";
import { fonts } from "../../styles/theme";
import type { ComingSoonProps } from "./schema";

const ORANGE = "#FF4D00";
const RED = "#FF1744";
const EMBER = "#FF6B35";
const DARK = "#0A0A0F";

// ── Cinematic video clip with color grading ──
const CinematicClip: React.FC<{
  src: string;
  startFrom?: number;
  style?: React.CSSProperties;
}> = ({ src, startFrom = 0, style }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 4], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity }}>
      <Video
        src={staticFile(src)}
        startFrom={startFrom}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "contrast(1.2) saturate(0.85) brightness(0.8)",
          ...style,
        }}
      />
      {/* Orange/teal color wash */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${ORANGE}15 0%, transparent 40%, #00808010 70%, ${DARK}90 100%)`,
          mixBlendMode: "normal",
        }}
      />
    </AbsoluteFill>
  );
};

// ── Film grain ──
const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: 0.045,
        mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' seed='${frame * 7}'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "150px 150px",
      }}
    />
  );
};

// ── Vignette ──
const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%)",
      pointerEvents: "none",
    }}
  />
);

// ── Light leak transition ──
const LightLeak: React.FC<{ color?: string }> = ({ color = ORANGE }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [0, 4, 8, 12], [0, 0.7, 0.5, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at ${30 + progress * 40}% 45%, ${color} 0%, transparent 60%)`,
        opacity,
        mixBlendMode: "screen",
      }}
    />
  );
};

// ── Particles ──
const Embers: React.FC<{ count?: number }> = ({ count = 30 }) => {
  const frame = useCurrentFrame();

  const particles = React.useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: random(`ex-${i}`) * 100,
        y: random(`ey-${i}`) * 100,
        size: 1.5 + random(`es-${i}`) * 2.5,
        speed: 0.2 + random(`esp-${i}`) * 1,
        drift: (random(`ed-${i}`) - 0.5) * 0.3,
        opacity: 0.2 + random(`eo-${i}`) * 0.5,
        delay: random(`edl-${i}`) * 50,
      })),
    [count]
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const pf = Math.max(0, frame - p.delay);
        if (pf <= 0) return null;
        const y = ((p.y - pf * p.speed * 0.3) % 100 + 100) % 100;
        const x = p.x + Math.sin(pf * 0.03) * p.drift * 15;
        const op = interpolate(pf, [0, 10, 100], [0, p.opacity, 0], { extrapolateRight: "clamp" });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: EMBER,
              opacity: op,
              boxShadow: `0 0 ${p.size * 3}px ${EMBER}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ── Per-character spring text ──
const SpringText: React.FC<{
  text: string;
  color: string;
  fontSize: number;
  delay?: number;
  glow?: string;
  stagger?: number;
}> = ({ text, color, fontSize, delay = 0, glow, stagger = 2 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" }}>
      {text.split("").map((char, i) => {
        const d = delay + i * stagger;
        const f = Math.max(0, frame - d);
        const s = spring({ frame: f, fps, config: { damping: 10, stiffness: 180, mass: 0.7 } });
        const scale = interpolate(s, [0, 1], [2.2, 1]);
        const y = interpolate(s, [0, 1], [35, 0]);
        const op = interpolate(f, [0, 3], [0, 1], { extrapolateRight: "clamp" });
        const rot = interpolate(s, [0, 1], [8, 0]);
        const glowPulse = glow ? Math.sin((frame - d) * 0.08) * 0.3 + 0.7 : 0;
        const glowPx = glow ? 18 * glowPulse : 0;

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontSize,
              fontWeight: 900,
              fontFamily: fonts.heading,
              color,
              opacity: op,
              transform: `scale(${scale}) translateY(${y}px) rotate(${rot}deg)`,
              textShadow: glow
                ? `0 0 ${glowPx}px ${glow}, 0 0 ${glowPx * 2.5}px ${glow}50`
                : "none",
              letterSpacing: "-0.02em",
            }}
          >
            {char === " " ? " " : char}
          </span>
        );
      })}
    </div>
  );
};

// ── Fade to/from black ──
const FadeBlack: React.FC<{ direction: "in" | "out"; duration?: number }> = ({
  direction,
  duration = 8,
}) => {
  const frame = useCurrentFrame();
  const opacity =
    direction === "in"
      ? interpolate(frame, [0, duration], [1, 0], { extrapolateRight: "clamp" })
      : interpolate(frame, [0, duration], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: DARK, opacity }} />;
};

// ══════════════════════════════════════════════════════════════
// MAIN COMPOSITION
// ══════════════════════════════════════════════════════════════
export const ComingSoon: React.FC<ComingSoonProps> = ({
  clips = [],
  tagline = "For the runners, by the runners.",
  launchText = "COMING SOON",
}) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const isVertical = height > width;
  const titleSize = isVertical ? 92 : 70;
  const ctaSize = isVertical ? 52 : 42;

  // Clip references (from props or defaults)
  const clipPaths = clips.length > 0 ? clips : [
    "assets/demo-run/clips/VIDEO-2025-07-23-10-23-24.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-06-13-54-39.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-06-13-55-34.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-06-13-53-25.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-06-13-54-00.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-06-13-53-35.mp4",
  ];

  return (
    <AbsoluteFill style={{ background: DARK }}>

      {/* ── SCENE 1: Fade from black + birds on wires (0-75 frames / 2.5s) ── */}
      <Sequence from={0} durationInFrames={75}>
        <CinematicClip src={clipPaths[0]} startFrom={15} />
        <FadeBlack direction="in" duration={15} />
        <Vignette />
        <FilmGrain />
      </Sequence>

      {/* ── TRANSITION: Light leak (75-87) ── */}
      <Sequence from={70} durationInFrames={15}>
        <LightLeak color={ORANGE} />
      </Sequence>

      {/* ── SCENE 2: Cold plunge shock (85-110 / 0.8s) ── */}
      <Sequence from={85} durationInFrames={25}>
        <CinematicClip src={clipPaths[1]} startFrom={45} />
        <Vignette />
        <FilmGrain />
      </Sequence>

      {/* ── SCENE 3: Brief dark (110-125 / 0.5s) ── */}
      <Sequence from={110} durationInFrames={15}>
        <AbsoluteFill style={{ background: DARK }} />
      </Sequence>

      {/* ── SCENE 4: Arch walk cinematic (125-175 / 1.7s) ── */}
      <Sequence from={125} durationInFrames={50}>
        <CinematicClip src={clipPaths[0]} startFrom={300} />
        <Vignette />
        <FilmGrain />
      </Sequence>

      {/* ── TRANSITION ── */}
      <Sequence from={170} durationInFrames={12}>
        <LightLeak color={EMBER} />
      </Sequence>

      {/* ── SCENE 5: Leader addressing (180-205 / 0.8s) ── */}
      <Sequence from={180} durationInFrames={25}>
        <CinematicClip src={clipPaths[2]} startFrom={120} />
        <Vignette />
        <FilmGrain />
      </Sequence>

      {/* ── SCENE 6: Top-down cold plunge (205-250 / 1.5s) ── */}
      <Sequence from={205} durationInFrames={45}>
        <CinematicClip src={clipPaths[3]} startFrom={45} />
        <Vignette />
        <FilmGrain />
      </Sequence>

      {/* ── TRANSITION ── */}
      <Sequence from={245} durationInFrames={12}>
        <LightLeak color={ORANGE} />
      </Sequence>

      {/* ── SCENE 7: Flash montage — 3 quick cuts (250-295 / 1.5s) ── */}
      <Sequence from={250} durationInFrames={15}>
        <CinematicClip src={clipPaths[4]} startFrom={150} />
        <Vignette />
      </Sequence>
      <Sequence from={265} durationInFrames={15}>
        <CinematicClip src={clipPaths[5]} startFrom={150} />
        <Vignette />
      </Sequence>
      <Sequence from={280} durationInFrames={15}>
        <CinematicClip src={clipPaths[1]} startFrom={100} />
        <Vignette />
      </Sequence>

      {/* ── SCENE 8: Group photo with Ken Burns (295-345 / 1.7s) ── */}
      <Sequence from={295} durationInFrames={50}>
        <AbsoluteFill>
          <Img
            src={staticFile("assets/demo-run/photos/PHOTO-2025-07-09-11-25-15.jpg")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.15) saturate(0.9) brightness(0.85)",
              transform: `scale(${interpolate(
                useCurrentFrame(),
                [0, 50],
                [1.0, 1.06],
                { extrapolateRight: "clamp" }
              )})`,
            }}
          />
          <AbsoluteFill
            style={{
              background: `linear-gradient(180deg, transparent 50%, ${DARK}CC 100%)`,
            }}
          />
        </AbsoluteFill>
        <Vignette />
        <FilmGrain />
        <FadeBlack direction="in" duration={6} />
      </Sequence>

      {/* ── SCENE 9: Title reveal — SPRINT SOCIETY (345-500 / 5.2s) ── */}
      <Sequence from={345} durationInFrames={155}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 38%, #1A1A2E, ${DARK})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <SpringText
            text="SPRINT"
            color={ORANGE}
            fontSize={titleSize}
            delay={8}
            glow={ORANGE}
            stagger={2}
          />
          <SpringText
            text="SOCIETY"
            color="#FFFFFF"
            fontSize={titleSize}
            delay={22}
            glow="#FFFFFF30"
            stagger={2}
          />

          {/* Tagline */}
          <div
            style={{
              marginTop: isVertical ? 50 : 25,
              fontSize: 24,
              fontFamily: fonts.body,
              color: "#B0B0C0",
              letterSpacing: "0.08em",
              opacity: interpolate(
                Math.max(0, useCurrentFrame() - 50),
                [0, 15],
                [0, 0.7],
                { extrapolateRight: "clamp" }
              ),
            }}
          >
            {tagline}
          </div>

          {/* COMING SOON */}
          <div style={{ marginTop: isVertical ? 70 : 35 }}>
            <SpringText
              text={launchText}
              color={RED}
              fontSize={ctaSize}
              delay={70}
              glow={RED}
              stagger={1.5}
            />
          </div>
        </AbsoluteFill>

        <Embers count={35} />
        <LightLeak color={ORANGE} />
        <FilmGrain />
        <Vignette />
      </Sequence>

      {/* ── SCENE 10: Fade to black (500-540 / 1.3s) ── */}
      <Sequence from={500} durationInFrames={40}>
        <AbsoluteFill style={{ background: DARK }}>
          <div
            style={{
              position: "absolute",
              bottom: isVertical ? 80 : 40,
              left: 0,
              right: 0,
              textAlign: "center",
              opacity: interpolate(useCurrentFrame(), [10, 25], [0, 0.4], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "#6B6B80",
                fontFamily: fonts.body,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Kendu Entertainment
            </span>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Global embers (visible throughout) ── */}
      <Embers count={15} />
    </AbsoluteFill>
  );
};
