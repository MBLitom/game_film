import test from "node:test";
import assert from "node:assert/strict";
import {TEXTURED_H3_COST,makeMeshRequest,getBalance,requestMesh,flags} from "../tools/mesh-ai.mjs";

test("3d request is a physical textured mesh with explicit web polygon limit",()=>{
 const request=makeMeshRequest();
 assert.equal(request.face_limit,40000);
 assert.equal(request.model,"v3.1-20260211");
 assert.equal(request.texture,true);
 assert.ok(TEXTURED_H3_COST>=20);
});
test("default is offline safe",()=>{assert.equal(flags([]).execute,false);});
test("balance call is read only",async()=>{
 let requests=[];
 let fetchImpl=async(url,options)=>{
  requests.push([url,options.method]);
  return {ok:true,json:async()=>({code:0,data:{balance:300,frozen:0}})};
 };
 const b=await getBalance({key:"fake",fetchImpl});
 assert.equal(b.balance,300);
 assert.deepEqual(requests,[[ "https://openapi.tripo3d.ai/v3/account/balance","GET" ]]);
});
test("no trial declaration => no network",async()=>{
 let called=false;
 await assert.rejects(()=>requestMesh({key:"fake",fetchImpl:()=>{called=true;}}),/verify/);
 assert.equal(called,false);
});
test("insufficient credits => no generation",async()=>{
 let requests=[];
 let fetchImpl=async(url,opts)=>{requests.push(url);return {ok:true,json:async()=>({code:0,data:{balance:3,frozen:0}})};};
 await assert.rejects(()=>requestMesh({key:"fake",confirmedFreeTrial:true,fetchImpl}),/Insufficient/);
 assert.equal(requests.length,1);
});
test("mock task only after balance check",async()=>{
 const requests=[];
 const fetchImpl=async(url,options)=>{
  requests.push([url,options.method]);
  return {ok:true,json:async()=> url.endsWith("/account/balance") ? {code:0,data:{balance:50,frozen:0}} : {code:0,data:{task_id:"test-id"}}};
 };
 const result=await requestMesh({key:"fake",confirmedFreeTrial:true,fetchImpl});
 assert.equal(result.task_id,"test-id");
 assert.equal(requests.length,2);
 assert.equal(requests[1][1],"POST");
});
