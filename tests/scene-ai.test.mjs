import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_MODEL,makeSceneRequest,requestScene,validateScene,parseFlags} from "../tools/scene-ai.mjs";

const sample={
 title:"Friends First",lesson:"listen kindly",cast:[{id:"sky",name:"Sky"}],
 set:{id:"room1"},shots:[
  {id:"a",duration_seconds:5,camera_action:"Dolly",approved_outfit:"star",approved_set:"room1"},
  {id:"b",duration_seconds:7,camera_action:"Orbit",approved_outfit:"star",approved_set:"room1"}
 ],asset_briefs:[],continuity_rules:[]
};

test("default action is safe dry run",()=>{
 assert.deepEqual(parseFlags([]),{execute:false,verifiedFree:false});
 assert.throws(()=>parseFlags(["--execute","--dry-run"]),/either/);
 assert.throws(()=>parseFlags(["--paid"]),/Unknown/);
});
test("google output requests 3D authored scene not a fake completed model",()=>{
 const req=makeSceneRequest();
 assert.match(req.systemInstruction.parts[0].text,/3D cameras/);
 assert.match(req.systemInstruction.parts[0].text,/No 2D pictures/);
 assert.equal(req.generationConfig.responseMimeType,"application/json");
 assert.equal(DEFAULT_MODEL,"gemini-3.1-flash-lite");
});
test("missing key sends no requests",async()=>{
 let called=false;
 await assert.rejects(()=>requestScene({fetchImpl:()=>{called=true;throw Error("should not call");}}),/missing/);
 assert.equal(called,false);
});
test("json result validates via fake network, with no actual API calls",async()=>{
 const fetchImpl=async (_url,opts)=>{
   assert.equal(opts.headers["x-goog-api-key"],"test-only-key");
   return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(sample)}]}}]})};
 };
 const scene=await requestScene({key:"test-only-key",fetchImpl});
 assert.equal(scene.shots.length,2);
});
test("no paid fallback for upstream error",async()=>{
 await assert.rejects(()=>requestScene({key:"dummy",fetchImpl:async()=>({ok:false,status:429})}),/429.*no retry/);
});
test("invalid scene is rejected",()=>{
 assert.throws(()=>validateScene({shots:[],cast:[],set:{}}),/incomplete/);
 assert.throws(()=>validateScene({...sample,shots:[{...sample.shots[0],approved_outfit:""},sample.shots[1]]}),/Invalid cinematic shot/);
});
