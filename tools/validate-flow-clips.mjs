/**
 * Validate original AI-cinema MP4 downloads (Kling, Flow or other permitted provider) before publishing.
 * No network requests and no automatic upload, billing or modifications.
 * The generated clips must be visually reviewed for character consistency.
 */
import {existsSync, statSync, openSync, readSync, closeSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {resolve, join} from "node:path";
import {REQUIRED_ASSETS} from "../cinema/story-playback.mjs";

const directory=resolve(process.argv[2]||"public/film/ep01");
let failed=false;
for(const name of REQUIRED_ASSETS){
 const file=join(directory,name);
 try{
  if(!existsSync(file))throw new Error("missing original licensed video file");
  const size=statSync(file).size;
  if(size<100_000||size>150_000_000)throw new Error("unusual MP4 file size");
  const head=Buffer.alloc(12);
  const fd=openSync(file,"r");
  try{readSync(fd,head,0,12,0);}
  finally{closeSync(fd);}
  if(head.toString("ascii",4,8)!=="ftyp")throw new Error("not an MP4 container");
  const check=spawnSync("ffprobe",["-v","error","-select_streams","v:0","-show_entries","stream=codec_name,width,height,duration","-of","json",file],{encoding:"utf8",timeout:15000});
  if(check.status!==0)throw new Error("ffprobe video inspection failed");
  const stream=JSON.parse(check.stdout).streams?.[0];
  if(!stream || !["h264","hevc","av1","vp9"].includes(stream.codec_name))throw new Error("unsupported video codec");
  if(stream.width<256||stream.height<256)throw new Error("video too small");
  if(Number(stream.duration)<2||Number(stream.duration)>30)throw new Error("clip duration outside expected range");
  console.log(JSON.stringify({clip:name,size_mb:+(size/1048576).toFixed(1),codec:stream.codec_name,resolution:stream.width+"x"+stream.height,duration_s:+Number(stream.duration).toFixed(2)}));
 }catch(error){
  failed=true;
  console.error("INVALID",name,error.message);
 }
}
if(failed)process.exitCode=1;
else console.log("PASS: all four real movie files structurally valid. Human review of actors, rights and continuity is STILL REQUIRED.");
