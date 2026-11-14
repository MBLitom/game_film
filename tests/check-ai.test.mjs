import test from "node:test";
import assert from "node:assert/strict";
import {checkProviders} from "../tools/check-ai.mjs";

test("missing either key results in zero outgoing requests", async () => {
  let called = 0;
  await assert.rejects(() => checkProviders({geminiKey:"",tripoKey:"a",fetchImpl:()=>{called++;}}),/Missing/);
  await assert.rejects(() => checkProviders({geminiKey:"a",tripoKey:"",fetchImpl:()=>{called++;}}),/Missing/);
  assert.equal(called,0);
});
test("verification only performs read-only lookups", async () => {
  const requests = [];
  const fetchImpl = async(url, options) => {
    requests.push({url, method:options.method});
    return url.includes("generativelanguage")
      ? {ok:true,status:200}
      : {ok:true,status:200,json: async () => ({code:0,data:{balance:300,frozen:0}})};
  };
  const result=await checkProviders({geminiKey:"fake-google",tripoKey:"fake-tripo",fetchImpl});
  assert.deepEqual(requests.map(x=>x.method),["GET","GET"]);
  assert.equal(result.tripo_available_credits,300);
  assert.equal(result.tripo_free_trial_confirmed,false);
});
test("provider errors do not leak keys", async () => {
  const badKey="the-private-secret-value";
  const fetchImpl=async()=>({ok:false,status:401});
  await assert.rejects(() => checkProviders({geminiKey:badKey,tripoKey:"t",fetchImpl}),error=>{
    assert.equal(error.message.includes(badKey),false);
    return true;
  });
});

test("Tripo Client ID is rejected before network; no secret value is printed", async () => {
  let calls=0;
  await assert.rejects(
    ()=>checkProviders({geminiKey:"sample-google",tripoKey:"tcli_123_not_a_real_key",fetchImpl:()=>{calls++;}}),
    /Client ID, not an API Key/
  );
  assert.equal(calls,0);
});
test("Tripo 401 gives actionable guidance without leaking a key", async () => {
  const secret="tsk_secret_example";
  let calls=0;
  const fetchImpl=async()=> {
    calls++;
    if(calls===1) return {ok:true,status:200};
    return {ok:false,status:401};
  };
  await assert.rejects(
    ()=>checkProviders({geminiKey:"example",tripoKey:secret,fetchImpl}),
    error=> { assert.match(error.message,/HTTP 401/); assert.equal(error.message.includes(secret),false); return true; }
  );
  assert.equal(calls,2);
});
