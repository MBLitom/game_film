# GAME FILM — original interactive 3D cinema

**MB Litom** · open-source technical pilot · November 2026

The idea is a **film, not a dress-up game**. Children watch an original story performed by 3D actors in a three-dimensional set. At certain story beats, they become mini-directors: they change a character's clothes, rearrange the party setting and help the friends handle disagreement. The character has a personality and can gently reject unsupported choices; approved choices preserve cinematic continuity.

## Watch the current technical pilot

**https://mblitom.github.io/game_film/** — redirects to the original 3D film at `/3d/`. Touch-friendly, full-screen, no scrolling, captions and optional English device voice.

### What actually works

- **Three original GLB exports:** Sky (preparation outfit), Sky (accepted party outfit) and Emma. The generation source is the CC0 MakeHuman model data, built using MIT-licensed [Ara 3D Gen](https://github.com/olatunde85/3d-gen).
- Each exported actor has a real skinned mesh, bone rig, **11 retained acting animations**, and **34 facial morph targets** (340 morph influences distributed across ten skinned primitives). These include mouth visemes, blink controls and expressions.
- **Real 3D film set:** physical room geometry, furniture, lights, camera dolly targets, foreground outfit props and decor meshes. No CSS set substitution and no stock footage in the current site.
- **Narrative continuity:** style choice physically swaps the character GLB, accepted galaxy decor changes the room geometry and lighting, and the story continues to a friendship/consent lesson.
- **Interaction:** rays from actual touch positions select physical 3D props in the scene. The script kindly rejects incompatible options with hints.
- **Basic virtual acting:** idle and gestures via the GLB animation system; face blink/approximate speech mouth movements via actual morph targets. English dialogue is spoken by the browser's text-to-speech engine when available.
- **Mobile:** compressed actors are approximately 4–5 MiB each rather than 27 MiB; 390 × 844 full-story Chrome WebGL regression test succeeded.

This is **NOT yet a photorealistic film**. The production still needs more cinematic acting, professional lighting, tailored costumes, facial performance capture / lip synchronization, longer original episodes and age-appropriate user observation. Current outfits and rooms are early art assets, not the final standard. We do not falsely claim NVIDIA Audio2Face or paid AI generated this film.

## Google Flow cinema pipeline (new — production footage pending)

We now maintain a separate **film-first** cinematic player at [the cinema staging route](https://mblitom.github.io/game_film/cinema/). It is designed to show original photorealistic shots generated OFFLINE in **Google Flow** with 3D editing inside the paused movie frame, then resume the next matching authored clip. This is **not the same as the earlier 3D game demo**.

**Important:** Flow footage has **not** been generated, reviewed or added yet. The cinema route explicitly reports missing real clips instead of showing fake clips or stock images. The public home still displays the separate original-3D *interaction* technical preview until real film assets are ready.

- See [original cast bible and four Google Flow video prompts](docs/FLOW_EP01_PRODUCTION.md), with 9:16 phone-first framing and 0 EUR new costs.
- Four files are required in `public/flow/ep01/`: `intro.mp4`, `outfit_ok.mp4`, `room_ok.mp4`, `empathy_ok.mp4`.
- The story player is `cinema/player.js`; the auditable film timeline is `cinema/story-playback.mjs`.
- The child can touch/drag real Three.js wardrobe and decor objects in front of a paused cinematic frame; choices remain authored, **not paid per-viewer video AI requests**.
- Cinema readiness and user interaction smoke tests use synthetic color clips on GitHub Actions only. Those test clips are **never committed, never shown as actual episode content and never substitutes for Flow video**.
- Verify actual media with `node tools/validate-flow-clips.mjs public/flow/ep01` (requires ffprobe) and adult visual review before making the cinema player the public default.
- Keep Google's invisible SynthID provenance marker intact and follow Flow's current download and distribution terms.

## Development

```sh
python3 -m http.server 8000
# Open http://localhost:8000/ (automatically enters /3d/)
```

No runtime server, paid API, user account, ads, camera, microphone, cookies or tracking is required.

## Repo layout

- `3d/index.html`, `3d/film.css`, `3d/film.js` — browser-side 3D film and narrative UI.
- `public/models/*.glb` — three generated rigged original actor assets.
- `assets/actors/*.params.json` — reproducible original character/wardrobe configurations.
- `story-engine.mjs` — independently tested, small branching story rules.
- `vendor/` — local Three.js, GLTFLoader, geometry utilities and MIT meshopt decoder. These libraries have their own licenses.
- `scripts/fetch-ara-assets.py` — downloads the **prebuilt CC0 MakeHuman** assets at the public Ara CDN, without the unreachable original asset ZIP.
- `scripts/assert-cast.mjs` — validates actual GLB geometry, rigs, file integrity and animation/morph data.
- `tools/optimize-cast.mjs` — leaves the family-film animations and compresses mesh data, preserving skin and morph targets.
- `tools/smoke-3d.mjs` — headless Chrome full 3D film test in a portrait viewport.
- `.github/workflows/build-original-cast.yml` — manually repeatable original GLB export on an included public GitHub runner.
- `.github/workflows/optimize-original-cast.yml` — free mobile model optimization.
- `.github/workflows/smoke-3d.yml` — browser regression and temporary screenshots.
- `tools/scene-ai.mjs`, `tools/mesh-ai.mjs`, `tools/check-ai.mjs` — **offline-by-default** Google / Tripo authoring adapters; not used by visitors to the film.

## AI authoring and costs

Google Gemini API credentials were verified via a GitHub Actions read-only check, but **Free-tier authoring requests require explicit verification of the API project's free status** before executing the workflow. Tripo API credentials also work but the **available API credits were 0**, so there is no GLB generation on Tripo. No new paid subscriptions or services are authorized.

The active demo uses open-source 3D asset generation rather than unavailable Tripo credits. NVIDIA Audio2Face is a possible future source for phoneme-matched expressions but is **not yet integrated**.

See [AI pipeline](docs/AI_PROVIDER_PIPELINE.md) and [0 EUR new-cost / Hetzner-first policy](docs/ZERO_COST_INFRASTRUCTURE.md). Existing Hetzner hosts may be used for justified new server workloads after capacity checks; **Oracle is excluded**. The actual web demo is statically hosted on GitHub Pages.

## Tests and observed status

- Original cast build: completed with validated GLB rig + geometry.
- Cast optimization: completed with the 11 acting clips and `EXT_meshopt_compression` extension.
- Browser smoke test: successfully reached the end of the story with the original actors, real choices, real stage transformation and no scroll; tests also check that unsupported choices do not skip a narrative beat.
- Web browser TTS varies by device: voices and timing are not guaranteed to be identical on different phones.

## Privacy, accessibility and licensing

This project is designed for children and does **not** collect a child's name, voice, camera images or usage analytics. Feelings are not bad; the story encourages kindness, boundaries and listening rather than shaming or manipulating children.

Source code: **MIT** — see `LICENSE`. MakeHuman model source assets used in our pipeline: **CC0**, with Ara 3D Gen source under MIT. Separate original brand identity and trademarks are not granted by MIT. Verify every additional model/voice/texture/asset license independently before publishing.

## Next production milestones

1. Replace early wardrobe meshes with believable, fit-controlled 3D outfits on the same identity and improve hair/skin realism.
2. Cinematic acting: authored movement paths, coherent shot blocking, reaction and emotion timing.
3. Real phoneme-aware face motion and localized prerecorded English voice or licensed open weights.
4. Visual quality and mobile performance regression on real phones; film-first accessibility test with young viewers and adults.
5. Produce a short complete original scene with consistent final actors and set.
