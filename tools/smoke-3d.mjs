/**
 * Local GitHub-runner smoke test for the original GAME FILM 3D scene.
 * Uses only a free Chrome browser, no Gemini/Tripo/Oracle calls.
 * Runs the FULL story on a narrow Android-like portrait viewport.
 */
import {chromium} from "playwright-core";
import {spawn} from "node:child_process";
import {mkdir} from "node:fs/promises";
import assert from "node:assert/strict";

const port=8177, URL="http://127.0.0.1:"+port+"/3d/?smoke=1";
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{stdio:"ignore"});
let browser;
const bugs=[];
async function waitState(page,state,timeout=15000){
  await page.waitForFunction(expected=>window.__GF_TEST__?.phase()===expected,state,{timeout});
}
async function clickChoice(page,id){
  const choices=await page.evaluate(()=>window.__GF_TEST__.choices());
  const selected=choices.find(x=>x.id===id);
  if(!selected)throw Error("Missing three-dimensional choice "+id+"; got "+JSON.stringify(choices));
  const bounds=page.viewportSize();
  if(selected.x<2||selected.x>bounds.width-2||selected.y<2||selected.y>bounds.height-2)
    throw Error("Physical prop is offscreen "+JSON.stringify(selected));
  await page.mouse.click(selected.x,selected.y);
}
async function main(){
  await mkdir("screenshots",{recursive:true});
  browser=await chromium.launch({
    channel:"chrome",
    headless:true,
    args:["--no-sandbox","--disable-dev-shm-usage","--enable-webgl","--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader","--autoplay-policy=no-user-gesture-required"]
  });
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  page.on("pageerror",err=>bugs.push(err.message));
  page.on("console",msg=>{if(msg.type()==="error")bugs.push("console: "+msg.text());});
  await page.goto(URL,{waitUntil:"domcontentloaded",timeout:30000});
  await waitState(page,"ready",70000);
  const actors=await page.evaluate(()=>window.__GF_TEST__.actors());
  assert.equal(actors.loaded,true);
  assert.equal(actors.skins.length,3);
  assert.ok(actors.skins.every(x=>x.skinned>0),"All original actresses must be truly rigged");
  assert.ok(actors.skins.every(x=>x.morphTargets>0),"Facial expression morph targets must be present");
  assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);
  await page.screenshot({path:"screenshots/3d-intro-mobile.png",animations:"disabled"});
  await page.click("#start");
  await waitState(page,"outfit",16000);
  await page.screenshot({path:"screenshots/3d-outfit-mobile.png",animations:"disabled"});
  await clickChoice(page,"star");
  await waitState(page,"room",15000);
  await page.screenshot({path:"screenshots/3d-room-mobile.png",animations:"disabled"});
  await clickChoice(page,"cosmic");
  await waitState(page,"feelings",15000);
  await page.waitForFunction(()=>window.__GF_TEST__.choices().length===3,undefined,{timeout:7000});
  await clickChoice(page,"listen");
  await waitState(page,"ending",15000);
  assert.equal(await page.evaluate(()=>window.__GF_TEST__.roomIsGalaxy()),true);
  await page.screenshot({path:"screenshots/3d-finale-mobile.png",animations:"disabled"});
  assert.deepEqual(bugs,[],"No WebGL, loader or runtime errors");
  console.log("PASS: "+JSON.stringify({actors,rooms:"physical meshes",choices:"3 raycast sequences",story:"complete",viewport:"390x844",screenshots:4}));
}
try{
  await main();
}catch(error){
  console.error("FAIL:",error.stack||error);
  process.exitCode=1;
}finally{
  if(browser)await browser.close();
  server.kill("SIGTERM");
}
