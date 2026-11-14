# GAME FILM: zero-cost infrastructure policy

Status: mandatory project constraint set by MB Litom. No spending, subscription, or resource plan change may be initiated without explicit owner approval.

## Production & runtime
- GitHub Pages provides the static public demo. Never provision a cloud game server for this project as a default.
- Rendering of the 3D environment, materials, characters, cinematics and player actions happens in the visitor's WebGL-capable browser. Browser-side rendering does **not** consume Oracle GPU time.
- Generated film clips and other assets are stored as static optimized files. No per-viewer remote AI inference.
- Original film scenes and characters are built offline from original or rights-cleared open-source assets.
- Optional AI software is used only under its actual model and SDK licenses; open-source game code does not mean third-party weights are automatically free to distribute.

## Oracle Always Free — strict no-expansion rule
- No creation, resizing or shape migration of OCI instances for GAME FILM.
- No new paid GPU, block volume, object storage, load balancer, database, networking resource, egress service or marketplace listing.
- No local model training, large model inference, mass dataset downloads, bulk asset builds or video rendering on the existing Oracle host.
- No changes to account tier, Always Free plan, cost settings or OCI billing.
- No automated job or CI pipeline may issue OCI mutation commands.
- When in doubt, **stop and request owner approval** rather than risk consuming a metered resource.

## Build & test
- Prefer code-only changes in GitHub; optional static builds in free CI within the published included quota, without paid upgrades.
- Heavy generation happens only on a separately approved local/offline computer. Check available CPU, memory, free disk and graphics hardware before execution.
- Never silently launch resource-intensive tasks on existing Litom production hosts.
- Prefer compact GLB/GLTF, static animations and compressed MP4/WebM with lazy loading and no always-on backend.
- Local tests, GitHub Pages and browser rendering should not depend on Oracle being available.

## Verification
- A shell on the Oracle server can verify processes, memory and disk usage but **cannot confirm OCI billing, free-tier eligibility or account-wide capacity**. Verify these via the OCI tenancy console before any architectural change.
- The project cannot claim Oracle usage is under every account limit without OCI tenancy metrics.
