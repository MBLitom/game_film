import {readFileSync,statSync} from "node:fs";
import {basename} from "node:path";

const files=process.argv.slice(2);
if(files.length<3)throw Error("Expected at least 3 original GLB actor files");
for(const path of files){
  const size=statSync(path).size;
  if(size>55*1024*1024) throw Error("GLB too large for public GitHub: "+basename(path));
  const buf=readFileSync(path);
  if(buf.length<32 || buf.toString("ascii",0,4)!=="glTF"||buf.readUInt32LE(4)!==2) throw Error("Not a GLB 2.0 file: "+basename(path));
  if(buf.readUInt32LE(8)!==buf.length) throw Error("GLB file length mismatch: "+basename(path));
  const jsonLength=buf.readUInt32LE(12);
  if(buf.toString("ascii",16,20)!=="JSON") throw Error("Missing glTF JSON chunk");
  const json=JSON.parse(buf.toString("utf8",20,20+jsonLength));
  const skins=json.skins?.length || 0;
  const anim=json.animations?.length || 0;
  const morphs=json.meshes?.flatMap(x=>x.primitives||[]).filter(x=>x.targets?.length)?.length || 0;
  if(!skins) throw Error("Character needs a rig: "+basename(path));
  if(!json.meshes?.length) throw Error("Character has no geometry: "+basename(path));
  console.log(JSON.stringify({actor:basename(path),size_mb:Math.round(size/1024/1024*10)/10,skins,animations:anim,morph_primitives:morphs,meshes:json.meshes.length,nodes:json.nodes?.length||0}));
}
