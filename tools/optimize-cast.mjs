/**
 * GAME FILM 3D cast optimiser.
 * Preserve only film acting clips. The original Ara export includes 216 game
 * clips (combat, swimming, vehicles etc.) irrelevant to a family-film pilot.
 * Trimming animations dramatically reduces mobile downloads while preserving
 * rig, facial blendshapes, textures, skeleton, skin weights and wardrobe.
 *
 * Required build-time dependencies (free MIT):
 *   npm install --no-save --no-package-lock @gltf-transform/core @gltf-transform/functions
 */
import {NodeIO} from "@gltf-transform/core";
import {prune} from "@gltf-transform/functions";
import {rename,stat} from "node:fs/promises";
import {resolve} from "node:path";

export const KEEP_NAMES = new Set([
  "Idle",
  "Walk",
  "Talk with gestures",
  "Wave",
  "Laugh",
  "Cry",
  "Point",
  "Clap",
  "Cheer",
  "Dance (groove)",
  "Look around",
  "Happy idle"
]);

export async function optimizeOne(filename){
  const input=resolve(filename);
  const before=(await stat(input)).size;
  const io=new NodeIO();
  const doc=await io.read(input);
  const root=doc.getRoot();
  const animations=root.listAnimations();
  for(const anim of animations){
    if(!KEEP_NAMES.has(anim.getName()))anim.dispose();
  }
  const retained=root.listAnimations();
  if(!retained.some(a=>a.getName()==="Idle") ||
     !retained.some(a=>a.getName()==="Talk with gestures")){
    throw new Error("Essential cinematic acting clips missing in "+filename);
  }
  await doc.transform(prune({keepLeaves:false}));
  const output=input+".optimized.glb";
  await io.write(output,doc);
  const after=(await stat(output)).size;
  if(after>=before || after===0)throw new Error("Optimisation failed to save bytes for "+filename);
  await rename(output,input);
  console.log(JSON.stringify({
    model:filename,before_mb:(before/1048576).toFixed(2),
    after_mb:(after/1048576).toFixed(2),
    animations_before:animations.length,
    animations_after:retained.length,
    reduction_percent:Math.round(100*(1-after/before))
  }));
}
if(process.argv[1] && process.argv[1].endsWith("/optimize-cast.mjs")){
  for(const filename of process.argv.slice(2)){
    await optimizeOne(filename);
  }
}
