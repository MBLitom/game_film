#!/usr/bin/env python3
"""Fetch Ara's prebuilt CC0 MakeHuman packs for an ephemeral free CI runner.
This avoids third-party upstream 280 MB ZIP downloads and avoids Hetzner/Oracle.
Files originate from the project's own public static CDN; no credentials.
"""
import concurrent.futures
import json
import os
from pathlib import Path
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://ara3dgen.com/assets/"
ROOT = Path(os.environ.get("ARA_ASSET_ROOT", "/tmp/ara-cast/public/assets"))
USER_AGENT = "MBLitom-GameFilm/0.1 (open source CC0 character builder)"
VALID = re.compile(r"^[A-Za-z0-9_./-]+$")
TEXTURE_KEYS = {"diffuse", "normal", "bump", "specular", "roughness", "metalness", "emissive", "opacity"}

def request(path, attempts=4):
    if not VALID.fullmatch(path) or path.startswith("/") or ".." in path:
        raise RuntimeError("Unsafe asset path: " + repr(path))
    url=BASE+urllib.parse.quote(path,safe="/._-")
    errors=[]
    for trial in range(attempts):
        try:
            r=urllib.request.Request(url,headers={"User-Agent":USER_AGENT,"Accept":"*/*"})
            with urllib.request.urlopen(r,timeout=35) as response:
                payload=response.read()
            if not payload:
                raise RuntimeError("Empty asset")
            return payload
        except (urllib.error.URLError, TimeoutError, RuntimeError) as exc:
            errors.append(str(exc))
            time.sleep(min(6,1+trial*2))
    raise RuntimeError("Failed to fetch Ara asset "+path+": "+"; ".join(errors[-2:]))

def walk_catalog(value,files):
    if isinstance(value,list):
        for v in value: walk_catalog(v,files)
    elif isinstance(value,dict):
        for k,v in value.items():
            if k=="file" and isinstance(v,str) and v.endswith(".pack"):
                files.add(v)
            elif k=="material" and isinstance(v,dict):
                for field in TEXTURE_KEYS:
                    tex=v.get(field)
                    if isinstance(tex,str) and re.search(r"\.(?:jpg|jpeg|png|webp)$",tex,re.I):
                        files.add("textures/"+tex)
            else: walk_catalog(v,files)
    elif isinstance(value,str) and value.endswith(".pack"):
        files.add(value)

def save(path,buffer):
    dest=ROOT/path
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(buffer)
    return (path,len(buffer))

def download(path):
    dest=ROOT/path
    if dest.exists() and dest.stat().st_size>100:
        return (path,dest.stat().st_size)
    return save(path,request(path))

def main():
    ROOT.mkdir(parents=True,exist_ok=True)
    raw=request("catalog.json")
    catalog=json.loads(raw)
    save("catalog.json",raw)
    files={"base.pack","targets.pack"}
    walk_catalog(catalog,files)
    files.discard("catalog.json")
    print(f"Fetching {len(files)+1} Ara CC0 prebuilt assets from original public CDN",flush=True)
    total=len(raw)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        future_map={pool.submit(download,path):path for path in sorted(files)}
        for i,f in enumerate(concurrent.futures.as_completed(future_map),1):
            path,size=f.result()
            total+=size
            if i%20==0 or i==len(files):
                print(f"Fetched {i}/{len(files)} files; cumulative {total/1024/1024:.1f} MiB",flush=True)
    if not (ROOT/"base.pack").exists() or not (ROOT/"targets.pack").exists():
        raise RuntimeError("Missing base MakeHuman geometry packs")
    print(f"Ready: {len(files)+1} CC0 asset files, {total/1024/1024:.1f} MiB",flush=True)

if __name__=="__main__":
    try: main()
    except Exception as ex:
        print("ERROR:",str(ex),file=sys.stderr)
        sys.exit(1)
