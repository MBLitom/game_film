import * as THREE from "../vendor/three.module.js";
import {GLTFLoader} from "../vendor/GLTFLoader.js";
import {BEATS, initialStoryState, evolveStory} from "../story-engine.mjs";

/**
 * GAME FILM — ORIGINAL THREE-DIMENSIONAL CINEMA PILOT.
 * The set, outfits, cameras and lighting are real WebGL objects. Only the
 * performers are prebuilt rigged GLBs from CC0 MakeHuman assets. No 2D actors,
 * no stock footage, no API calls from the browser or secret keys.
 *
 * This is a technical film prototype, not yet final photorealistic acting.
 */
const $ = id=>document.getElementById(id);
const canvas=$("world");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.3;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x161229);
scene.fog=new THREE.FogExp2(0x23192f,.016);
const camera=new THREE.PerspectiveCamera(37,1,.1,120);
camera.position.set(0,2.55,10.8);
const filmFocus=new THREE.Vector3(0,1.6,0);
const targetPos=new THREE.Vector3(0,2.55,10.8);
const targetFocus=new THREE.Vector3(0,1.6,0);
let elapsed=0;
let state="loading";  // loading, ready, intro, outfit, room, feelings, ending
let runId=0;
let choiceState=initialStoryState();
let voiceOn=true;
let sky=null,emma=null,starModel=null;
let stageOptions=[];
const pickable=[];
const showNote=(text)=>{
  const note=$("director-note");
  note.textContent=text||"";
  note.classList.toggle("visible",Boolean(text));
};
const chapter=(text)=>{$("chapter").textContent=text;};
const subtitle=(text)=>{$("subtitle").textContent=text||"";};

function narrate(text,actor="SKY"){
  subtitle(actor+": "+text);
  if(!voiceOn||!("speechSynthesis" in window))return;
  try {
    window.speechSynthesis.cancel();
    const line=new SpeechSynthesisUtterance(text);
    line.lang="en-US";line.rate=.92;line.pitch=actor==="EMMA"?1.22:1.08;line.volume=1;
    window.speechSynthesis.speak(line);
  }catch{/* English captions always remain available */}
}
function delay(ms,fn){
  const session=runId;
  setTimeout(()=>{if(session===runId&&document.visibilityState!=="hidden")fn();},ms);
}
const matte=(color,roughness=.72,metalness=.0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const white=matte(0xf3ecf3), gold=matte(0xe3bc6c,.35,.65), dark=matte(0x281b40), wallMaterial=matte(0x514b70,.89), floorMaterial=matte(0x6f4f65,.4);
const room=new THREE.Group();scene.add(room);
const setPieces=new THREE.Group();room.add(setPieces);
const partyDecor=new THREE.Group();partyDecor.visible=false;room.add(partyDecor);
const dressingDecor=new THREE.Group();room.add(dressingDecor);
const stageLights=[];

function mesh(geometry,material,parent,position=[0,0,0],name=""){
  const item=new THREE.Mesh(geometry,material);item.position.set(...position);
  item.castShadow=true;item.receiveShadow=true;item.name=name;parent.add(item);return item;
}
function box(w,h,d,mat,parent,pos,name=""){return mesh(new THREE.BoxGeometry(w,h,d),mat,parent,pos,name)}
function cyl(r1,r2,h,mat,parent,pos,segments=22){return mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat,parent,pos)}
function ball(r,mat,parent,pos){return mesh(new THREE.SphereGeometry(r,18,12),mat,parent,pos)}
function plane(w,h,mat,parent,pos){return mesh(new THREE.PlaneGeometry(w,h),mat,parent,pos)}

// A genuine spatial interior, with measurable walls, furniture, floor and
// reflective materials. All options alter these meshes rather than CSS.
const ground=box(14,.24,11,floorMaterial,room,[0,-.12,0],"solid wooden floor");
box(14,8,.24,wallMaterial,room,[0,4,-4.8],"back wall");
box(.24,8,11,wallMaterial,room,[-6.5,4,0],"left wall");
box(.24,8,11,wallMaterial,room,[6.5,4,0],"right wall");
for(let x=-6;x<=6;x+=1.25)box(.06,.015,10,matte(0xc3a28d,.49),room,[x,.02,0]);
for(let z=-4;z<=4;z+=1.25)box(12,.015,.03,matte(0xc3a28d,.49),room,[0,.025,z]);

const ceiling=box(13.2,.12,10.8,matte(0x252038,.83),room,[0,7.5,0],"ceiling");
for(let x of [-4.2,4.2]){
  box(.18,6.8,.3,gold,setPieces,[x,3.35,-4.58],"pillar trim");
  box(1.65,.11,.1,gold,setPieces,[x,3.9,-4.38],"wall trim");
}
const mirrorFrame=box(2.35,3.6,.14,gold,dressingDecor,[4.1,2.25,-4.45],"mirror frame");
const mirror=plane(2.05,3.33,new THREE.MeshPhysicalMaterial({color:0xbbd0dd,metalness:.55,roughness:.15,clearcoat:.9}),dressingDecor,[4.1,2.25,-4.35]);
for(const y of [1.95,2.5,3.05,3.6])for(const x of [2.85,5.35])ball(.075,matte(0xffecc5,.18),dressingDecor,[x,y,-4.26]);
const dressingTable=box(2.6,.18,.84,white,dressingDecor,[4.0,.85,-3.85],"dressing table");
for(let x of [3.0,5.0])box(.13,.8,.13,gold,dressingDecor,[x,.40,-3.78],"dressing-table leg");
for(let i=0;i<3;i++)cyl(.09,.10,.30,matte([0xffa5cd,0xaa9cef,0xdce7fa][i]),dressingDecor,[3.32+i*.35,1.04,-3.89]);
const rug=box(5,.015,3,new THREE.MeshStandardMaterial({color:0x8a5385,roughness:1}),room,[0,.055,-.25],"plush floor rug");
const couch=box(2.85,.6,.92,matte(0x6b3c6e,.95),setPieces,[-3.6,.56,-3.25],"couch");
box(2.8,.65,.3,matte(0x734a78,.95),setPieces,[-3.6,1,-3.62]);
for(let x of [-4.7,-2.6])box(.34,.56,1,matte(0x734a78,.95),setPieces,[x,.68,-3.2],"couch arm");
const trunk=cyl(.7,.73,.45,matte(0xd6b59f,.62),setPieces,[0,.33,-2.85]);
box(2.0,.06,.35,gold,dressingDecor,[0,2.7,-4.3],"wardrobe rail");
for(let x of [-.65,0,.65]){
  const hanger=new THREE.Group();hanger.position.set(x,2.49,-4.28);dressingDecor.add(hanger);
  const rod=box(.4,.025,.02,gold,hanger,[0,-.18,0]);rod.rotation.z=x*.06;
  const shirt=mesh(new THREE.ConeGeometry(.24,.55,8),matte(0xdfa7d7),hanger,[0,-.46,0]);shirt.rotation.x=Math.PI;
}
// Wall art uses 3D recesses and physically-lit outlines.
const frame=box(2.0,1.5,.10,gold,setPieces,[-3.75,3.9,-4.4]);
const art=box(1.7,1.2,.12,matte(0x2f275a,.5),setPieces,[-3.75,3.9,-4.32]);
for(let i=0;i<12;i++){
 const x=-4.4+Math.sin(i*2.4)*.72;
 const y=3.9+Math.cos(i*2.1)*.42;
 ball(.04,matte(0xfce89b,.2,.4),setPieces,[x,y,-4.20]);
}

const ambient=new THREE.HemisphereLight(0xe6efff,0x423048,2.1);scene.add(ambient);
const area=new THREE.DirectionalLight(0xffe3d4,3.6);area.position.set(-1.5,6,5);area.castShadow=true;area.shadow.mapSize.set(1024,1024);area.shadow.camera.left=-9;area.shadow.camera.right=9;area.shadow.camera.top=9;area.shadow.camera.bottom=-9;scene.add(area);
const stagePink=new THREE.SpotLight(0xffa6d1,120,15,Math.PI/5,.4,1.1);stagePink.position.set(-4,6.8,2.2);stagePink.target.position.set(-1,1,0);scene.add(stagePink,stagePink.target);
const stageBlue=new THREE.SpotLight(0x9aeaff,90,15,Math.PI/5,.4,1.1);stageBlue.position.set(4.1,6.8,1.2);stageBlue.target.position.set(1,1,0);scene.add(stageBlue,stageBlue.target);
for(const x of [-4.0,4.0]){
 const lamp=ball(.26,matte(0xfce6af,.24),setPieces,[x,6.0,-2.8]);
 lamp.material.emissive=new THREE.Color(0xffdca2);lamp.material.emissiveIntensity=.9;
}

for(let i=0;i<34;i++){
 const phi=i*2.399;
 const radius=1.6+Math.sqrt(i)*.59;
 const star=mesh(new THREE.IcosahedronGeometry(i%4===0?.13:.055,0),matte(i%3===0?0xffc9f4:0xf1e9ff,.2,.32),partyDecor,[Math.cos(phi)*radius,4.3+(i%5)*.34,-4.03-Math.sin(phi)*.03]);
 star.material.emissive=new THREE.Color(i%3===0?0xb343b6:0x7166c2);star.material.emissiveIntensity=.65;
}
const disco=ball(.49,new THREE.MeshPhysicalMaterial({color:0xbbc7ff,roughness:.1,metalness:1,clearcoat:1}),partyDecor,[0,5.6,-2.8]);
for(const x of [-5.5,5.5]){
 const p=cyl(.05,.05,3,matte(0x7adfff,.1,.45),partyDecor,[x,2.0,-4.1]);
 p.material.emissive=new THREE.Color(0x467eca);p.material.emissiveIntensity=1.5;
}
const danceFloor=box(4.6,.035,3,matte(0x3a2a6c,.22,.27),partyDecor,[0,.075,0],"physical glowing dance floor");
const danceTiles=[];
for(let x=-2;x<3;x++)for(let z=-1;z<2;z++){
 const mat=new THREE.MeshStandardMaterial({color:(x+z)%2===0?0x8b5ae2:0x48a5b7,roughness:.2,metalness:.35,emissive:(x+z)%2===0?0x5d367d:0x247da5,emissiveIntensity:.6});
 danceTiles.push(box(.75,.016,.78,mat,partyDecor,[x*.85,.098,z*.85]));
}
function setRoom(mode){
 const isGalaxy=mode==="cosmic";
 partyDecor.visible=isGalaxy;
 dressingDecor.visible=!isGalaxy;
 scene.background.setHex(isGalaxy?0x0d0b24:0x24182c);
 scene.fog.color.setHex(isGalaxy?0x17103b:0x30283a);
 wallMaterial.color.setHex(isGalaxy?0x201644:0x514b70);
 floorMaterial.color.setHex(isGalaxy?0x342b5b:0x6f4f65);
 rug.visible=!isGalaxy;
 stagePink.color.setHex(isGalaxy?0xe47aff:0xffa6d1);
 stageBlue.color.setHex(isGalaxy?0x55e8ff:0x9aeaff);
}

// In-scene interactive props. No clickable HTML overlays for story choices.
const interactive=new THREE.Group();scene.add(interactive);
function glyphTexture(text,base="#fff3ff"){
 const cvs=document.createElement("canvas");cvs.width=512;cvs.height=128;
 const ctx=cvs.getContext("2d");
 ctx.fillStyle="rgba(6,4,18,.67)";ctx.fillRect(0,0,512,128);
 ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=base;ctx.font="900 48px system-ui, sans-serif";ctx.fillText(text,256,68,490);
 const tex=new THREE.CanvasTexture(cvs);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function dressOption(parent,color,caption){
 const root=new THREE.Group();parent.add(root);
 const hanger=mesh(new THREE.TorusGeometry(.13,.024,8,15,Math.PI*1.8),gold,root,[0,1.23,0]);
 hanger.rotation.z=Math.PI*.5;
 const shoulders=cyl(.28,.18,.35,matte(color,.55),root,[0,.8,0]);
 const skirt=cyl(.23,.49,.76,matte(color,.58),root,[0,.25,0]);
 const hem=mesh(new THREE.TorusGeometry(.49,.025,5,21),gold,root,[0,-.11,0]);hem.rotation.x=Math.PI/2;
 for(let side of [-1,1])cyl(.1,.08,.42,matte(color,.55),root,[side*.27,.76,0]);
 const label=plane(1.30,.32,new THREE.MeshBasicMaterial({map:glyphTexture(caption),transparent:true,side:THREE.DoubleSide,depthWrite:false}),root,[0,-.53,.14]);label.name=caption;
 root.userData.interactive=true;return root;
}
function roomOption(parent,color,caption){
 const root=new THREE.Group();parent.add(root);
 box(1,.07,.8,matte(0xcbb9a0,.6),root,[0,.15,0]);
 const cube=box(.55,.53,.55,matte(color,.3,.18),root,[0,.52,0]);
 for(let i=0;i<5;i++){
 const r=ball(.085,matte(i%2===0?0xffe6b8:color,.2,.4),root,[(i-2)*.12,.86+(i%2)*.14,(i%2===0?.1:-.1)]);
 r.material.emissive=new THREE.Color(color);r.material.emissiveIntensity=.5;
 }
 const label=plane(1.45,.34,new THREE.MeshBasicMaterial({map:glyphTexture(caption),transparent:true,side:THREE.DoubleSide,depthWrite:false}),root,[0,-.43,.05]);
 root.userData.interactive=true;return root;
}
function clearChoices(){
 for(const entry of stageOptions){
  entry.root.traverse(o=>{if(o.isMesh){o.geometry?.dispose(); if(o.material?.map?.isTexture)o.material.map.dispose();}});
  interactive.remove(entry.root);
 }
 stageOptions=[];
 pickable.length=0;
}
function createChoices(beat){
 clearChoices();
 const optionData=BEATS[beat]?.choices||[];
 const spots=beat==="outfit"?[-2.40,0,2.40]:[-2.35,0,2.35];
 const atZ=beat==="outfit"?2.1:1.9;
 optionData.forEach((choice,i)=>{
  const root=beat==="outfit"
     ? dressOption(interactive,["#e78dc9","#8064dc","#e8b54c"][i],choice.label)
     : roomOption(interactive,["#ec9bbe","#6653d8","#e0b56b"][i],choice.label);
  root.position.set(spots[i],beat==="outfit"?.65:.63,atZ);
  root.scale.setScalar(beat==="outfit"?.85:1.05);
  root.userData={beat,choice:choice.id,baseY:root.position.y};
  root.traverse(obj=>{if(obj.isMesh){obj.userData.choiceRoot=root;pickable.push(obj);}});
  stageOptions.push({root,choice,beat});
 });
}

function cameraShot(name){
 const shots={
  intro:{eye:[0,2.4,9.8],target:[0,1.75,-.7]},
  outfit:{eye:[0,2.42,8.8],target:[0,1.7,.1]},
  room:{eye:[0,3.05,10.6],target:[0,2.2,-.5]},
  feelings:{eye:[0,2.3,7.8],target:[0,1.55,-.8]},
  finale:{eye:[-2.0,3.0,8.8],target:[0,1.5,-.8]}
 };
 const shot=shots[name]||shots.intro;
 targetPos.set(...shot.eye);
 targetFocus.set(...shot.target);
}
class Performer{
 constructor(glb,name){
  this.name=name;
  this.root=new THREE.Group();scene.add(this.root);
  this.model=glb.scene;
  this.model.traverse(obj=>{
   if(obj.isMesh){
    obj.castShadow=true;obj.receiveShadow=true;
    if(obj.material?.side!==undefined)obj.material.side=THREE.DoubleSide;
   }
  });
  this.root.add(this.model);
  this.mixer=glb.animations.length?new THREE.AnimationMixer(this.model):null;
  this.actions={};
  if(this.mixer){
   for(const clip of glb.animations)this.actions[clip.name.toLowerCase()]=this.mixer.clipAction(clip);
   const idle=Object.entries(this.actions).find(([n])=>/idle|stand|breath|relax/.test(n))?.[1] || Object.values(this.actions)[0];
   if(idle){idle.setLoop(THREE.LoopRepeat);idle.play();}
  }
  const bounds=new THREE.Box3().setFromObject(this.model),size=bounds.getSize(new THREE.Vector3());
  if(!Number.isFinite(size.y)||size.y<.01)throw new Error("Invalid actor geometry: "+name);
  const scale=2.42/size.y;
  this.model.scale.setScalar(scale);
  this.model.position.y=-bounds.min.y*scale;
  this.idleLook=0;
 }
 place(x,z,yaw=0){this.root.position.set(x,0,z);this.root.rotation.y=yaw;return this;}
 gesture(name){
  this.idleLook=performance.now()/1000+1.5;
  if(this.mixer){
   const action=Object.entries(this.actions).find(([n])=>/wave|talk|gesture|laugh|happy|react/.test(n))?.[1];
   if(action){action.reset().setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.fadeIn(.16).play();}
  }
 }
 update(dt,t){
  this.mixer?.update(dt);
  this.root.position.y=Math.sin(t*2.2+(this.name==="EMMA"?2:0))*.012;
  this.root.rotation.y=Math.sin(t*.46+(this.name==="EMMA"?1.2:0))*.044;
 }
 dispose(){
  this.mixer?.stopAllAction();
  this.root.removeFromParent();
 }
}
async function loadPerformer(name){
 const loader=new GLTFLoader();
 const url="../public/models/"+name+".glb";
 const glb=await loader.loadAsync(url);
 if(!glb.scene||!glb.scene.children.length)throw Error("GLB missing actual geometry "+name);
 return new Performer(glb,name);
}
async function prepareCast(){
 try{
  const [first,prepared,friend]=await Promise.all([
    loadPerformer("sky_preparation"),
    loadPerformer("sky_star"),
    loadPerformer("emma")
  ]);
  sky=first.place(-1.35,-.35);
  starModel=prepared;starModel.root.visible=false;starModel.place(-1.35,-.35);
  emma=friend.place(1.3,-.48);
  $("loading").hidden=true;
  $("start").disabled=false;
  state="ready";
 }catch(error){
  $("loading").hidden=true;
  $("fatal").hidden=false;
  $("fatal-detail").textContent="Original rigged GLB performers are not available yet. "+String(error.message).slice(0,120);
 }
}
function replaceSkyOutfit(){
 if(!starModel)return;
 sky.root.visible=false;
 starModel.root.visible=true;
 sky=starModel;
 sky.gesture("happy");
}
function react(beat,id){
 const outcome=evolveStory(choiceState,beat,id);
 choiceState=outcome.state;
 const voiceActor=beat==="feelings"?"EMMA":"SKY";
 narrate(outcome.outcome.feedback+(outcome.outcome.hint?" "+outcome.outcome.hint:""),voiceActor);
 (beat==="feelings"?emma:sky)?.gesture("react");
 if(outcome.outcome.accepted){
  clearChoices();
  showNote("");
  if(beat==="outfit"){
   replaceSkyOutfit();
   state="transition";
   delay(2200,()=>startRoomBeat());
  }else if(beat==="room"){
   setRoom("cosmic");
   state="transition";
   delay(2600,()=>startFeelingsBeat());
  }else{
   state="transition";
   delay(2600,()=>finale());
  }
 } else {
  const chosen=stageOptions.find(x=>x.choice.id===id);
  if(chosen){chosen.root.rotation.y+=.3;chosen.root.scale.multiplyScalar(.97);}
 }
}
function startStory(){
 runId++;choiceState=initialStoryState();
 $("end").hidden=true;$("opening").hidden=true;$("fatal").hidden=true;
 sky.root.visible=true;starModel.root.visible=false;sky=sky.name==="sky_star"?firstSky:sky;
 setRoom("default");clearChoices();
 voiceOn=$("sound").getAttribute("aria-pressed")!=="false";
 state="intro";chapter("EPISODE 01 · THE DRESSING ROOM");
 cameraShot("intro");
 narrate("Emma, the party starts soon. Will you help me get ready?","SKY");
 emma.gesture("wave");
 delay(3300,()=>{narrate("Yes! Let's find something that feels like YOU!","EMMA");emma.gesture("talk");});
 delay(6700,()=>startOutfitBeat());
}
let firstSky=null;
function startOutfitBeat(){
 if(state!=="intro"&&state!=="outfit")return;
 state="outfit";chapter("YOUR TURN · SKY'S OUTFIT");
 cameraShot("outfit");
 narrate("I love stars! Which outfit would you choose for me?","SKY");
 createChoices("outfit");
 showNote("Tap a real 3D outfit in the film");
}
function startRoomBeat(){
 state="room";chapter("PLOT TWIST · PARTY THEME");
 cameraShot("room");
 narrate("Oh no! The club changed its theme. We need a galaxy room!","SKY");
 createChoices("room");
 showNote("Tap the 3D decorations to change the room");
}
function startFeelingsBeat(){
 state="feelings";chapter("THE FRIENDS · LISTENING");
 cameraShot("feelings");
 narrate("I borrowed Emma's ribbon without asking... she looks upset.","SKY");
 delay(2600,()=>{
  if(state!=="feelings")return;
  narrate("I feel sad. I wanted someone to ask me first.","EMMA");
  createChoices("feelings");
  showNote("Touch a 3D idea to help the friends");
 });
}
function finale(){
 state="ending";chapter("FRIENDS FIRST · HAPPY ENDING");
 cameraShot("finale");
 narrate("I'm sorry, Emma. Next time I will ask first.","SKY");
 sky.gesture("happy");
 emma.gesture("happy");
 delay(3400,()=>{narrate("Thank you for listening. Now let's dance!","EMMA");});
 delay(7200,()=>{$("end").hidden=false;showNote("");});
}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function onTouch(event){
 if(!["outfit","room","feelings"].includes(state)||!stageOptions.length)return;
 const rect=canvas.getBoundingClientRect();
 pointer.x=(event.clientX-rect.left)/rect.width*2-1;
 pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
 raycaster.setFromCamera(pointer,camera);
 const matches=raycaster.intersectObjects(pickable,false);
 if(!matches.length)return;
 const root=matches[0].object.userData.choiceRoot;
 if(!root||root.userData.beat!==state)return;
 react(state,root.userData.choice);
}
canvas.addEventListener("pointerdown",onTouch,{passive:true});
$("start").addEventListener("click",()=>{
 if(!sky||!emma||!starModel)return;
 firstSky=sky;
 startStory();
});
$("again").addEventListener("click",()=>{
 if(!firstSky)return;
 sky=firstSky;
 startStory();
});
$("retry").addEventListener("click",()=>location.reload());
$("sound").addEventListener("click",event=>{
 voiceOn=!voiceOn;
 event.currentTarget.setAttribute("aria-pressed",String(voiceOn));
 event.currentTarget.textContent=voiceOn?"🔊":"🔇";
 if(!voiceOn&&"speechSynthesis" in window)window.speechSynthesis.cancel();
});
document.addEventListener("visibilitychange",()=>{
 if(document.hidden&&"speechSynthesis" in window)window.speechSynthesis.cancel();
});
function resize(){
 const w=innerWidth,h=innerHeight;
 renderer.setSize(w,h,false);
 camera.aspect=w/h;
 camera.fov=w/h<.7?48:37;camera.updateProjectionMatrix();
}
addEventListener("resize",resize,{passive:true});resize();

const clock=new THREE.Clock();
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(.05,clock.getDelta());elapsed+=dt;
 camera.position.lerp(targetPos,Math.min(1,dt*.8));
 filmFocus.lerp(targetFocus,Math.min(1,dt*.8));
 const sway=(state==="intro"||state==="ending")?Math.sin(elapsed*.32)*.07:0;
 camera.position.x+=sway*dt;
 camera.lookAt(filmFocus);
 sky?.update(dt,elapsed);
 if(emma&&emma!==sky)emma.update(dt,elapsed);
 if(starModel&&starModel!==sky&&starModel.root.visible===false)starModel.mixer?.update(dt);
 for(const entry of stageOptions){
  entry.root.position.y=entry.root.userData.baseY+Math.sin(elapsed*1.6+entry.root.position.x)*.04;
  entry.root.rotation.y+=dt*.12;
 }
 if(partyDecor.visible){
  disco.rotation.y+=dt*.44;
  for(let i=0;i<danceTiles.length;i++)danceTiles[i].material.emissiveIntensity=.32+Math.sin(elapsed*2+i)*.13;
 }
 renderer.render(scene,camera);
}
animate();
prepareCast();
