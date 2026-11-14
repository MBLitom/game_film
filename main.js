import * as THREE from "./vendor/three.module.js";
import {EPISODE, BEATS, initialStoryState, evolveStory} from "./story-engine.mjs";

const $ = (id) => document.getElementById(id);
const app=$("film-app"),video=$("film"),opening=$("opening"),ending=$("ending");
const choiceOverlay=$("choice-overlay"), subtitle=$("subtitles");
const choiceTitle=$("choice-title"),choiceDesc=$("choice-description");
const choiceResponse=$("choice-response"),choiceOptions=$("choice-options");
const continueBtn=$("continue"),soundBtn=$("sound-btn"),sceneLabel=$("scene-indicator");
const videoFormat=video.canPlayType('video/mp4; codecs="avc1.42E01E"')?"mp4":"webm";
const clips={dressing:"./media/hair."+videoFormat,party:"./media/party."+videoFormat};
let phase="title", activeBeat=null, activeOutcome=null, story=initialStoryState();
let narrationEnabled=false,currentSubtitle="",errorShown=false,reactionLock=false;
let speechTimer=null;

function setSubtitle(text) {
  if(text===currentSubtitle)return;
  currentSubtitle=text;
  subtitle.textContent=text||"";
}
function speak(text) {
  if(!narrationEnabled||!("speechSynthesis" in window))return;
  try{
    window.speechSynthesis.cancel();
    const saying=new SpeechSynthesisUtterance(text);
    saying.lang="en-US";saying.rate=.9;saying.pitch=1.07;
    window.speechSynthesis.speak(saying);
  }catch{ /* captions remain available */ }
}
function line(text,voice=false){
  setSubtitle(text);
  if(voice)speak(text);
}
function setPhase(next){
  phase=next;
  document.body.classList.toggle("is-choice",next.startsWith("choice:"));
}
function failMedia(){
  if(errorShown)return;
  errorShown=true;
  const box=$("error");
  box.hidden=false;
  box.textContent="The film preview couldn't load. Tap here to reload.";
  box.onclick=()=>location.reload();
}
function loadClip(name){
  video.pause();
  video.src=clips[name];
  video.load();
}
function playClip(){
  video.muted=true; // only voiced authored fiction, not sounds from stock samples
  const result=video.play();
  if(result?.catch) result.catch(failMedia);
}
function resetChoices(){
  activeOutcome=null;
  choiceOptions.replaceChildren();
  choiceResponse.textContent="";
  continueBtn.disabled=true;
  accessory.visible=false;
}
function openBeat(beatId){
  const beat=BEATS[beatId];
  if(!beat)throw new Error("Missing authored beat "+beatId);
  video.pause();
  activeBeat=beatId;
  setPhase("choice:"+beatId);
  choiceOverlay.hidden=false;
  resetChoices();
  $("choice-badge").textContent=beat.badge;
  choiceTitle.textContent=beat.prompt;
  choiceDesc.textContent=beat.instruction;
  continueBtn.textContent=beat.continueText;
  sceneLabel.textContent=beatId==="outfit"?"SCENE 01 · THE STYLIST":beatId==="room"?"SCENE 02 · THE SET DESIGNER":"SCENE 03 · FRIENDS FIRST";
  $("touch-hint").textContent=beatId==="outfit"?"Sky has her own style. Listen to her suggestions.":beatId==="room"?"Watch the colors and decorations change in the film frame.":"It's okay to feel upset. We can choose how to respond.";
  if(beatId==="room")app.dataset.previewRoom="neutral";
  for(const option of beat.choices){
    const b=document.createElement("button");
    b.type="button";b.className="look";
    b.dataset.choice=option.id;
    b.setAttribute("aria-pressed","false");
    const emoji=document.createElement("span");emoji.className="look-symbol";emoji.textContent=option.emoji;
    const label=document.createElement("span");label.textContent=option.label;
    b.append(emoji,label);
    b.addEventListener("click",()=>choose(beatId,option.id));
    choiceOptions.append(b);
  }
  const intros={
    outfit:"I love stars! Help me choose something that feels like me!",
    room:"Oh no, the party theme changed! Can you turn this place into a galaxy?",
    feelings:"Emma looks sad. I used her ribbon without asking. What should I do?"
  };
  line(intros[beatId],true);
}
function choose(beatId,key){
  if(phase!=="choice:"+beatId)return;
  const value=evolveStory(story,beatId,key);
  story=value.state;activeOutcome=value.outcome;
  for(const b of choiceOptions.querySelectorAll("button")){
    const selected=b.dataset.choice===key;
    b.classList.toggle("selected",selected);
    b.setAttribute("aria-pressed",String(selected));
  }
  const hint=value.outcome.hint;
  choiceResponse.textContent=value.outcome.feedback+(hint?" "+hint:"");
  continueBtn.disabled=!value.outcome.accepted;
  continueBtn.classList.toggle("accepted",value.outcome.accepted);
  if(beatId==="outfit"){
    setAccessory(key);
    accessory.visible=true;
    app.dataset.previewOutfit=key;
  }
  if(beatId==="room") applyRoomPreview(key);
  if(beatId==="feelings"){
    accessory.visible=false;
    if(value.outcome.accepted) app.dataset.friendship="resolved";
  }
  line(value.outcome.feedback+(hint?" "+hint:""),true);
}
function applyRoomPreview(key){
  app.dataset.previewRoom=key;
  if(key==="cosmic"){
    glow.color.setHex(0xab79ff); cool.color.setHex(0x5febff);
  }else if(key==="garden"){
    glow.color.setHex(0xff9ed7); cool.color.setHex(0x8aff99);
  }else if(key==="beach"){
    glow.color.setHex(0xffdd8d); cool.color.setHex(0x69eaff);
  }
}
function continueStory(){
  if(!activeOutcome?.accepted||!activeBeat)return;
  const beatId=activeBeat;
  choiceOverlay.hidden=true;
  accessory.visible=false;
  activeBeat=null;
  app.dataset.previewOutfit="";
  if(beatId==="outfit"){
    setPhase("dressing-resume");
    sceneLabel.textContent="SCENE 01 · GETTING READY";
    line("That feels just right. Thank you for listening to what I like!",true);
    playClip();
  }else if(beatId==="room"){
    app.dataset.room=story.room;
    app.dataset.previewRoom=story.room;
    setPhase("party");
    sceneLabel.textContent="SCENE 02 · THE NEW GALAXY ROOM";
    $("episode-label").textContent="EPISODE 01 · THE PARTY";
    line("Now the room is ready! Let's join the party!",true);
    loadClip("party");
    playClip();
  }else if(beatId==="feelings"){
    setPhase("party-resume");
    sceneLabel.textContent="SCENE 03 · WE LISTENED";
    line("I'm sorry I borrowed your ribbon without asking. Can we choose together next time?",true);
    playClip();
  }
}
continueBtn.addEventListener("click",continueStory);
function startStory(){
  story=initialStoryState();
  activeBeat=null;activeOutcome=null;
  errorShown=false;$("error").hidden=true;
  opening.hidden=true;ending.hidden=true;choiceOverlay.hidden=true;
  app.dataset.room="neutral";app.dataset.previewRoom="neutral";app.dataset.previewOutfit="";
  app.dataset.friendship="unresolved";
  $("episode-label").textContent="EPISODE 01";
  setPhase("dressing");
  resetChoices();
  sceneLabel.textContent="SCENE 01 · BEFORE THE PARTY";
  narrationEnabled=true;
  soundBtn.textContent="🔊";
  soundBtn.setAttribute("aria-pressed","true");
  loadClip("dressing");
  line("Let's get ready for the party. Sky needs a little help!",true);
  playClip();
}
$("start").addEventListener("click",startStory);
$("again").addEventListener("click",startStory);
function finish(){
  if(phase==="end")return;
  video.pause();
  accessory.visible=false;
  setPhase("end");
  ending.hidden=false;
  sceneLabel.textContent="THE END · FRIENDS FIRST";
  line("",false);
  speak("Great job helping the friends listen to each other. To be continued!");
}
video.addEventListener("timeupdate",()=>{
  if(phase==="dressing"&&video.currentTime>=4.2){
    openBeat("outfit");
  }else if(phase==="dressing-resume"&&video.currentTime>=6.3){
    setSubtitle("Everyone's ready... but the club has a surprise!");
  }else if(phase==="party"&&video.currentTime>=3.4){
    openBeat("feelings");
  }else if(phase==="party-resume"&&video.currentTime>=8.7){
    finish();
  }
});
video.addEventListener("ended",()=>{
  if(phase==="dressing"||phase==="dressing-resume"){
    openBeat("room");
  } else if(phase==="party"||phase==="party-resume"){
    finish();
  }
});
video.addEventListener("error",failMedia);
// Sample footage is not actor-tracked; screen touches offer a narrative response,
// never a claim that a filmed person actually felt a touch.
video.addEventListener("pointerdown",event=>{
  if(phase!=="choice:outfit"||reactionLock)return;
  if(event.clientY/window.innerHeight>.68)return;
  reactionLock=true;
  line("Hey, gentle hands, please. Let's pick the outfit together!",true);
  jiggleAccessory();
  setTimeout(()=>{reactionLock=false;},650);
});
soundBtn.addEventListener("click",()=>{
  narrationEnabled=!narrationEnabled;
  soundBtn.textContent=narrationEnabled?"🔊":"🔇";
  soundBtn.setAttribute("aria-pressed",String(narrationEnabled));
  if(narrationEnabled)speak(currentSubtitle||"Let's help the friends!");
  else if("speechSynthesis" in window)window.speechSynthesis.cancel();
});
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){
    video.pause();
    if("speechSynthesis" in window)window.speechSynthesis.cancel();
  }
});
$("credits-btn").addEventListener("click",()=> $("credits").showModal());
$("credits-close").addEventListener("click",()=> $("credits").close());

/* A lightweight real Three.js depth layer, based on the separate full-screen
   rendering architecture used in the Litom Golf and Lumina games.
   This is a 3D foreground effect, not a photoreal actor or video depth map. */
const canvas = $("depth-canvas");
const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
renderer.setClearColor(0x000000,0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45,1,.1,100);
camera.position.set(0,0,10);
scene.add(new THREE.AmbientLight(0xffffff,1.5));
const glow = new THREE.PointLight(0xff95d6,18,12);glow.position.set(-2,3,5);scene.add(glow);
const cool = new THREE.PointLight(0x9fe5ff,13,12);cool.position.set(2,-2,5);scene.add(cool);
const accessory = new THREE.Group(); accessory.visible = false; accessory.position.set(0,1.35,3);scene.add(accessory);
let accessoryJiggleUntil = 0;
const floating = [];
const geometries = [new THREE.SphereGeometry(.055,6,5),new THREE.IcosahedronGeometry(.09,0)];
const materials = [new THREE.MeshBasicMaterial({color:0xffc7df,transparent:true,opacity:.4,depthWrite:false}),new THREE.MeshBasicMaterial({color:0x94e9ff,transparent:true,opacity:.3,depthWrite:false}),new THREE.MeshBasicMaterial({color:0xffe1a8,transparent:true,opacity:.25,depthWrite:false})];
for(let i=0;i<38;i++){
  const dot=new THREE.Mesh(geometries[i%2],materials[i%3]);
  dot.position.set((Math.random()-.5)*9,(Math.random()-.5)*14,2+Math.random()*1.7);
  dot.userData.speed=.12+Math.random()*.3;dot.userData.base=dot.position.x;
  floating.push(dot);scene.add(dot);
}
function clearAccessory() {
  while(accessory.children.length) {
    const child=accessory.children[0]; if(!child) break;
    accessory.remove(child);
    if(child.geometry) child.geometry.dispose();
    if(child.material) child.material.dispose();
  }
}
function setAccessory(key) {
  clearAccessory();
  const pink = new THREE.MeshStandardMaterial({color:0xff7abd,roughness:.24,metalness:.13});
  const gold = new THREE.MeshStandardMaterial({color:0xffc750,metalness:.7,roughness:.2});
  if (key === "rose"){
    for(const side of [-1,1]) {
      const wing=new THREE.Mesh(new THREE.SphereGeometry(.48,14,9),pink);
      wing.scale.set(1.14,.65,.3);wing.position.set(side*.42,0,0);wing.rotation.z=-side*.25;accessory.add(wing);
    }
    const center=new THREE.Mesh(new THREE.SphereGeometry(.22,12,8),gold);accessory.add(center);
  }else if (key === "star"){
    const shape=new THREE.Shape(),n=10;for(let i=0;i<n;i++){const a=i*Math.PI/5-Math.PI/2,r=(i%2===0?.61:.27),x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y)}shape.closePath();
    const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.07,bevelThickness:.05}),gold);
    mesh.position.z=-.08;accessory.add(mesh);
  }else{
    const shape=new THREE.Shape();
    [[-.72,-.3],[-.72,.35],[-.35,.1],[0,.75],[.35,.1],[.72,.35],[.72,-.3]].forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
    const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.05,bevelThickness:.05}),gold);accessory.add(mesh);
  }
  accessory.visible=true;
}
function jiggleAccessory() { accessoryJiggleUntil=performance.now()+600; }
function resize(){
  const w=window.innerWidth,h=window.innerHeight;
  renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.updateProjectionMatrix();
  accessory.scale.setScalar(Math.min(1,Math.max(.68,w/520)));
}
window.addEventListener("resize",resize,{passive:true});resize();
let old=performance.now(),frame=0;
function render(now){
  const dt=Math.min((now-old)/1000,.06);old=now;frame+=dt;
  const active=phase==="party" || phase==="first-choice" || phase==="twist";
  for(const dot of floating){
    dot.position.y+=dt*dot.userData.speed*(active?1.5:.65);
    if(dot.position.y>7) dot.position.y=-7;
    dot.position.x=dot.userData.base+Math.sin(frame*.22+dot.userData.base)*.12;
  }
  camera.position.x=Math.sin(frame*.13)*.10;
  accessory.rotation.y=Math.sin(frame*.8)*.12;
  accessory.rotation.z=accessoryJiggleUntil>now?Math.sin(now*.06)*.17:Math.sin(frame*1.2)*.04;
  accessory.position.y=1.35+Math.sin(frame*2)*.05;
  renderer.render(scene,camera);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
