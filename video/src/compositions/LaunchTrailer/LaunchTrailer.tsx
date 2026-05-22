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
import { colors, fonts } from "../../styles/theme";
import type { LaunchTrailerProps } from "./schema";

// ══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════════

const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: 0.04,
        mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' seed='${frame * 7}'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "150px 150px",
      }}
    />
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.7) 100%)",
      pointerEvents: "none",
    }}
  />
);

const CinematicClip: React.FC<{
  src: string;
  startFrom?: number;
  zoomSpeed?: number;
}> = ({ src, startFrom = 0, zoomSpeed = 0.0008 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 5], [0, 1], {
    extrapolateRight: "clamp",
  });
  const scale = 1 + frame * zoomSpeed;

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
          transform: `scale(${scale})`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${colors.accent.orange}15 0%, transparent 40%, #00808010 70%, ${colors.bg.primary}90 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Embers: React.FC<{ count?: number }> = ({ count = 25 }) => {
  const frame = useCurrentFrame();
  const particles = React.useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: random(`ex-${i}`) * 100,
        y: random(`ey-${i}`) * 100,
        size: 1.5 + random(`es-${i}`) * 2.5,
        speed: 0.15 + random(`esp-${i}`) * 0.8,
        drift: (random(`ed-${i}`) - 0.5) * 0.3,
        opacity: 0.15 + random(`eo-${i}`) * 0.45,
        delay: random(`edl-${i}`) * 40,
      })),
    [count]
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const pf = Math.max(0, frame - p.delay);
        if (pf <= 0) return null;
        const y = ((p.y - pf * p.speed * 0.25) % 100 + 100) % 100;
        const x = p.x + Math.sin(pf * 0.025) * p.drift * 12;
        const op = interpolate(pf, [0, 15, 200], [0, p.opacity, 0], {
          extrapolateRight: "clamp",
        });
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
              background: colors.accent.ember,
              opacity: op,
              boxShadow: `0 0 ${p.size * 3}px ${colors.accent.ember}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const LightLeak: React.FC<{ color?: string }> = ({
  color = colors.accent.orange,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 4, 8, 12], [0, 0.7, 0.5, 0], {
    extrapolateRight: "clamp",
  });
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

const FlashCut: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 2, 5], [1, 0.3, 0], {
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ background: "#FFFFFF", opacity }} />;
};

// ── Text Components ──

const TextSlam: React.FC<{
  text: string;
  color?: string;
  fontSize?: number;
  glow?: string;
  delay?: number;
}> = ({
  text,
  color = "#FFFFFF",
  fontSize = 64,
  glow,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);
  const s = spring({ frame: f, fps, config: { damping: 8, stiffness: 200, mass: 0.6 } });
  const scale = interpolate(s, [0, 1], [3, 1]);
  const opacity = interpolate(f, [0, 3], [0, 1], { extrapolateRight: "clamp" });
  const glowIntensity = glow ? Math.sin(f * 0.06) * 0.3 + 0.7 : 0;

  return (
    <div
      style={{
        fontSize,
        fontWeight: 900,
        fontFamily: fonts.heading,
        color,
        opacity,
        transform: `scale(${scale})`,
        textAlign: "center",
        letterSpacing: "-0.02em",
        textShadow: glow
          ? `0 0 ${20 * glowIntensity}px ${glow}, 0 0 ${50 * glowIntensity}px ${glow}50`
          : "none",
      }}
    >
      {text}
    </div>
  );
};

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
              transform: `scale(${scale}) translateY(${y}px)`,
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

const SubtitleText: React.FC<{
  text: string;
  delay?: number;
  color?: string;
  fontSize?: number;
}> = ({ text, delay = 0, color = colors.text.secondary, fontSize = 28 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(Math.max(0, frame - delay), [0, 15], [0, 0.85], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        fontSize,
        fontFamily: fonts.body,
        color,
        opacity,
        textAlign: "center",
        letterSpacing: "0.06em",
      }}
    >
      {text}
    </div>
  );
};

// ── App Mockup Scenes ──

const GlassCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 24,
      padding: "32px 28px",
      ...style,
    }}
  >
    {children}
  </div>
);

const AnimatedCounter: React.FC<{
  from: number;
  to: number;
  suffix?: string;
  prefix?: string;
  color?: string;
  fontSize?: number;
  delay?: number;
}> = ({ from, to, suffix = "", prefix = "", color = "#FFFFFF", fontSize = 72, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);
  const progress = spring({ frame: f, fps, config: { damping: 15, stiffness: 80, mass: 1 } });
  const value = interpolate(progress, [0, 1], [from, to]);
  const displayValue = suffix.includes(":")
    ? `${Math.floor(value)}:${String(Math.round((value % 1) * 60)).padStart(2, "0")}`
    : value.toFixed(value < 10 ? 1 : 0);

  return (
    <div
      style={{
        fontSize,
        fontWeight: 900,
        fontFamily: fonts.mono,
        color,
        textAlign: "center",
        textShadow: `0 0 20px ${color}40`,
      }}
    >
      {prefix}{displayValue}{suffix}
    </div>
  );
};

const ProgressBar: React.FC<{
  progress: number;
  color?: string;
  delay?: number;
}> = ({ progress, color = colors.accent.green, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);
  const width = spring({ frame: f, fps, config: { damping: 20, stiffness: 60, mass: 1 } }) * progress;

  return (
    <div
      style={{
        width: "80%",
        height: 8,
        background: "rgba(255,255,255,0.08)",
        borderRadius: 4,
        overflow: "hidden",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          width: `${width * 100}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${color}, ${color}CC)`,
          borderRadius: 4,
          boxShadow: `0 0 12px ${color}60`,
        }}
      />
    </div>
  );
};

const FeatureFlash: React.FC<{
  features: string[];
  startDelay?: number;
  interval?: number;
}> = ({ features, startDelay = 0, interval = 20 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
      {features.map((feat, i) => {
        const d = startDelay + i * interval;
        const f = Math.max(0, frame - d);
        const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 160, mass: 0.5 } });
        const x = interpolate(s, [0, 1], [60, 0]);
        const op = interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              fontSize: 26,
              fontFamily: fonts.body,
              color: colors.text.primary,
              opacity: op,
              transform: `translateX(${x}px)`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ color: colors.accent.orange, fontSize: 20 }}>&#x25CF;</span>
            {feat}
          </div>
        );
      })}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// MAIN COMPOSITION — 45s @ 30fps = 1350 frames
// ══════════════════════════════════════════════════════════════
export const LaunchTrailer: React.FC<LaunchTrailerProps> = ({
  clips = [],
  aiClips = [],
  tagline = "For the runners, by the runners.",
  ctaText = "JOIN THE WAITLIST",
  ctaUrl = "sprintsociety.run",
}) => {
  const { width, height } = useVideoConfig();

  const existingClips = clips.length > 0 ? clips : [
    "assets/demo-run/clips/VIDEO-2025-07-23-10-23-24.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-06-13-54-39.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-06-13-55-34.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-06-13-53-25.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-06-13-54-00.mp4",
    "assets/demo-run/clips/VIDEO-2025-07-06-13-53-35.mp4",
  ];

  const hasAiClips = aiClips.length >= 3;

  return (
    <AbsoluteFill style={{ background: colors.bg.primary }}>

      {/* ═══════════════════════════════════════════════════════════
          ACT 1: THE HOOK (F:0-240, 8s)
          ═══════════════════════════════════════════════════════════ */}

      {/* Scene 1: "You run." text slam (0-90, 3s) */}
      <Sequence from={0} durationInFrames={90}>
        <AbsoluteFill
          style={{
            background: colors.bg.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TextSlam text="You run." fontSize={78} delay={20} glow="#FFFFFF30" />
        </AbsoluteFill>
        <FilmGrain />
      </Sequence>

      {/* Scene 2: Runner footage + "But are you improving?" (90-180, 3s) */}
      <Sequence from={90} durationInFrames={90}>
        {hasAiClips ? (
          <CinematicClip src={aiClips[0]} startFrom={0} />
        ) : (
          <AbsoluteFill
            style={{
              background: `linear-gradient(180deg, #1a0a00 0%, ${colors.bg.primary} 60%, #0a0a1a 100%)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "35%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "60%",
                height: 2,
                background: `linear-gradient(90deg, transparent, ${colors.accent.orange}40, transparent)`,
              }}
            />
          </AbsoluteFill>
        )}
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SubtitleText text="But are you improving?" delay={15} fontSize={34} color="#FFFFFF" />
        </AbsoluteFill>
        <Vignette />
        <FilmGrain />
      </Sequence>

      {/* Transition: Light leak */}
      <Sequence from={175} durationInFrames={12}>
        <LightLeak color={colors.accent.orange} />
      </Sequence>

      {/* Scene 3: Quick cuts — the struggle (180-240, 2s) */}
      <Sequence from={180} durationInFrames={20}>
        <AbsoluteFill
          style={{
            background: colors.bg.secondary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 20, color: colors.text.muted, fontFamily: fonts.mono }}>
            ── NO PROGRESS ──
          </div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={200} durationInFrames={5}>
        <FlashCut />
      </Sequence>
      <Sequence from={205} durationInFrames={20}>
        <AbsoluteFill
          style={{
            background: colors.bg.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "70%",
              height: 3,
              background: `linear-gradient(90deg, ${colors.text.muted}30, ${colors.text.muted}60, ${colors.text.muted}30)`,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "40%",
              fontSize: 14,
              color: colors.text.muted,
              fontFamily: fonts.mono,
            }}
          >
            pace: flat | distance: flat | motivation: 📉
          </div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={225} durationInFrames={5}>
        <FlashCut />
      </Sequence>
      <Sequence from={230} durationInFrames={10}>
        <AbsoluteFill style={{ background: colors.bg.primary }} />
      </Sequence>

      {/* ═══════════════════════════════════════════════════════════
          ACT 2: THE COMMUNITY (F:240-600, 12s)
          ═══════════════════════════════════════════════════════════ */}

      {/* Scene 4: Arch walk — "What if you didn't run alone?" (240-330, 3s) */}
      <Sequence from={240} durationInFrames={90}>
        <CinematicClip src={existingClips[0]} startFrom={300} />
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "25%",
          }}
        >
          <TextSlam
            text="WHAT IF YOU DIDN'T RUN ALONE?"
            fontSize={42}
            delay={15}
            glow={colors.accent.orange}
          />
        </AbsoluteFill>
        <Vignette />
        <FilmGrain />
      </Sequence>

      {/* Transition */}
      <Sequence from={325} durationInFrames={10}>
        <FlashCut />
      </Sequence>

      {/* Scene 5: Cold plunge energy (330-390, 2s) */}
      <Sequence from={330} durationInFrames={30}>
        <CinematicClip src={existingClips[1]} startFrom={60} />
        <Vignette />
        <FilmGrain />
      </Sequence>
      <Sequence from={360} durationInFrames={30}>
        <CinematicClip src={existingClips[3]} startFrom={45} />
        <Vignette />
        <FilmGrain />
      </Sequence>

      {/* Scene 6: Group photo — "A crew that pushes you forward" (390-450, 2s) */}
      <Sequence from={390} durationInFrames={60}>
        <AbsoluteFill>
          <Img
            src={staticFile("assets/demo-run/photos/PHOTO-2025-07-09-11-25-15.jpg")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.15) saturate(0.9) brightness(0.85)",
            }}
          />
          <AbsoluteFill
            style={{
              background: `linear-gradient(180deg, transparent 40%, ${colors.bg.primary}DD 100%)`,
            }}
          />
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "18%",
          }}
        >
          <SubtitleText text="A crew that pushes you forward." delay={10} fontSize={30} color="#FFFFFF" />
        </AbsoluteFill>
        <Vignette />
        <FilmGrain />
      </Sequence>

      {/* Scene 7: Leader speaking — "Coaches who know your pace" (450-510, 2s) */}
      <Sequence from={450} durationInFrames={60}>
        <CinematicClip src={existingClips[2]} startFrom={90} />
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "18%",
          }}
        >
          <SubtitleText text="Coaches who know your pace." delay={10} fontSize={30} color="#FFFFFF" />
        </AbsoluteFill>
        <Vignette />
        <FilmGrain />
      </Sequence>

      {/* Scene 8: Group running — "Training that actually works" (510-600, 3s) */}
      <Sequence from={510} durationInFrames={90}>
        {hasAiClips ? (
          <CinematicClip src={aiClips[2]} startFrom={0} />
        ) : (
          <>
            <CinematicClip src={existingClips[4]} startFrom={150} />
          </>
        )}
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "18%",
          }}
        >
          <TextSlam
            text="Training that actually works."
            fontSize={38}
            delay={20}
            glow={colors.accent.orange}
          />
        </AbsoluteFill>
        <Embers count={20} />
        <Vignette />
        <FilmGrain />
      </Sequence>

      {/* ═══════════════════════════════════════════════════════════
          ACT 3: THE APP (F:600-1050, 15s) — DROP
          ═══════════════════════════════════════════════════════════ */}

      {/* Transition: Big flash for the drop */}
      <Sequence from={595} durationInFrames={10}>
        <FlashCut />
      </Sequence>

      {/* Scene 9: App reveal — "AI-POWERED COACHING" (600-720, 4s) */}
      <Sequence from={600} durationInFrames={120}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 40%, ${colors.bg.tertiary}, ${colors.bg.primary})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 30,
          }}
        >
          <TextSlam
            text="AI-POWERED COACHING"
            fontSize={48}
            color={colors.accent.orange}
            delay={5}
            glow={colors.accent.orange}
          />

          <div style={{ marginTop: 40 }}>
            <GlassCard style={{ width: 500, padding: "40px 32px" }}>
              <div
                style={{
                  textAlign: "center",
                  fontSize: 24,
                  fontFamily: fonts.heading,
                  color: colors.text.primary,
                  marginBottom: 8,
                }}
              >
                SPRINT SOCIETY
              </div>
              <div
                style={{
                  width: "100%",
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${colors.accent.orange}60, transparent)`,
                  margin: "12px 0 24px",
                }}
              />
              <FeatureFlash
                features={[
                  "Personalized pace zones",
                  "Weekly challenges",
                  "Real-time progress tracking",
                ]}
                startDelay={25}
                interval={18}
              />
            </GlassCard>
          </div>
        </AbsoluteFill>
        <Embers count={15} />
        <FilmGrain />
      </Sequence>

      {/* Scene 10: Transformation stats (720-840, 4s) */}
      <Sequence from={720} durationInFrames={120}>
        <AbsoluteFill
          style={{
            background: colors.bg.primary,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 60,
              alignItems: "center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, color: colors.text.muted, fontFamily: fonts.body, marginBottom: 8 }}>
                WEEK 1
              </div>
              <div style={{ fontSize: 56, fontWeight: 900, fontFamily: fonts.mono, color: colors.text.muted }}>
                6:45
              </div>
              <div style={{ fontSize: 16, color: colors.text.muted, fontFamily: fonts.body }}>/km</div>
            </div>

            <div style={{ fontSize: 36, color: colors.accent.orange }}>→</div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, color: colors.accent.green, fontFamily: fonts.body, marginBottom: 8 }}>
                WEEK 8
              </div>
              <AnimatedCounter
                from={6.75}
                to={5.17}
                suffix="/km"
                color={colors.accent.green}
                fontSize={56}
                delay={15}
              />
            </div>
          </div>

          <div style={{ marginTop: 30 }}>
            <SubtitleText text="See your pace drop. Feel the difference." delay={40} fontSize={28} />
          </div>

          <div style={{ marginTop: 20, width: "60%" }}>
            <ProgressBar progress={0.78} color={colors.accent.green} delay={50} />
          </div>
        </AbsoluteFill>
        <FilmGrain />
      </Sequence>

      {/* Scene 11: Gamification — "Level up every run" (840-960, 4s) */}
      <Sequence from={840} durationInFrames={120}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 45%, ${colors.bg.tertiary}, ${colors.bg.primary})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {/* Achievement badge */}
          <AchievementBadge />

          <TextSlam
            text="Level up every run."
            fontSize={40}
            color={colors.accent.gold}
            delay={30}
            glow={colors.accent.gold}
          />

          <div style={{ marginTop: 20, width: "50%" }}>
            <ProgressBar progress={0.85} color={colors.accent.gold} delay={45} />
            <div
              style={{
                marginTop: 8,
                textAlign: "center",
                fontSize: 14,
                fontFamily: fonts.mono,
                color: colors.text.muted,
              }}
            >
              2,400 / 3,000 XP
            </div>
          </div>
        </AbsoluteFill>
        <Embers count={12} />
        <FilmGrain />
      </Sequence>

      {/* Scene 12: Shareable card — "Flex your progress" (960-1050, 3s) */}
      <Sequence from={960} durationInFrames={90}>
        <AbsoluteFill
          style={{
            background: colors.bg.primary,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          <RunCardMockup />
          <SubtitleText text="Flex your progress." delay={20} fontSize={30} color={colors.text.primary} />
        </AbsoluteFill>
        <FilmGrain />
      </Sequence>

      {/* ═══════════════════════════════════════════════════════════
          ACT 4: THE CLOSE (F:1050-1350, 10s)
          ═══════════════════════════════════════════════════════════ */}

      {/* Scene 13: Title slam (1050-1200, 5s) */}
      <Sequence from={1050} durationInFrames={150}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 38%, ${colors.bg.tertiary}, ${colors.bg.primary})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <SpringText
            text="SPRINT"
            color={colors.accent.orange}
            fontSize={92}
            delay={8}
            glow={colors.accent.orange}
            stagger={2}
          />
          <SpringText
            text="SOCIETY"
            color="#FFFFFF"
            fontSize={92}
            delay={22}
            glow="#FFFFFF30"
            stagger={2}
          />
          <div style={{ marginTop: 50 }}>
            <SubtitleText text={tagline} delay={50} fontSize={24} />
          </div>
        </AbsoluteFill>
        <Embers count={35} />
        <LightLeak color={colors.accent.orange} />
        <FilmGrain />
        <Vignette />
      </Sequence>

      {/* Scene 14: CTA (1200-1290, 3s) */}
      <Sequence from={1200} durationInFrames={90}>
        <AbsoluteFill
          style={{
            background: colors.bg.primary,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <TextSlam
            text={ctaText}
            fontSize={52}
            color={colors.accent.red}
            delay={8}
            glow={colors.accent.red}
          />
          <SubtitleText text={ctaUrl} delay={25} fontSize={28} color={colors.accent.blue} />
        </AbsoluteFill>
        <Embers count={10} />
        <FilmGrain />
      </Sequence>

      {/* Scene 15: Kendu Entertainment (1290-1350, 2s) */}
      <Sequence from={1290} durationInFrames={60}>
        <AbsoluteFill
          style={{
            background: colors.bg.primary,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "8%",
          }}
        >
          <SubtitleText
            text="Kendu Entertainment"
            delay={10}
            fontSize={13}
            color={colors.text.muted}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Global: subtle embers visible throughout */}
      <Embers count={8} />
    </AbsoluteFill>
  );
};

// ── Sub-components for app mockup scenes ──

const AchievementBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 8, stiffness: 120, mass: 0.8 } });
  const scale = interpolate(s, [0, 1], [0, 1]);
  const ringPulse = Math.sin(frame * 0.08) * 0.1 + 1;

  return (
    <div
      style={{
        width: 140,
        height: 140,
        borderRadius: "50%",
        border: `3px solid ${colors.accent.gold}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
        boxShadow: `0 0 30px ${colors.accent.gold}40, inset 0 0 20px ${colors.accent.gold}20`,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "130%",
          height: "130%",
          borderRadius: "50%",
          border: `1px solid ${colors.accent.gold}30`,
          transform: `scale(${ringPulse})`,
        }}
      />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, color: colors.accent.gold, fontFamily: fonts.body, letterSpacing: "0.1em" }}>
          TIER UP
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: colors.text.primary, fontFamily: fonts.heading }}>
          INT
        </div>
      </div>
    </div>
  );
};

const RunCardMockup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 100, mass: 0.7 } });
  const scale = interpolate(s, [0, 1], [0.8, 1]);
  const rotateY = interpolate(s, [0, 1], [15, 0]);

  return (
    <div
      style={{
        transform: `scale(${scale}) perspective(800px) rotateY(${rotateY}deg)`,
      }}
    >
      <GlassCard style={{ width: 340, padding: "28px 24px" }}>
        <div style={{ fontSize: 12, color: colors.text.muted, fontFamily: fonts.body, letterSpacing: "0.1em", marginBottom: 4 }}>
          RUN RECAP
        </div>
        <div style={{ fontSize: 14, color: colors.text.secondary, fontFamily: fonts.body, marginBottom: 16 }}>
          May 14, 2026
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 900, color: colors.text.primary, fontFamily: fonts.mono }}>
              7.5
            </div>
            <div style={{ fontSize: 12, color: colors.text.muted }}>km</div>
          </div>
          <div>
            <div style={{ fontSize: 36, fontWeight: 900, color: colors.accent.green, fontFamily: fonts.mono }}>
              5:06
            </div>
            <div style={{ fontSize: 12, color: colors.text.muted }}>/km</div>
          </div>
          <div>
            <div style={{ fontSize: 36, fontWeight: 900, color: colors.accent.orange, fontFamily: fonts.mono }}>
              200
            </div>
            <div style={{ fontSize: 12, color: colors.text.muted }}>XP</div>
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            color: colors.accent.orange,
            fontFamily: fonts.body,
            borderTop: `1px solid rgba(255,255,255,0.06)`,
            paddingTop: 12,
            letterSpacing: "0.08em",
          }}
        >
          SPRINT SOCIETY
        </div>
      </GlassCard>
    </div>
  );
};
