# AI Video Generation Prompts

## Platform: open-generative-ai (muapi.ai)
## Recommended Models: Kling, Wan2.1, Veo 2, or Sora

Use these prompts in the Image Studio (for key frames) and Video Studio (for motion clips).
Generate at highest quality, 4-8 second clips, portrait orientation (9:16).

---

## CLIP 1: Runner Silhouette at Dawn (Scene 2)

### Text-to-Video Prompt:
```
Cinematic slow-motion shot of a solo runner's silhouette against a vibrant orange 
and teal dawn sky. The runner is moving left to right on a straight road that 
vanishes into the horizon. Long shadows stretch across wet pavement. Camera is 
low angle, slightly behind the runner. Film grain, shallow depth of field. 
Anamorphic lens flare from the rising sun. Dark moody atmosphere with orange 
highlight on the runner's outline. 9:16 portrait orientation. 4K cinematic quality.
```

### Style Keywords: `cinematic, dawn, silhouette, slow motion, dramatic lighting, film grain`

### Negative Prompt: `bright daylight, cartoon, anime, text, watermark, logo, overexposed`

---

## CLIP 2: Frustrated Runner Checking Phone (Scene 3, Cut A)

### Text-to-Video Prompt:
```
Medium close-up of a runner stopped on a dimly lit street at dusk, looking down 
at their phone with a frustrated expression. They're wearing dark athletic wear. 
The phone screen glows on their face (subtle blue light). Background is blurred 
urban environment. Desaturated color grading with cool blue/gray tones. Slight 
camera movement (handheld feel). Cinematic 9:16 portrait framing.
```

### Style Keywords: `cinematic, moody, desaturated, frustration, urban, dusk`

---

## CLIP 3: Flat Stats on Screen (Scene 3, Cut B)

### Image-to-Video or Text-to-Image Prompt:
```
Close-up of a phone screen showing a boring, generic fitness app with a completely 
flat progress graph (no improvement). The graph line is gray and horizontal. 
Dark background, phone slightly tilted. Minimal UI, clinical look. The vibe is 
"stagnation" and "no progress." Soft focus on edges. Dark moody lighting.
```

### Alternative: Generate as a static image and add subtle zoom in Remotion.

---

## CLIP 4: Lonely Runner on Empty Road (Scene 3, Cut C)

### Text-to-Video Prompt:
```
Wide shot of a single runner from behind, running alone on a long, empty straight 
road in overcast weather. Gray sky, flat terrain, no other people visible. 
Desaturated, cold color grading. The runner appears small in the frame, 
emphasizing isolation. Slight fog or mist. Cinematic 9:16 portrait, camera 
static or very slow dolly forward.
```

### Style Keywords: `isolation, lonely, overcast, desaturated, wide shot, cinematic`

---

## CLIP 5: Group Running in Urban Dawn (Scene 8)

### Text-to-Video Prompt:
```
Cinematic tracking shot of 5-6 diverse runners in a tight pack running together 
through an urban street at dawn. Orange-teal color grading. They wear matching 
dark athletic gear. Slight slow motion. City buildings in background with warm 
golden light hitting the tops. Street is wet from morning rain reflecting orange 
streetlights. Camera tracks alongside them at shoulder height. Energy is powerful 
and unified. Film grain, shallow depth of field. 9:16 portrait orientation.
```

### Style Keywords: `group running, urban, dawn, cinematic, team, power, orange teal grade`

### Negative Prompt: `solo runner, bright daylight, cartoon, static camera, text`

---

## BONUS CLIPS (if time allows)

### CLIP 6: Feet Hitting Pavement (B-roll insert)
```
Extreme close-up slow motion of running shoes hitting wet pavement. Water 
droplets splash in slow motion. Orange-tinted streetlight reflection on wet 
ground. Dark background. Shot from ground level looking up slightly at the 
impact. Cinematic, dramatic. 9:16 portrait.
```

### CLIP 7: Runner's Watch/Wrist (B-roll insert)
```
Close-up of a runner's wrist with a smartwatch showing pace data. The runner 
is in motion (slight arm swing blur). Dark athletic clothing. Shallow depth 
of field, only the watch face is sharp. Orange accent light reflects off the 
watch glass. Cinematic color grading.
```

---

## Generation Settings

| Parameter | Value |
|-----------|-------|
| Aspect Ratio | 9:16 (portrait) |
| Duration | 4-8 seconds |
| Quality | Highest available |
| Style | Cinematic / Film |
| CFG Scale | 7-8 (if available) |
| Seed | Random (generate 3 variations, pick best) |

## Post-Processing Notes

After generating, apply in the render pipeline:
1. Additional contrast boost (+15%)
2. Orange/teal color grade overlay
3. Film grain texture
4. Vignette
5. Speed ramp (slow-mo 0.6x for dramatic moments)

---

## Workflow (using open-generative-ai Workflow Studio)

If using the node-based Workflow Studio:
1. Text → Image (generate key frame)
2. Image → Video (animate the key frame for consistency)
3. Apply style transfer for brand color matching
4. Upscale to 1080x1920

This two-step approach gives more control over composition than pure text-to-video.
