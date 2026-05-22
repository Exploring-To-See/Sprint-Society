# Sprint Society Launch Trailer — Production Guide

## Quick Start

### Option A: Python (renders immediately, no AI clips)
```bash
cd sprint-society
pip install moviepy Pillow numpy
python studio/projects/launch-trailer/render_trailer.py
```
Output: `studio/output/launch_trailer_v1.mp4`

### Option B: Remotion (React, higher quality animations)
```bash
cd sprint-society/video
npm install
npx remotion preview   # Preview in browser
npx remotion render src/index.ts LaunchTrailer-Story --output=../studio/output/launch_trailer_remotion.mp4
```

---

## Production Pipeline (Full Quality)

### Step 1: Generate AI Clips
Open [open-generative-ai](https://github.com/anil-matcha/open-generative-ai) or visit muapi.ai:
1. Use prompts from `AI-GENERATION-PROMPTS.md`
2. Generate 5 clips (runner silhouette, frustration shots, group running)
3. Save to `video/public/assets/ai-generated/`

### Step 2: Update Trailer with AI Clips
In `video/src/compositions/LaunchTrailer/LaunchTrailer.tsx`, pass AI clips:
```tsx
aiClips={[
  "assets/ai-generated/runner-silhouette.mp4",
  "assets/ai-generated/frustrated-runner.mp4",
  "assets/ai-generated/group-running.mp4",
]}
```

### Step 3: Add Music
Recommended tracks (royalty-free):
| Track | Artist | Vibe | Source |
|-------|--------|------|--------|
| "Dark Energy" | Infraction | Bass-heavy, builds | NCS |
| "Run" | NEFFEX | Motivational, energetic | NEFFEX |
| "Adrenaline" | Onycs | Electronic, cinematic | Epidemic Sound |
| "On My Way" | Alan Walker | Running anthem | NCS |

**Music timing:**
- 0:00-0:08 → Sparse tension bass
- 0:08-0:20 → Rhythm builds, percussion
- 0:20 → **DROP** (app reveal)
- 0:35-0:45 → Resolves, clean fade

### Step 4: Final Assembly
Use CapCut or DaVinci Resolve:
1. Import rendered video
2. Add music track
3. Sync beat drop to 0:20 mark
4. Add bass boost on text slams
5. Export 1080x1920, H.264, 30fps

---

## File Structure

```
studio/projects/launch-trailer/
├── README.md              ← You are here
├── SCRIPT.md              ← Full narration + timing
├── STORYBOARD.md          ← Scene-by-scene visual breakdown
├── AI-GENERATION-PROMPTS.md ← Prompts for open-generative-ai
└── render_trailer.py      ← Python render script (moviepy)

video/src/compositions/LaunchTrailer/
├── schema.ts              ← Props definition
└── LaunchTrailer.tsx      ← Remotion composition (React)
```

---

## What's Different from the Old Teaser

| Aspect | Old "Coming Soon" Teaser | New Launch Trailer |
|--------|--------------------------|-------------------|
| Duration | 18 seconds | 45 seconds |
| Narrative | None (random clips) | Problem → Community → App → CTA |
| Running content | Zero | AI-generated running B-roll |
| App showcase | None | Features, stats, gamification |
| Value prop | "Coming Soon" | Clear AI coaching pitch |
| CTA | Generic | "JOIN THE WAITLIST" + URL |
| Music sync | No music built-in | Beat-synced structure |

---

## Render Variants

| ID | Format | Use Case |
|----|--------|----------|
| `LaunchTrailer-Story` | 1080x1920 | Instagram Reels, TikTok, Stories |
| `LaunchTrailer-Landscape` | 1920x1080 | YouTube, Twitter/X, Website |

---

## Checklist Before Publishing

- [ ] AI clips generated and integrated
- [ ] Music added and beat-synced
- [ ] Test on mobile (text readable at 1080px)
- [ ] Verify URL (sprintsociety.run) is live/landing page ready
- [ ] Export with audio: H.264, AAC, 30fps, 10Mbps
- [ ] Upload to: Instagram, TikTok, YouTube Shorts, Twitter/X
