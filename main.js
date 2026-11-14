import * as THREE from "./vendor/three.module.js";

const $ = (id) => document.getElementById(id);
const video = $("film"), opening = $("opening"), ending = $("ending");
const choiceOverlay = $("choice-overlay"), subtitle = $("subtitles");
const choiceTitle = $("choice-title"), choiceDesc = $("choice-description");
const continueBtn = $("continue"), soundBtn = $("sound-btn"), sceneLabel = $("scene-indicator");
const choiceButtons = [...document.querySelectorAll(".look")];

const videoFormat = video.canPlayType('video/mp4; codecs="avc1.42E01E"') ? "mp4" : "webm";
const clips = {
  dressing: `./media/hair.${videoFormat}`,
  party: `./media/party.${videoFormat}`
};
let phase = "title"; // title | dressing | first-choice | dressing-resume | twist | party | end
let activeLook = null;
let narrationEnabled = false;
let currentSubtitle = "";
let reactionLock = false;
let errorShown = false;

function setSubtitle(text) {
  if (text === currentSubtitle) return;
  currentSubtitle = text;
  subtitle.textContent = text || "";
}
function speak(text) {
  if (!narrationEnabled || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const voiceLine = new SpeechSynthesisUtterance(text);
    voiceLine.lang = "en-US"; voiceLine.rate = .96; voiceLine.pitch = 1.12;
    window.speechSynthesis.speak(voiceLine);
  } catch { /* captions still work */ }
}
function line(text, talk = false) {
  setSubtitle(text);
  if (talk) speak(text);
}
function setPhase(next) {
  phase = next;
  document.body.classList.toggle("is-choice",next === "first-choice" || next === "twist");
}
function failMedia() {
  if (errorShown) return;
  errorShown = true;
  const box = $("error");
  box.hidden = false;
  box.textContent = "The preview video could not load. Check the connection and tap to reload.";
  box.tabIndex = 0;
  box.onclick = () => location.reload();
}
function loadClip(source) {
  video.pause();
  video.src = clips[source];
  video.load();
}
function playClip() {
  video.muted = true; // all English dialogue belongs to the prototype, not sample footage
  const playing = video.play();
  if (playing && playing.catch) playing.catch(failMedia);
}
function resetLookChoices() {
  activeLook = null;
  choiceButtons.forEach(button => {
    button.classList.remove("selected");
    button.setAttribute("aria-pressed", "false");
  });
  continueBtn.disabled = true;
  accessory.visible = false;
}
function openChoice(kind) {
  video.pause();
  setPhase(kind === "first" ? "first-choice" : "twist");
  choiceOverlay.hidden = false;
  resetLookChoices();
  if (kind === "first") {
    sceneLabel.textContent = "SCENE 01 · HAIR STUDIO";
    $("choice-badge").textContent = "YOUR TURN · HELP THE STORY";
    choiceTitle.textContent = "Help with the party look!";
    choiceDesc.textContent = "Pick an accessory. The story will continue when you're ready.";
    line("Oh! Is that for me? Which one should we try?", true);
  } else {
    sceneLabel.textContent = "PLOT TWIST · NEW PARTY THEME";
    $("choice-badge").textContent = "PLOT TWIST · HELP AGAIN";
    choiceTitle.textContent = "Wait! The theme changed!";
    choiceDesc.textContent = "Tonight it's Galaxy Glow! Help prepare a new look.";
    line("What? The theme changed AGAIN? Let's pick something magical!", true);
  }
}
function selectLook(key) {
  activeLook = key;
  choiceButtons.forEach(button => {
    const selected = button.dataset.look === key;
    button.classList.toggle("selected",selected);
    button.setAttribute("aria-pressed",String(selected));
  });
  continueBtn.disabled = false;
  setAccessory(key);
  const names = {
    rose: "Pink ribbons? Oh, that's cute!",
    star: "Wow! I'm a shining star!",
    royal: "A crown? That's a bit much! Can we try another?"
  };
  line(names[key], true);
}
choiceButtons.forEach(button => button.addEventListener("click", () => selectLook(button.dataset.look)));
$("start").addEventListener("click", () => startStory());
$("again").addEventListener("click", () => startStory());
$("continue").addEventListener("click", () => {
  if (!activeLook) return;
  choiceOverlay.hidden = true;
  accessory.visible = false;
  if (phase === "first-choice") {
    setPhase("dressing-resume");
    sceneLabel.textContent = "SCENE 01 · THE MAKEOVER";
    line("Okay, let's finish getting ready!",true);
    playClip();
  } else if (phase === "twist") {
    setPhase("party");
    sceneLabel.textContent = "SCENE 02 · THE PARTY";
    $("episode-label").textContent = "EPISODE 01 · FINALE";
    line("Come on! The party is waiting for us!",true);
    loadClip("party");
    playClip();
  }
});
function startStory() {
  errorShown = false; $("error").hidden = true;
  opening.hidden = true; ending.hidden = true; choiceOverlay.hidden = true;
  $("episode-label").textContent = "EPISODE 01";
  resetLookChoices();
  setPhase("dressing");
  loadClip("dressing");
  sceneLabel.textContent = "SCENE 01 · GETTING READY";
  line("Tonight is the big party! Let's get ready!",true);
  playClip();
}
video.addEventListener("timeupdate", () => {
  if (phase === "dressing") {
    if (video.currentTime >= 4.5) {
      openChoice("first");
    } else if (video.currentTime >= 2) setSubtitle("The friends are getting ready for a special night...");
  } else if (phase === "dressing-resume") {
    if (video.currentTime > 6.5) setSubtitle("They think everything is ready. But...");
  } else if (phase === "party") {
    if (video.currentTime > 3) setSubtitle("The friends made it! This is only the beginning...");
    if (video.currentTime > 9) finish();
  }
});
video.addEventListener("ended",() => {
  if (phase === "dressing" || phase === "dressing-resume") openChoice("twist");
  else if (phase === "party") finish();
});
video.addEventListener("error",failMedia);
video.addEventListener("pointerdown",event => {
  if (phase !== "first-choice" && phase !== "twist") return;
  // This hit-zone is only a temporary placeholder until the performer is tracked in footage.
  const relativeY = (event.clientY / window.innerHeight);
  if (relativeY < .68 && !reactionLock) {
    reactionLock = true;
    line("Ouch! Easy with my hair, please!",true);
    jiggleAccessory();
    setTimeout(() => {reactionLock = false;},650);
  }
});
soundBtn.addEventListener("click",() => {
  narrationEnabled = !narrationEnabled;
  soundBtn.textContent = narrationEnabled ? "🔊" : "🔇";
  soundBtn.setAttribute("aria-pressed",String(narrationEnabled));
  if (narrationEnabled) speak(currentSubtitle || "Welcome to Game Film!");
  else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
});
document.addEventListener("visibilitychange",() => {
  if (document.hidden) {
    video.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
});
function finish() {
  if (phase === "end") return;
  video.pause(); accessory.visible = false;
  setPhase("end");
  ending.hidden = false;
  sceneLabel.textContent = "TO BE CONTINUED";
  subtitle.textContent = "";
  speak("To be continued!");
}
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
