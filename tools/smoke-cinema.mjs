import {chromium} from "playwright-core";
import {spawn,spawnSync} from "node:child_process";
import {mkdir} from "node:fs/promises";
import assert from "node:assert/strict";

const port=8179,base="http://127.0.0.1:"+port;
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{stdio:"ignore"});
let browser;
async function main(){
 await mkdir("screenshots",{recursive:true});
 browser=await chromium.launch({channel:"chrome",headless:true,args:["--no-sandbox","--disable-dev-shm-usage","--enable-webgl","--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader"]});
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const page=await context.newPage();
 const errors=[];
 page.on("pageerror",err=>errors.push(err.message));
 // Test no fabricated movie: no original Flow outputs means a visible explanatory screen.
 await page.goto(base+"/cinema/?smoke=1",{waitUntil:"networkidle",timeout:30000});
 await page.locator("#missing").waitFor({state:"visible",timeout:15000});
 assert.equal(await page.locator("#start").isDisabled(),true);
 console.log("PASS: cinema refuses to claim Google Flow clips exist before import");

 const folder="public/flow/ep01";
 await mkdir(folder,{recursive:true});
 const clips=["intro","outfit_ok","room_ok","empathy_ok"];
 const ffmpeg=spawnSync("ffmpeg",["-hide_banner","-loglevel","error","-y","-f","lavfi","-i","color=c=#402b5b:s=384x640:r=2","-t","20","-c:v","libx264","-preset","ultrafast","-pix_fmt","yuv420p","-movflags","+faststart","/tmp/game-film-test-pattern.mp4"],{stdio:"pipe",timeout:30000});
 if(ffmpeg.status!==0)throw Error("ffmpeg test pattern failed: "+String(ffmpeg.stderr).slice(0,300));
 const {copyFile}=await import("node:fs/promises");
 for(const name of clips)await copyFile("/tmp/game-film-test-pattern.mp4",folder+"/"+name+".mp4");

 await page.reload({waitUntil:"domcontentloaded"});
 await page.locator("#start").waitFor({state:"visible",timeout:12000});
 await page.waitForFunction(()=>!document.querySelector("#start").disabled,undefined,{timeout:15000});
 await page.locator("#start").click();
 await page.waitForFunction(()=>window.__GF_CINEMA_TEST__?.phase()==="intro",undefined,{timeout:6000});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);

 async function nextVideo(phase){
  await page.evaluate(()=>document.querySelector("#film").dispatchEvent(new Event("ended")));
  await page.waitForFunction(expected=>window.__GF_CINEMA_TEST__?.phase()===expected,phase,{timeout:7000});
 }
 async function choose(id,acceptedPhase){
  const all=await page.evaluate(()=>window.__GF_CINEMA_TEST__?.choices());
  if(!all.length){console.error("BROWSER PAGE ERRORS",JSON.stringify(errors));console.error("PHASE",await page.evaluate(()=>window.__GF_CINEMA_TEST__?.phase()));}
  const selected=all.find(item=>item.id===id);
  assert.ok(selected,"3D choice "+id+" not present: "+JSON.stringify(all));
  assert.ok(selected.x>=0&&selected.x<390&&selected.y>=0&&selected.y<844,"Touch target inside phone viewport: "+JSON.stringify(selected));
  await page.touchscreen.tap(selected.x,selected.y);
  if(acceptedPhase) await page.waitForFunction(expected=>window.__GF_CINEMA_TEST__?.phase()===expected,acceptedPhase,{timeout:7000});
 }
 await nextVideo("outfit");
 await page.screenshot({path:"screenshots/cinema-outfit-interaction.png"});
 await choose("rose");
 assert.equal(await page.evaluate(()=>window.__GF_CINEMA_TEST__.phase()),"outfit");
 await choose("star","outfit_ok");
 await nextVideo("room");
 await page.screenshot({path:"screenshots/cinema-room-interaction.png"});
 await choose("garden");
 assert.equal(await page.evaluate(()=>window.__GF_CINEMA_TEST__.phase()),"room");
 await choose("cosmic","room_ok");
 await nextVideo("feelings");
 await choose("laugh");
 assert.equal(await page.evaluate(()=>window.__GF_CINEMA_TEST__.phase()),"feelings");
 await choose("listen","empathy_ok");
 await nextVideo("end");
 assert.equal(await page.locator("#end").isVisible(),true);
 assert.equal(await page.evaluate(()=>window.__GF_CINEMA_TEST__.story().outfit),"star");
 assert.equal(await page.evaluate(()=>window.__GF_CINEMA_TEST__.story().room),"cosmic");
 assert.equal(await page.evaluate(()=>window.__GF_CINEMA_TEST__.story().feelings),"listen");
 assert.deepEqual(errors,[]);
 console.log("PASS: 4 synthetic-film slots, 3 real raycast editing moments, stable authored continuity, 390x844 touch viewport");
}
try{await main()}catch(e){console.error("FAIL",e.stack||e);process.exitCode=1}
finally{if(browser)await browser.close();server.kill("SIGTERM")}
