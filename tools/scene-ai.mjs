/**
 * GAME FILM / Google Gemini — OFFLINE authoring tool.
 *
 * No browser requests, no recurring jobs, no paid API fallback.
 * This only authors structured 3D scene / dialogue specifications,
 * NOT a GLB or a finished motion-captured actor.
 *
 * Usage:
 *   node tools/scene-ai.mjs --dry-run
 *   GEMINI_API_KEY=... node tools/scene-ai.mjs --execute --verified-free
 *
 * Safety: operator must verify the key's project is on Google Free tier.
 * A paid-tier API key can incur charges; we never assume any key is free.
 */
import {pathToFileURL} from "node:url";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";

export const DEFAULT_MODEL = "gemini-3.1-flash-lite";
export const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const sceneSchema = {
  type:"object",
  properties:{
    title:{type:"string"},
    lesson:{type:"string"},
    cast:{type:"array",items:{type:"object",properties:{
      id:{type:"string"},name:{type:"string"},physical_description:{type:"string"},
      personality:{type:"string"},outfit:{type:"string"},preferred_style:{type:"string"}
    },required:["id","name","physical_description","personality","outfit","preferred_style"]}},
    set:{type:"object",properties:{
      id:{type:"string"},visual_description:{type:"string"},editable_objects:{type:"array",items:{type:"string"}},
      lighting:{type:"string"}
    },required:["id","visual_description","editable_objects","lighting"]},
    shots:{type:"array",items:{type:"object",properties:{
      id:{type:"string"},duration_seconds:{type:"number"},camera_action:{type:"string"},
      actor_animation:{type:"string"},dialogue:{type:"string"},interaction:{type:"string"},
      approved_outfit:{type:"string"},approved_set:{type:"string"}
    },required:["id","duration_seconds","camera_action","actor_animation","dialogue","interaction","approved_outfit","approved_set"]}},
    continuity_rules:{type:"array",items:{type:"string"}},
    asset_briefs:{type:"array",items:{type:"object",properties:{
      id:{type:"string"},kind:{type:"string"},description:{type:"string"},
      intended_file:{type:"string"},generation_method:{type:"string"}
    },required:["id","kind","description","intended_file","generation_method"]}}
  },
  required:["title","lesson","cast","set","shots","continuity_rules","asset_briefs"]
};

export function makeSceneRequest(){
  return {
    systemInstruction:{parts:[{text:[
      "You are the cinematic director of an ORIGINAL interactive photorealistic 3D family series, ages 5–12.",
      "The main experience is a MOVIE with real-time 3D cameras, sets, articulated fictional actors and live English dialogue.",
      "No 2D pictures, no stock clips, no slideshow, no CSS decorations, no dress-up app UI.",
      "The child acts as a mini editor: physically chooses wardrobe and changes room decorations within the 3D set.",
      "A character kindly rejects outfits without an authored cinematic continuation; the viewer can try again with hints.",
      "Accept only one predetermined outfit and one predetermined room, ensuring continuity in EVERY later shot.",
      "Include a gentle lesson about empathy, listening or respecting belongings; crying and anger are normal feelings.",
      "The result is a shot-by-shot editable 3D production specification, not a finished 3D model.",
      "Use English dialogue, actor stage directions, camera focal length/movement descriptions.",
      "Describe 2 fictional actresses, a lively backstage dressing room and a galaxy-themed party room."
    ].join(" ")}]},
    contents:[{role:"user",parts:[{text:[
      "Write EPISODE 01, scene 01: two friends are preparing for a party.",
      "Sky wants a star outfit; Emma likes bows. Sky initially disagrees politely with other outfits.",
      "The club unexpectedly changes to a Galaxy Glow theme. The child redesigns the actual 3D room.",
      "Include 5–7 short cinematographic shots, at most 2 interactive interruptions.",
      "Describe individual THREE-DIMENSIONAL film assets requiring creation and animation rigs.",
      "No child accounts, ads, tracking, or commercial product placements.",
      "Write physically feasible camera, action and outfit continuity instructions in English."
    ].join(" ")}]}],
    generationConfig:{
      responseMimeType:"application/json",
      responseJsonSchema:sceneSchema,
      maxOutputTokens:3500
    }
  };
}

export function validateScene(scene){
  if(!scene || typeof scene!=="object" || !Array.isArray(scene.cast) || scene.cast.length<1 ||
     !Array.isArray(scene.shots) || scene.shots.length<2 || scene.shots.length>10 ||
     !scene.set?.id || !Array.isArray(scene.asset_briefs) || !Array.isArray(scene.continuity_rules)){
     throw new Error("Gemini returned an incomplete film scene; refusing to publish it.");
  }
  for(const shot of scene.shots){
    if(!shot.id || !Number.isFinite(shot.duration_seconds) || shot.duration_seconds<=0 ||
       !shot.camera_action || !shot.approved_outfit || !shot.approved_set){
      throw new Error("Invalid cinematic shot: "+(shot.id || "unknown"));
    }
  }
  return scene;
}

export async function requestScene({key, fetchImpl=fetch, model=DEFAULT_MODEL}={}){
  if(typeof key!=="string" || !key.trim()) throw new Error("GEMINI_API_KEY missing; no API request sent.");
  if(model!==DEFAULT_MODEL) throw new Error("Model is pinned to the audited free-tier model. No paid model override.");
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),45000);
  try{
    const response=await fetchImpl(ENDPOINT+"/"+model+":generateContent",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":key},
      body:JSON.stringify(makeSceneRequest()),
      signal:controller.signal
    });
    if(!response.ok){
      // Never log responses or request headers: an upstream error could echo credentials.
      throw new Error("Gemini returned HTTP "+response.status+"; no retry or paid fallback.");
    }
    const body=await response.json();
    const text=body.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("");
    if(!text) throw new Error("Gemini did not return a scene specification.");
    let scene;
    try { scene=JSON.parse(text); }
    catch { throw new Error("Gemini response was not parseable JSON."); }
    return validateScene(scene);
  } finally {
    clearTimeout(timeout);
  }
}

export function parseFlags(args){
  const set=new Set(args);
  for(const arg of set) if(!["--execute","--verified-free","--dry-run"].includes(arg))throw new Error("Unknown argument "+arg);
  if(set.has("--dry-run") && set.has("--execute")) throw new Error("Choose either dry-run or execute.");
  return {execute:set.has("--execute"),verifiedFree:set.has("--verified-free")};
}

async function main(){
  const flags=parseFlags(process.argv.slice(2));
  if(!flags.execute){
    console.log(JSON.stringify({status:"dry-run",provider:"Google Gemini",model:DEFAULT_MODEL,
      keyRequired:true,serverRequired:false,
      keyExposedToBrowser:false,request:makeSceneRequest()},null,2));
    return;
  }
  if(!flags.verifiedFree){
    throw new Error("No request sent. Verify your Google AI Studio project is FREE tier and then pass --verified-free.");
  }
  const scene=await requestScene({key:process.env.GEMINI_API_KEY});
  const file=resolve("generated/scene_01.json");
  await mkdir(resolve("generated"),{recursive:true});
  await writeFile(file,JSON.stringify(scene,null,2)+"\n",{flag:"wx"});
  console.log("Saved validated scene spec to generated/scene_01.json (no keys written).");
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main().catch(err=>{console.error("GAME FILM:",err.message);process.exitCode=1;});
}
