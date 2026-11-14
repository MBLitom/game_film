# GAME FILM — infrastructure and zero-new-cost policy

**Project owner: MB Litom.** No purchases, subscriptions, new services or resource increases without the owner's explicit approval.

## Deployment ownership — Hetzner, not Oracle

- **All new MB Litom projects belong on the existing Hetzner infrastructure if server-side hosting, storage, workers or compute are actually required.**
- GAME FILM source is maintained in GitHub (`MBLitom/game_film`).
- For the **current static demo only**, GitHub Pages serves the public prototype at https://mblitom.github.io/game_film/. This is not a new backend server and does not change the Hetzner-first rule.
- When a backend, site server or server-side media processing is justified, deploy within the **existing Hetzner environment**, after checking available CPU, RAM, disk, network and coexistence with other services. Never create a second rented server or upgrade a plan without explicit approval.
- Prefer generating 3D assets off the live serving path; published output should be static, compressed GLB/GLTF, MP4/WebM and client-side WebGL.
- Production browser clients render the actors, room and camera locally wherever feasible. No per-viewer paid AI API or GPU server dependency.

## Oracle — existing infrastructure only, out of scope for this project

- Do not use Oracle for GAME FILM build jobs, models, training, video rendering, website backend or new resources.
- Never create, upgrade or resize OCI instances, disks, networks, services or billing.
- Do not use Oracle as a fallback if Hetzner is busy.
- No changes to Always Free plan or account-level spending settings.
- OCI free-tier limits cannot be verified from an ordinary server shell alone.

## Software / AI license safeguards

- Core project intended to remain open-source; source-code and generated media rights must be checked separately.
- Free AI tooling can be part of an **offline** content pipeline, with the relevant model weights' licensing verified for redistribution and required uses.
- The project targets zero EUR in **new** expenditure; existing paid Hetzner service remains a pre-existing company cost, not a new GAME FILM subscription.
- Do not initiate resource-intensive jobs on any production host without first checking available capacity and impact.
- If new cost or resource commitment becomes necessary, stop for approval.

## User experience requirements

- Film first, with 3D camera, actors, scene geometry, and minimal momentary interaction.
- No scrolling; full-viewport presentation on mobile.
- Original film scenes must preserve the selected costume and set across cuts.
- The child receives age-appropriate, kind feedback and is not shamed for emotions.
