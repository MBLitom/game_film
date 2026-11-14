# GAME FILM — Kling first scene: zero-new-cost trial

**2026-11-14.** Target: one genuinely film-like **original** 5–10s clip in 9:16, **not another 3D game scene**. This is a *production test*, not a finished episode.

## What has been verified

- **Website:** https://kling.ai/ — the official app advertises daily free credits, but available free generations, models, queues and watermarks depend on the account.
- **API:** https://kling.ai/dev — the official API docs direct developers to *resource packages* and a trial resource package. They do **not** establish a permanently free API. **Do not connect a paid API or load a credit card.**
- **Content:** https://kling.ai/docs/community-policy — strictly prohibits harm/sexualization of minors, but does not describe a blanket prohibition on harmless family movies featuring fictional children. Acceptance still depends on Kling moderation.
- We have **no authenticated Kling account connection here**, so cannot click Generate, consume user credits or download a movie from the account on the user's behalf.

## One gentle original cinematic trial (film first, no makeover yet)

**Settings (choose only if available for free in the signed-in website):** Text to Video, 9:16 portrait, 5s or 8s, Standard 720p, one output, original characters. Check on-screen credits **before Generate**. No retries on moderation failure and no purchases.

### Prompt — paste directly

\`\`\`text
An original live-action family movie scene, professionally filmed, 9:16 portrait format. Two invented fictional girl friends, Sky and Emma, both aged 11–12, with no resemblance to real people or influencers. Both are fully clothed in age-appropriate everyday outfits. Sky has shoulder-length dark brown naturally wavy hair, warm brown eyes and a few freckles, lilac cardigan over an ivory shirt and comfortable navy trousers. Emma has a chin-length ginger bob, green-brown eyes, teal long-sleeved shirt, peach vest and jeans.

The girls are in a cozy colorful family living room: light oak floor, lavender walls, large oval mirror, bright natural light through a left window and a cream bench. A vivid but realistic family film atmosphere.

Shot 1: the cinematic camera tracks Emma entering naturally from the right doorway while Sky stands near the mirror.
Shot 2: a smooth cinematic medium-close shot of Sky turning toward Emma with an expressive, curious smile.
Shot 3: both friends share a delighted wave and begin walking together toward the wardrobe area. Natural human movement, authentic facial reactions, gentle friendly emotion, believable skin texture, realistic hair, cloth physics and a professionally moving camera. NOT a static portrait, slideshow, 3D video game or cartoon. No violence, distress, intimate situations, makeup applications, costume removal, sexualization, brands, text, captions or watermarks added by prompt.
\`\`\`

Audio may not be free in the chosen Kling mode. If unavailable, generate SILENT acting and add original English dialogue offline later. Do not sacrifice the visual test by repeating failed voice prompts. Respect any watermark automatically added by Kling.

**Why this is a separate first shot:** it tests motion, believable child actors, and a changing camera angle without combining all the film's interaction and wardrobe constraints in one generation. Future shots reuse the *same character references*, identities and approved outfits.

## Delivery into GAME FILM

1. Keep the source file exactly as downloaded, including provider labels / provenance. Do not publish automatically.
2. Adult-review the video for children's safety, licensing, real cinematic motion, identity and all frame errors.
3. For accepted files, place copies in \`public/film/ep01/\` with film-ordered names:
   - \`intro.mp4\` (first preview — **this alone now enables a partial film preview**)
   - \`outfit_ok.mp4\`
   - \`room_ok.mp4\`
   - \`empathy_ok.mp4\`
4. Validate source MP4s with \`node tools/validate-flow-clips.mjs public/film/ep01\` (works for Kling/Flow files; Node and ffprobe required).
5. The player at https://mblitom.github.io/game_film/cinema/ only plays *real* uploaded media. A single accepted \`intro.mp4\` shows the intro and the first interactive break, then an honest message that the next shot isn't available yet. All four files are needed for the full movie.

## Non-negotiables

Zero EUR additional expenses. No Oracle resources. New server workloads only on existing Hetzner if ever required; for now GitHub Pages is sufficient. No fake downloaded film or placeholders promoted as real videos. Do not replace Sky and Emma with adults or re-use real children's photos.
