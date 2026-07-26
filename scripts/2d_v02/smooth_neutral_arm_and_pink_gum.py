"""Insert two arm-motion drawings per transition and restore pink gum."""
from __future__ import annotations
import hashlib, json, shutil
from pathlib import Path
import cv2, numpy as np
from PIL import Image
from refine_neutral_idle import alpha_bounds, register
from neutral_registration import detect_torso_root, stabilize

ROOT=Path(__file__).resolve().parents[2]
ANIM=ROOT/'src/assets/game/2d-v02/animations/neutral-idle'
SOURCE=ROOT/'art/source-images/game/2d-v02/animations/neutral-idle/arm-smooth-v2/hugo-neutral-idle-arm-smooth-transparent.png'

def pink(image:Image.Image)->Image.Image:
    a=np.array(image.convert('RGBA')); rgb=a[:,:,:3]; h=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV)
    purple=(a[:,:,3]>30)&(rgb[:,:,2]>rgb[:,:,0]*1.05)&(rgb[:,:,2]>rgb[:,:,1]*1.25)
    h[purple,0]=170; h[purple,1]=np.maximum(h[purple,1],150); h[purple,2]=np.maximum(h[purple,2],210)
    a[:,:,:3]=cv2.cvtColor(h,cv2.COLOR_HSV2RGB); return Image.fromarray(a)
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def crop(board,row,col):
    width,height=board.width//4,board.height//3
    cell=board.crop((col*width,row*height,(col+1)*width,(row+1)*height)); return cell.crop(alpha_bounds(cell))
def main():
    mp=ANIM/'manifest.json'; manifest=json.loads(mp.read_text()); old=manifest['frames']; runtime=old[:-1]
    board=Image.open(SOURCE).convert('RGBA'); target=detect_torso_root(Image.open(ROOT/runtime[0]['file']).convert('RGBA'))
    additions={39:[crop(board,0,1),crop(board,0,2)],41:[crop(board,1,1),crop(board,1,2)],43:[crop(board,2,1),crop(board,2,2)]}
    staged=[]
    for frame in runtime:
        image=pink(Image.open(ROOT/frame['file']).convert('RGBA'))
        staged.append((frame,image))
        # Add the specifically generated 33% / 66% arm poses after each start key.
        if frame['index'] in additions:
            for part,raw in enumerate(additions[frame['index']],start=1):
                image=pink(register(raw))
                try: image,metrics=stabilize(image,target)
                except ValueError: metrics={'method':'fixed 640 canvas fallback'}
                clone={'slug':f"arm-smooth-{frame['index']:02d}-{part}",'label':f"Arm motion {part}/2 after {frame['index']:02d}",'runtime':True,'durationTicks':1,'source':{'type':'arm-motion-33-66-inbetween','sheet':'art/source-images/game/2d-v02/animations/neutral-idle/arm-smooth-v2/hugo-neutral-idle-arm-smooth-transparent.png','row':(frame['index']-39)//2+1,'column':part+1,'maxSheetPoses':12},'rootRegistration':metrics}
                staged.append((clone,image))
    frame_root=ANIM/'frames'; temp=frame_root/'_smooth_tmp'; temp.mkdir(exist_ok=True)
    for p in frame_root.glob('*.png'): shutil.copy2(p,temp/p.name)
    for p in frame_root.glob('*.png'): p.unlink()
    output=[]
    for index,(entry,image) in enumerate(staged,start=1):
        slug=entry['slug']; name=f'hugo-neutral-idle-{index:02d}-{slug}.png'; file=frame_root/name; image.save(file)
        record={**entry,'index':index,'filename':name,'file':str(file.relative_to(ROOT)).replace('\\','/'),'output':{'sha256':digest(file),'alphaBounds':list(image.getchannel('A').getbbox())}}
        output.append(record)
    bookend={**old[-1],'index':len(output)+1,'filename':f'hugo-neutral-idle-{len(output)+1:02d}-loop-bookend.png','file':''}
    f=frame_root/bookend['filename']; shutil.copyfile(ROOT/output[0]['file'],f); bookend['file']=str(f.relative_to(ROOT)).replace('\\','/'); bookend['output']={'sha256':digest(f),'alphaBounds':output[0]['output']['alphaBounds']}; output.append(bookend)
    shutil.rmtree(temp)
    manifest['frames']=output; manifest['timing'].update({'runtimeFrameCount':len(staged),'drawingCount':len(output),'runtimeTicks':len(staged),'loopDurationSeconds':len(staged)/24,'bookendFrame':len(output)})
    manifest['generationStrategy']='uniform 24 FPS sequence; adjacent bridges plus two 33%/66% arm-motion in-betweens for each fast right-arm transition; exact frame-01 bookend'
    mp.write_text(json.dumps(manifest,indent=2)+'\n')
    print('runtime',len(staged),'files',len(output))
if __name__=='__main__':main()
