# Kendu Studio — Setup Guide

## 5-Minute Setup

### Step 1: Get a fal.ai API Key (free tier available)
1. Go to https://fal.ai
2. Sign up (Google/GitHub auth)
3. Go to Dashboard → API Keys
4. Copy your key

### Step 2: Add the key
Open `sprint-society/studio/app/.env` and paste:
```
FAL_KEY=your_key_here
```

### Step 3: Run the studio
```bash
cd sprint-society/studio/app
python app.py
```

Browser opens automatically at http://localhost:5555

---

## What You Can Do

### From the Web Dashboard:
| Action | Page | Description |
|--------|------|-------------|
| Generate a single clip | /generate | Enter a prompt, pick model, click Generate |
| Create a full film | /generate#film | Enter concept, AI creates storyboard + all clips |
| Browse generated videos | /library | View, download, or publish clips |
| Post to social media | /publish | Select video + platforms, one-click publish |

### From Claude Code CLI:
```
/film A 30-second cinematic trailer showing a solo runner becoming part of a community
```
Claude handles storyboard, generation, and assembly automatically.

---

## API Cost Estimates

| Model | Cost per clip | Quality | Speed |
|-------|--------------|---------|-------|
| Wan2.1 (fal.ai) | ~$0.03-0.08 | High | ~30s |
| Kling v2 (fal.ai) | ~$0.10-0.20 | Very High | ~60s |
| MiniMax (fal.ai) | ~$0.05-0.10 | Good | ~20s |
| Luma (fal.ai) | ~$0.08-0.15 | Good | ~45s |
| Replicate Wan2.1 | ~$0.05-0.10 | High | ~45s |

**With $50-100/month budget:**
- ~500-2000 individual clips
- ~50-200 full films (6 clips each)

---

## Recommended Workflow for Frasier Paine-Style Videos

1. **Write concept** in the "Full Film" mode
2. **Pick "cinematic" style** — this adds film grain, orange/teal grade, slow-mo
3. **Generate storyboard first** — review shots, tweak prompts if needed
4. **Generate clips** — use Kling for human subjects, Wan2.1 for everything else
5. **Download assembled video**
6. **Add music** in CapCut (mobile) or DaVinci Resolve (desktop, free)
7. **Publish** directly from the dashboard

---

## Social Media Setup (Optional)

### Instagram
1. Create Meta Developer App: https://developers.facebook.com
2. Add Instagram Graph API
3. Get long-lived page access token
4. Add to .env as INSTAGRAM_TOKEN

### Twitter/X
1. Apply for Developer Account: https://developer.twitter.com
2. Create App, get API keys
3. Add all 4 keys to .env

### YouTube
1. Google Cloud Console → Enable YouTube Data API v3
2. Create OAuth2 credentials
3. Add YOUTUBE_API_KEY to .env

### WhatsApp
- Always available — opens native share dialog

---

## Folder Structure

```
studio/
├── app/
│   ├── app.py              ← Main server (run this)
│   ├── .env                ← Your API keys
│   ├── generators/
│   │   ├── fal_generator.py      ← fal.ai integration
│   │   ├── replicate_generator.py ← Replicate integration
│   │   └── storyboard_engine.py  ← AI storyboard creation
│   ├── pipelines/
│   │   ├── assembly.py     ← ffmpeg video stitching
│   │   └── social.py       ← Social media posting
│   └── templates/          ← Web dashboard HTML
├── output/
│   ├── clips/              ← Individual generated clips
│   └── projects/           ← Full film projects (storyboard + clips + final)
└── projects/
    └── launch-trailer/     ← Sprint Society trailer files
```

---

## Troubleshooting

**"FAL_KEY not set"** → Add your key to studio/app/.env
**"ffmpeg not found"** → Install from https://ffmpeg.org/download.html (add to PATH)
**Clips not assembling** → ffmpeg needed for stitching. Individual clips still download fine without it.
**Storyboard is generic** → Add ANTHROPIC_API_KEY for Claude-powered intelligent storyboards (otherwise uses templates)
