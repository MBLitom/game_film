import * as THREE from "../vendor/three.module.js";
import {BEATS} from "../story-engine.mjs";
import {beginEpisode,afterVideo,chooseStory,currentClip,REQUIRED_ASSETS,validateContinuity} from "./story-playback.mjs";

// Cinematic source material is GENERATED OFFLINE in a licensed video tool (Flow, Kling, etc.).
// A single actor identity and costume are enforced by the approved clip filenames.
// Here Three.js is used ONLY for temporary in-frame child interaction.
const $=id=>document.getElementById(id);
const theater=$("theater"),video=$("film"),canvas=$("director");
const subtitles=$("subtitles"),hint=$("hint"),sceneLabel=$("scene");
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.3));
renderer.setClearColor(0x000000,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.1,100);
camera.position.set(0,0,10);
const light=new THREE.HemisphereLight(0xffe2f6,0x7652c2,2.5);
scene.add(light);
const point=new THREE.PointLight(0xffc477,55,17);
point.position.set(3,5,8);
scene.add(point);
const propLayer=new THREE.Group();scene.add(propLayer);
let entries=[],clickables=[],activeDrag=null,phaseState=beginEpisode(),allowVoice=true;
const availableClips=new Set();
let narrationTimer=null,editTime=0,renderingActive=true;
const clock=new THREE.Clock();
const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.46,metalness:.22,side:THREE.DoubleSide});
function add(parent,geometry,material,pos=[0,0,0],name=""){
 const m=new THREE.Mesh(geometry,material);m.position.set(...pos);m.name=name;parent.add(m);return m;
}
function wordCard(label){
 const cvs=document.createElement("canvas");cvs.width=512;cvs.height=128;
 const g=cvs.getContext("2d");
 g.fillStyle="rgba(8,6,24,0.72)";g.fillRect(0,0,512,128);
 g.textAlign="center";g.textBaseline="middle";g.fillStyle="#fff";
 g.font="900 44px system-ui";g.fillText(label,256,64,492);
 const tex=new THREE.CanvasTexture(cvs);tex.colorSpace=THREE.SRGBColorSpace;
 return new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide});
}
function createDress(parent,color){
 const material=mat(color);
 add(parent,new THREE.CylinderGeometry(.21,.28,.36,12),material,[0,.47,0]);
 add(parent,new THREE.CylinderGeometry(.25,.54,.85,18),material,[0,-.12,0]);
 for(const x of [-.31,.31]){
  const sleeve=add(parent,new THREE.CylinderGeometry(.13,.10,.37,10),material,[x,.42,0]);
  sleeve.rotation.z=x<0?-.38:.38;
 }
 const hem=add(parent,new THREE.TorusGeometry(.54,.028,7,28),mat(0xffe9b7),[0,-.54,0]);
 hem.rotation.x=Math.PI/2;
}
function createRoomProp(parent,color){
 const m=mat(color);
 add(parent,new THREE.BoxGeometry(.92,.07,.7),mat(0x6c4f80),[0,-.38,0]);
 const deco=add(parent,new THREE.IcosahedronGeometry(.36,1),m,[0,.12,0]);
 deco.material.emissive=new THREE.Color(color);deco.material.emissiveIntensity=.23;
 for(const s of [-1,1]){
  add(parent,new THREE.SphereGeometry(.09,9,9),mat(0xffeec2),[s*.46,.50,.05]);
 }
}
function createFeelingProp(parent,key){
 if(key==="listen"){
  const ear=add(parent,new THREE.TorusGeometry(.40,.11,9,24,Math.PI*1.5),mat(0x9addfc),[0,.1,0]);
  ear.rotation.z=-.3;
  add(parent,new THREE.SphereGeometry(.12),mat(0xfbe8b8),[.11,-.21,0]);
 }else if(key==="ignore"){
  add(parent,new THREE.SphereGeometry(.39,18,14),mat(0x8c9da7),[0,0,0]);
  const bar=add(parent,new THREE.BoxGeometry(.78,.12,.17),mat(0xe8d4eb),[0,0,.1]);bar.rotation.z=.4;
 }else{
  const smile=add(parent,new THREE.TorusGeometry(.42,.1,10,24,Math.PI),mat(0xf0a0cc),[0,0,0]);
  smile.rotation.z=Math.PI;
  for(const x of [-.20,.20]) add(parent,new THREE.SphereGeometry(.07,8,8),mat(0x31234a),[x,.08,0]);
 }
}
function clearProps(){
 for(const entry of entries){
  entry.root.traverse(obj=>{
   if(!obj.isMesh) return;
   obj.geometry?.dispose();
   const m=obj.material;
   if(m?.map?.isTexture)m.map.dispose();
   if(m?.dispose&&m!==sharedMetal)m.dispose();
  });
  propLayer.remove(entry.root);
 }
 entries=[];clickables=[];activeDrag=null;
 canvas.classList.remove("editing");
 subtitles.textContent="";
 hint.textContent="";
}
const sharedMetal=mat(0xffc57c);
function setupEditor(beat){
 clearProps();
 video.pause();
 canvas.classList.add("editing");
 const options=BEATS[beat].choices;
 const narrow=innerWidth/innerHeight<.8;
 const xs=narrow?[-1.16,0,1.16]:[-2.30,0,2.30];
 for(let i=0;i<3;i++){
  const choice=options[i];
  const group=new THREE.Group();
  group.position.set(xs[i],narrow?-1.25:-1.55,2);
  const scale=narrow?.74:1.06;
  group.scale.setScalar(scale);
  if(beat==="outfit")createDress(group,[0xeaa5cb,0x6063c7,0xe3b67d][i]);
  else if(beat==="room")createRoomProp(group,[0xeeb7d4,0x7872ff,0xc6bd91][i]);
  else createFeelingProp(group,choice.id);
  const label=add(group,new THREE.PlaneGeometry(1.75,.36),wordCard(choice.label),[0,-.90,.3]);
  const hit=add(group,new THREE.BoxGeometry(1.55,2.10,.55),
    new THREE.MeshBasicMaterial({visible:false}),[0,-.06,.0]);
  hit.userData.id=choice.id;
  clickables.push(hit);
  propLayer.add(group);
  entries.push({choice,root:group,startX:xs[i],startY:group.position.y});
 }
 sceneLabel.textContent="YOUR SCENE · "+beat.toUpperCase();
 const lines={
  outfit:"Sky loves stars. Drag a dress into the film, or tap one.",
  room:"The party needs a new theme! Choose 3D decorations for the scene.",
  feelings:"Emma feels sad. How can we help her feel heard?"
 };
 hint.textContent=lines[beat];
 editTime=performance.now();
}
function speak(text){
 subtitles.textContent=text;
 if(!allowVoice||!("speechSynthesis" in window))return;
 try{
   window.speechSynthesis.cancel();
   const utterance=new SpeechSynthesisUtterance(text);
   utterance.lang="en-US";
   utterance.rate=.94;utterance.pitch=1.10;
   window.speechSynthesis.speak(utterance);
 }catch{/* screen captions remain */}
}
function acceptChoice(id){
 const before=phaseState.phase;
 if(!BEATS[before])return;
 const {state,response}=chooseStory(phaseState,id);
 phaseState=state;
 speak(response.feedback+(response.hint?" "+response.hint:""));
 const entry=entries.find(x=>x.choice.id===id);
 if(entry){
  entry.root.scale.multiplyScalar(response.accepted?1.15:.96);
  entry.root.rotation.z=response.accepted?0:.16;
 }
 if(response.accepted){
  hint.textContent="Great! You changed the story. Back to the movie…";
  setTimeout(()=>{
   clearProps();
   playCurrent();
  },1300);
 }else{
  hint.textContent=response.hint||"Try another look. Your friend has her own preferences.";
 }
}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function mouseToRay(e){
 const r=canvas.getBoundingClientRect();
 pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
 raycaster.setFromCamera(pointer,camera);
 return raycaster.intersectObjects(clickables,false)[0]||null;
}
canvas.addEventListener("pointerdown",e=>{
 if(!BEATS[phaseState.phase])return;
 const hit=mouseToRay(e);
 if(!hit)return;
 const root=entries.find(x=>x.choice.id===hit.object.userData.id);
 if(!root)return;
 activeDrag={id:root.choice.id,entry:root,initialX:e.clientX,initialY:e.clientY,dragged:false};
 canvas.setPointerCapture(e.pointerId);
},{passive:true});
canvas.addEventListener("pointermove",e=>{
 if(!activeDrag)return;
 const d=Math.hypot(e.clientX-activeDrag.initialX,e.clientY-activeDrag.initialY);
 if(d>9)activeDrag.dragged=true;
 if(activeDrag.dragged){
  const width=Math.max(1,innerWidth),height=Math.max(1,innerHeight);
  activeDrag.entry.root.position.x=THREE.MathUtils.clamp((e.clientX/width-.5)*5,-2.7,2.7);
  activeDrag.entry.root.position.y=THREE.MathUtils.clamp((.5-e.clientY/height)*7,-2.8,2.2);
 }
},{passive:true});
canvas.addEventListener("pointerup",e=>{
 if(!activeDrag)return;
 const {id,entry,dragged}=activeDrag;
 activeDrag=null;
 entry.root.position.set(entry.startX,entry.startY,2);
 if(!dragged || (e.clientY<innerHeight*.78 && e.clientY>innerHeight*.15)) acceptChoice(id);
},{passive:true});
canvas.addEventListener("pointercancel",()=>{if(activeDrag){activeDrag.entry.root.position.set(activeDrag.entry.startX,activeDrag.entry.startY,2);}activeDrag=null;},{passive:true});

function playCurrent(){
 const clip=currentClip(phaseState);
 if(!clip){
  if(phaseState.phase==="end"){$("end").hidden=false;sceneLabel.textContent="THE END";return;}
  setupEditor(phaseState.phase);return;
 }
 validateContinuity(phaseState);
 if(!availableClips.has(clip)){
   showError("The next original movie shot ("+clip+") is not available yet. This is a preview, not a complete episode.");
   return;
 }
 sceneLabel.textContent="EPISODE 01 · "+phaseState.phase.replaceAll("_"," ").toUpperCase();
 subtitles.textContent="";
 hint.textContent="";
 const url="../public/film/ep01/"+clip;
 if(!video.src.endsWith("/"+clip))video.src=url;
 video.currentTime=0;
 const p=video.play();
 if(p?.catch)p.catch(err=>{if(err.name!=="AbortError")showError("The video could not start ("+err.name+").");});
}
video.addEventListener("ended",()=>{
 try{
  phaseState=afterVideo(phaseState);
  if(phaseState.phase==="end"){
   $("end").hidden=false;return;
  }
  setupEditor(phaseState.phase);
 }catch(err){showError(err.message);}
});
function showError(message){
 clearProps();
 $("error-text").textContent=message;
 $("error").hidden=false;
}
video.addEventListener("error",()=>showError("Missing, corrupt or unsupported MP4 format."));
function reset(){
 clearProps();
 phaseState=beginEpisode();
 $("end").hidden=true;
 $("error").hidden=true;
 $("opening").hidden=true;
 playCurrent();
}
$("start").addEventListener("click",reset);
$("again").addEventListener("click",reset);
$("reload").addEventListener("click",()=>location.reload());
$("voice").addEventListener("click",()=>{
 allowVoice=!allowVoice;
 video.muted=!allowVoice;
 $("voice").textContent=allowVoice?"🔊":"🔇";
 if(!allowVoice && "speechSynthesis" in window)window.speechSynthesis.cancel();
});
document.addEventListener("visibilitychange",()=>{
 if(document.hidden){ video.pause();if("speechSynthesis" in window)window.speechSynthesis.cancel();}
});
function resize(){
 const w=innerWidth,h=innerHeight;
 renderer.setSize(w,h,false);
 camera.aspect=w/h;
 camera.updateProjectionMatrix();
}
window.addEventListener("resize",resize,{passive:true});resize();
function draw(){
 if(!renderingActive)return;
 requestAnimationFrame(draw);
 const d=clock.getDelta();
 for(const entry of entries){
  if(activeDrag?.id===entry.choice.id)continue;
  entry.root.rotation.y+=d*.3;
  entry.root.position.y=entry.startY+Math.sin(performance.now()*.0018+entry.startX)*.05;
 }
 renderer.render(scene,camera);
}
draw();
// The public page never claims completion without the real generated film files.
async function checkClips(){
 const clips=await Promise.all(REQUIRED_ASSETS.map(async filename=>{
  try{
   const res=await fetch("../public/film/ep01/"+filename,{method:"HEAD",cache:"no-cache"});
   const type=res.headers.get("content-type")||"";
   return res.ok && !type.includes("text/html");
  }catch{return false;}
 }));
 REQUIRED_ASSETS.forEach((filename,i)=>{if(clips[i])availableClips.add(filename);});
 if(availableClips.has("intro.mp4")){
  $("start").disabled=false;
  const footnote=document.querySelector(".footnote");
  if(footnote && !clips.every(Boolean))footnote.textContent="Preview only: "+availableClips.size+"/4 original shots available. The story is still in production.";
 }else{
  $("opening").hidden=true;
  $("missing").hidden=false;
 }
}
if(new URLSearchParams(location.search).has("smoke")){
 window.__GF_CINEMA_TEST__=Object.freeze({
  phase:()=>phaseState.phase,
  choices:()=>entries.map(({choice,root})=>{
   const world=root.getWorldPosition(new THREE.Vector3());
   world.y+=.10;
   world.project(camera);
   return {id:choice.id,x:Math.round((world.x+1)/2*innerWidth),y:Math.round((1-world.y)/2*innerHeight)};
  }),
  currentClip:()=>currentClip(phaseState),
  story:()=>JSON.parse(JSON.stringify(phaseState.story))
 });
}
checkClips();
