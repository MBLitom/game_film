/**
 * GAME FILM / Tripo v3 — optional 3D mesh generation from verified free trial credits.
 * NEVER called by the public website. No automatic retries, payments or top-ups.
 * Check account balance before any task. Balance alone DOES NOT distinguish free
 * trial credits from purchased credits: the operator must confirm trial-only.
 *
 * Commands:
 *  node tools/mesh-ai.mjs --dry-run
 *  TRIPO_API_KEY=... node tools/mesh-ai.mjs --balance
 *  TRIPO_API_KEY=... node tools/mesh-ai.mjs --execute --verified-free-trial
 */
import {pathToFileURL} from "node:url";
import {resolve} from "node:path";

export const API = "https://openapi.tripo3d.ai/v3";
export const TEXTURED_H3_COST = 20; // base price as of 2026-11, can change
export const DEFAULT_PROMPT = [
  "Original fictional adult female film actress, age 22, full body neutral A-pose,",
  "realistic human anatomy, friendly neutral expression, clean editable topology,",
  "long brown hair, modest layered indigo star jacket, comfortable trousers and shoes,",
  "fully clothed, isolated standing figure, no background, for real-time 3D film."
].join(" ");

export function makeMeshRequest(prompt=DEFAULT_PROMPT) {
  if(typeof prompt!=="string"||!prompt.trim()||prompt.length>1024)throw new Error("Invalid 3D prompt");
  return {
    prompt:prompt.trim(),
    model:"v3.1-20260211",
    texture:true,pbr:true,texture_quality:"standard",
    geometry_quality:"standard",
    face_limit:40000,
    negative_prompt:"flat 2D illustration, distorted hands, fused limbs, cropped, extra fingers, nude"
  };
}

async function jsonCall(fetchImpl, route, {key, method="GET",payload}={}){
  if(typeof key!=="string"||!key.trim()) throw new Error("TRIPO_API_KEY missing; no request sent");
  const ctl=new AbortController();
  const timeout=setTimeout(()=>ctl.abort(),45000);
  try {
    const response=await fetchImpl(API+route,{
      method,
      headers:{"Authorization":"Bearer "+key,...(payload?{"Content-Type":"application/json"}:{})},
      ...(payload?{body:JSON.stringify(payload)}:{}),
      signal:ctl.signal
    });
    if(!response.ok)throw new Error("Tripo HTTP "+response.status+"; no retry");
    const data=await response.json();
    if(data.code!==0)throw new Error("Tripo API status "+String(data.code)+"; stopped");
    return data.data;
  }finally{clearTimeout(timeout);}
}
export async function getBalance({key,fetchImpl=fetch}={}){
  const data=await jsonCall(fetchImpl,"/account/balance",{key});
  if(!Number.isFinite(data?.balance)||data.balance<0||!Number.isFinite(data?.frozen)){
    throw new Error("Invalid Tripo credit balance response");
  }
  return {balance:data.balance,frozen:data.frozen};
}
export async function requestMesh({key,fetchImpl=fetch,confirmedFreeTrial=false,prompt=DEFAULT_PROMPT}={}){
  if(!confirmedFreeTrial)throw new Error("No generation: verify available credits are from the FREE API trial first");
  const available=await getBalance({key,fetchImpl});
  if(available.balance<TEXTURED_H3_COST){
    throw new Error("Insufficient available trial credits; refusing 3D generation");
  }
  const data=await jsonCall(fetchImpl,"/generation/text-to-model",{
    key,method:"POST",payload:makeMeshRequest(prompt)
  });
  if(typeof data?.task_id!=="string"||!data.task_id)throw new Error("Tripo task identifier missing");
  return {task_id:data.task_id,credits_before:available.balance,expected_base_credit:TEXTURED_H3_COST};
}
export function flags(args){
  const set=new Set(args);
  for(const v of set)if(!["--dry-run","--balance","--execute","--verified-free-trial"].includes(v)){
    throw new Error("Unknown argument "+v);
  }
  if(set.has("--execute")&&set.has("--balance"))throw new Error("Choose balance OR execute");
  return {balance:set.has("--balance"),execute:set.has("--execute"),freeTrial:set.has("--verified-free-trial")};
}
async function main(){
  const f=flags(process.argv.slice(2)),key=process.env.TRIPO_API_KEY;
  if(!f.execute&&!f.balance){
    console.log(JSON.stringify({
      status:"dry-run",provider:"Tripo 3D (not Google)",
      endpoint:API+"/generation/text-to-model",
      estimated_credits:TEXTURED_H3_COST,
      requires_verified_trial:true,
      generates:"asynchronous GLB task, NOT rigged film actor",
      request:makeMeshRequest()
    },null,2));
    return;
  }
  if(f.balance) {
    console.log(JSON.stringify(await getBalance({key}),null,2));
    return;
  }
  const result=await requestMesh({key,confirmedFreeTrial:f.freeTrial});
  console.log(JSON.stringify(result,null,2));
  console.log("Task created. Check v3/tasks/<task_id> for status. No polling/job was scheduled.");
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  main().catch(err=>{console.error("GAME FILM:",err.message);process.exitCode=1;});
}
