# AI providers for GAME FILM (November 2026)

Goal: **original 3D cinematic episodes** with original virtual actors, physical rooms, animations, English dialogue, camera motion, outfits and continuity. **Not stock films, 2D pictures or CSS tricks.**

## Implemented offline authoring integrations

| Step | Provider | Real output | Conditions |
|---|---|---|---|
| Story, shot list, character and set briefs | Google Gemini 3.1 Flash-Lite | Structured JSON production specification; NOT a GLB | Free-tier API project + key, subject to usage limits |
| Model generation | Tripo API v3 H3.1 | Asynchronous 3D mesh task yielding GLB; NOT automatically a rigged film actor | Trial-only credits must be verified first; costs around 20 credits for a textured model |
| Real film | Three.js + character rigging / animation not yet implemented | Interactive 3D characters and set once assets exist | Renderer works locally in browser; assets and real film remain to be built |
| Server if necessary | Existing Hetzner | Static hosting / approved build tasks | No new paid resource. Oracle excluded. |

Google lists a Free tier for Gemini 3.1 Flash-Lite. Google free-tier prompts may be used for product improvement: never upload child photos, client data or confidential MB Litom IP.

Tripo's developer docs mention initial **300 API trial credits within two weeks**. Its Studio free credits are separate. Check the Tripo dashboard for actual API trial balance and expiry. The API balance alone does not distinguish free promotional credits from purchased credits.

## Offline / zero-cost safety

Both API tools default to **dry-run only**. No packages, paid API fallback, automated jobs or key storage. Node.js 22+.

Google:
1. Create a **Free-tier** key in [Google AI Studio](https://aistudio.google.com/api-keys), **without setting up billing**.
2. Privately configure the environment variable GEMINI_API_KEY on an authorized developer terminal (not in GitHub).
3. Run: node tools/scene-ai.mjs --dry-run
4. Only after verifying Free Tier: node tools/scene-ai.mjs --execute --verified-free
5. Output: generated/scene_01.json. A second run will not overwrite the first.

Tripo:
1. Create a key in [Tripo API console](https://platform.tripo3d.ai/) and confirm the trial credits are available and **not purchased**.
2. Privately configure environment variable TRIPO_API_KEY.
3. Run: node tools/mesh-ai.mjs --dry-run
4. Balance check (non-generating): node tools/mesh-ai.mjs --balance
5. Only after verifying promotional credits: node tools/mesh-ai.mjs --execute --verified-free-trial
6. Output: one task ID. No follow-up task, polling or credits purchase is scheduled.

Tests: node --test tests/scene-ai.test.mjs tests/mesh-ai.test.mjs

## What remains unimplemented

- Original GLB virtual performers generated and licensed.
- Character skeleton/skin, dynamic outfit mesh swaps and lip-synced facial animation.
- Proper 3D film set, scripted actors and cinematic camera continuity.
- Compatible animation/voice pipeline (NVIDIA or other free SDK, subject to separate license checks).

No claim that these are finished merely because the two API adapters are in GitHub.

## Official sources

- [Google API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Google REST API](https://ai.google.dev/api)
- [Tripo API v3](https://developers.tripo3d.ai/en/docs/introduction)
- [Tripo text-to-3D](https://developers.tripo3d.ai/en/docs/generation-text-to-model/standard)
- [Tripo API balance](https://developers.tripo3d.ai/en/docs/account)
- [Tripo free trial & credits](https://docs.tripo3d.ai/get-started/pricing.html)

## Rules

- No provider keys in the browser or public GitHub.
- No Oracle build or model jobs.
- If a server is necessary, **existing Hetzner only**, after checking capacity.
- **0 EUR new spend**: no paid model, top-up, subscription, resource changes or automatic fallback without owner approval.
