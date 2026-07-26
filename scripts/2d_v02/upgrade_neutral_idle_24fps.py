"""Promote the approved neutral idle to 24 timing FPS with bounded pair bridges."""
from __future__ import annotations
import json, shutil
from pathlib import Path
from PIL import Image
from refine_neutral_idle import alpha_bounds, register, sha256, make_contact_sheet, recolour_gum
from neutral_registration import detect_torso_root, stabilize

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'src/assets/game/2d-v02/animations/neutral-idle'
FRAMES=OUT/'frames'
SOURCE=ROOT/'art/source-images/game/2d-v02/animations/neutral-idle/24fps-bridges'

def middle(board: Image.Image, row: int) -> Image.Image:
    w,h=board.width//3,board.height//4
    cell=board.crop((w,(row-1)*h,w*2,row*h))
    return cell.crop(alpha_bounds(cell))

def main():
    old=json.loads((OUT/'manifest.json').read_text(encoding='utf8'))
    runtime=[x for x in old['frames'] if x['runtime']]
    assert len(runtime)==34
    originals=[(x,Image.open(ROOT/x['file']).convert('RGBA').copy()) for x in runtime]
    bridge_manifest=json.loads((SOURCE/'manifest.json').read_text(encoding='utf8'))
    bridge_by_outgoing={}
    for board in bridge_manifest['boards']:
        image=Image.open(SOURCE/f"hugo-neutral-idle-24fps-bridge-board-{board['id']}-transparent.png").convert('RGBA')
        for row in board['rows']:
            bridge_by_outgoing[row['outgoingFrame']]=(board['id'],row,middle(image,row['row']))
    assert len(bridge_by_outgoing)==34
    target=detect_torso_root(originals[0][1])
    for f in FRAMES.glob('*.png'): f.unlink()
    result=[]
    for base_index,(entry,image) in enumerate(originals,start=1):
        index=len(result)+1; slug=entry['slug']; name=f'hugo-neutral-idle-{index:02d}-{slug}.png'; path=FRAMES/name
        image.save(path)
        bounds=alpha_bounds(image)
        result.append({'index':index,'slug':slug,'label':entry['label'],'filename':name,'runtime':True,'durationTicks':entry['durationTicks']*2-1,'file':str(path.relative_to(ROOT)).replace('\\','/'),'source':{**entry['source'],'originalFrame':base_index,'refinement':'24fps-preserved-base-drawing'},'output':{'sha256':sha256(path),'alphaBounds':bounds}})
        board_id,row,crop=bridge_by_outgoing[base_index]
        prepared=recolour_gum(register(crop))
        try:
            midpoint,registration=stabilize(prepared,target)
        except ValueError:
            # A generated bridge can simplify a cream panel enough to defeat
            # the detector. It is already placed on the fixed production
            # canvas, so retain it and record why no extra correction applied.
            midpoint,registration=prepared,{'method':'fixed-canvas registration; torso detector unavailable'}
        index=len(result)+1; next_index=row['incomingFrame']; bridge_slug=f"mid-{base_index:02d}-{next_index:02d}"
        name=f'hugo-neutral-idle-{index:02d}-{bridge_slug}.png'; path=FRAMES/name; midpoint.save(path)
        result.append({'index':index,'slug':bridge_slug,'label':f"Midpoint {base_index:02d} to {next_index:02d}",'filename':name,'runtime':True,'durationTicks':1,'file':str(path.relative_to(ROOT)).replace('\\','/'),'source':{'type':'24fps-adjacent-pair-inbetween','board':f'art/source-images/game/2d-v02/animations/neutral-idle/24fps-bridges/hugo-neutral-idle-24fps-bridge-board-{board_id}-transparent.png','row':row['row'],'column':2,'betweenBaseFrames':[base_index,next_index],'fraction':'50% temporal midpoint'},'rootRegistration':registration,'output':{'sha256':sha256(path),'alphaBounds':alpha_bounds(midpoint)}})
    assert len(result)==68 and sum(x['durationTicks'] for x in result)==120
    bookend=result[0].copy(); bookend['index']=69; bookend['filename']='hugo-neutral-idle-69-loop-bookend.png'; bookend['runtime']=False; bookend['durationTicks']=0; bookend['slug']='loop-bookend'; bookend['label']='Exact frame 01 loop bookend'; name=bookend['filename']; path=FRAMES/name; shutil.copyfile(ROOT/result[0]['file'],path); bookend['file']=str(path.relative_to(ROOT)).replace('\\','/'); bookend['output']['sha256']=sha256(path); result.append(bookend)
    manifest={'schemaVersion':3,'animation':{'id':'neutral-idle','name':'Neutral Front · Bubble-gum idle','description':'Hugo gets bored, blows grape gum, wipes the splat, then returns to neutral.'},'timing':{'baseFps':24,'runtimeFrameCount':68,'drawingCount':69,'runtimeTicks':120,'loopDurationSeconds':5,'bookendFrame':69,'bookendRuntime':False},'generationStrategy':'34 approved stabilized key drawings plus 34 exact adjacent-pair 50% bridge drawings; one timing tick each; exact frame-01 bookend','frames':result}
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
    make_contact_sheet(result)
    print('wrote',len(result),'drawings at 24 fps')
if __name__=='__main__': main()
