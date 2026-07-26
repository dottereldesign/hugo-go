"""Lock every 24 FPS neutral-idle body to frame 01's cream-panel root."""
from __future__ import annotations
import hashlib, json, shutil
from pathlib import Path
from PIL import Image
from neutral_registration import detect_torso_root, stabilize

ROOT=Path(__file__).resolve().parents[2]
ANIM=ROOT/'src/assets/game/2d-v02/animations/neutral-idle'

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main() -> None:
    path=ANIM/'manifest.json'; manifest=json.loads(path.read_text(encoding='utf8'))
    runtime=[frame for frame in manifest['frames'] if frame['runtime']]
    first=ROOT/runtime[0]['file']; target=detect_torso_root(Image.open(first).convert('RGBA'))
    corrected=0; fallback=[]
    for frame in runtime:
        output=ROOT/frame['file']; image=Image.open(output).convert('RGBA')
        try:
            locked, metrics=stabilize(image,target)
            locked.save(output)
            frame['rootRegistration']=metrics
            corrected+=1
        except ValueError:
            # The frame remains on the common 640px source canvas; record it
            # for manual review rather than applying an invented transform.
            fallback.append(frame['index'])
            frame['rootRegistration']={'method':'common-canvas fallback; cream panels not detectable'}
        alpha=Image.open(output).convert('RGBA').getchannel('A').getbbox()
        frame['output']['sha256']=digest(output)
        frame['output']['alphaBounds']=list(alpha) if alpha else [0,0,0,0]
    bookend=manifest['frames'][-1]; first_frame=runtime[0]
    shutil.copyfile(ROOT/first_frame['file'],ROOT/bookend['file'])
    bookend['output']['sha256']=digest(ROOT/bookend['file'])
    bookend['output']['alphaBounds']=first_frame['output']['alphaBounds']
    manifest['registration']={'method':'cream-chest-panel opacity-mask root; uniform transform only','targetFrame':1,'targetRoot':{'x':target.x,'y':target.y,'torsoHeight':target.height},'correctedRuntimeFrames':corrected,'fallbackRuntimeFrames':fallback}
    path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
    print(f'Corrected {corrected}/{len(runtime)} frames; fallback: {fallback}')
if __name__=='__main__': main()
