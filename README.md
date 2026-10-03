# Shree AI Video

A browser-first, free AI-video creation foundation built with Next.js.

## Current MVP
- Script → scene splitting
- 9:16 vertical canvas composition
- Optional image per scene
- Animated pan/zoom
- On-device WebM rendering
- No paid API key required

## Run locally
```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Roadmap
- AI script assistant
- Local/open-source text-to-image integration
- Local/open-source TTS
- Scene timeline and transitions
- Background music
- GPU-backed image-to-video adapters
- MP4/FFmpeg worker
- Project save/export

The architecture is intentionally provider-neutral so open-source or self-hosted AI models can be added later.