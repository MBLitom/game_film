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
