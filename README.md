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

## Real-film pipeline — Kling or Google Flow (footage pending)

Our current public homepage is still the original **3D interaction prototype**, not a photorealistic movie. The separate [cinema staging route](https://mblitom.github.io/game_film/cinema/) is prepared for **original, licensed real-looking AI footage** created offline with Kling, Flow or another compliant provider, followed by actual in-frame 3D choices.

**No cinematic source clips have yet been generated or published.** Google Flow rejected an earlier fictional-child prompt. The first Kling experiment is ready as an original, age-appropriate 9:16 family scene; **no Kling generation has been run or credited to this project**. See [the ready-to-paste Kling first-shot instructions](docs/KLING_FIRST_REAL_SHOT.md).

The player now reads `public/film/ep01/` (provider-neutral):
- `intro.mp4` — this file **alone** allows an honest *first-shot preview*, then the story pauses for the child
- `outfit_ok.mp4` — same actresses, Sky now wearing the accepted star outfit
- `room_ok.mp4` — same actresses/outfits in the approved galaxy room
- `empathy_ok.mp4` — natural apology and ending

Each missing continuation is reported as pending: **no invented video or placeholder footage is passed off as a real movie**. Child-facing real-time paid video generation is not required. Test-pattern footage exists in CI only and is never committed.

Implementation: `cinema/player.js`, `cinema/story-playback.mjs`, `tools/smoke-cinema.mjs`, `tools/validate-flow-clips.mjs` (provider-neutral despite older filename), `.github/workflows/smoke-cinema.yml`.

Zero EUR in new expenses; no Oracle; existing Hetzner for new server jobs if ever needed. Do not alter automatic provenance markings or misrepresent synthetic scenes as real footage.

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
