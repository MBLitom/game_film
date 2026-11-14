# GAME FILM — an interactive film, not a dress-up game

An open-source, film-first experience by **MB Litom**. Designed for a young audience with adult oversight: viewers watch a story with real footage, then occasionally touch the screen or choose a look to help the story continue.

## Play the prototype

https://mblitom.github.io/game_film/

**Status:** experimental interactive-film player. It is **not** a finished episode, the people shown in the demonstration footage are **not** our original cast, and the temporary 3D accessories and synthesized dialogue are **not** yet synchronized to live performers. This implementation validates full-screen cinematic playback, a timed interruption, mobile touch controls, branching and a 3D depth layer. No account, ads, microphone, camera, or data collection.

## Principles

- The story runs full-screen without page scrolling on mobile or desktop.
- Film first; interaction only at relevant story beats, not constant game menus.
- English narration and subtitles; no reading required to understand the basic mechanic.
- Real people and cinematic scenes are the target. Avoid cartoon mannequins as a substitute for film.
- 3D environmental effects are rendered with Three.js, similar to MB Litom's Golf and Lumina projects.
- **0 EUR recurring-cost target**, no paid APIs or required backend for the prototype.
- Children should never be manipulated into staying online; age-appropriate and privacy-preserving by design.

## Structure

- `index.html`: immersive player and minimal overlay UI
- `styles.css`: locked 100dvh viewport, safe-area handling, portrait/landscape layouts
- `main.js`: film timeline, choices, narrator, touch reaction and lightweight Three.js effects
- `vendor/`: local Three.js modules, released under their own MIT license
- `media/`: temporary demonstration footage (WebM sources and MP4 mobile-compatible derivatives) under CC BY-SA 4.0, **not under this repository's MIT code license**

## Infrastructure

**New-project server placement: existing Hetzner**, not Oracle. The current static demo is temporarily delivered through GitHub Pages and does not require a server. If backend hosting or compute becomes necessary, use the existing Hetzner environment only after capacity checks, with **0 EUR in new costs or plan changes** without approval. Oracle is excluded from GAME FILM workloads. See [infrastructure policy](docs/ZERO_COST_INFRASTRUCTURE.md).

## Development

Serve the directory through any static HTTP server, e.g. `python3 -m http.server 8000`, and open `http://localhost:8000` (file:// cannot load JavaScript modules reliably). No build tools or keys required.

## Roadmap

1. Replace temporary stock video with original fictional characters and consistent film shots (requires rights-cleared production assets).
2. Implement frame-accurate character hit regions and 3D wardrobe attachment rather than generic touch triggers.
3. Record English dialogue and prepare matching reaction shots / NVIDIA Audio2Face animations where compatible.
4. Add a scene graph with seamless outfit continuity across film cuts.
5. Test on different Android / iOS browsers, with accessibility and parental controls.

## Licensing

Source code under MIT (see `LICENSE`). Third-party footage and software have separate terms (see `MEDIA_CREDITS.md` and `vendor/LICENSE`). MB Litom name and logo are not granted as general-purpose trademarks.
