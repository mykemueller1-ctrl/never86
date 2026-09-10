#!/usr/bin/env python3
"""Render caption-matched scenes from inspected owner seat UI captures.
Produces 1080p H.264, CRF 14, 30fps, no audio, plus exact caption SRT.
The source screenshots and crop rectangles are captured through browser tools.
"""
import argparse, json, shutil, subprocess, tempfile
from pathlib import Path

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('captures',type=Path)
parser.add_argument('output',type=Path)
parser.add_argument('--ffmpeg',required=True,type=Path)
parser.add_argument('--short',action='store_true')
args=parser.parse_args()
scenes=json.loads((Path(__file__).resolve().parents[1]/'marketing/demo-launch/owner-seat-story.json').read_text(encoding='utf-8'))
frames={f['id']:f for f in json.loads((args.captures/'frames.json').read_text(encoding='utf-8'))}
if args.short:
    scenes=[{**scenes[0],'seconds':7},{**scenes[1],'seconds':8},{**scenes[-1],'seconds':5}]
assert sum(s['seconds'] for s in scenes)==(20 if args.short else 60)
args.output.parent.mkdir(parents=True,exist_ok=True)
def run(params,work):
    result=subprocess.run([str(args.ffmpeg.resolve()),'-hide_banner','-nostdin','-loglevel','error','-y',*params],cwd=work,capture_output=True,text=True)
    if result.returncode: raise RuntimeError(result.stderr[-5000:])
def draw(name,size,y,color='0xF8F6F2',x='(w-tw)/2'):
    return f'drawtext=fontfile=font.ttf:textfile={name}:expansion=none:fontsize={size}:fontcolor={color}:x={x}:y={y}'
with tempfile.TemporaryDirectory(prefix='n86-owner-video-') as temp:
    work=Path(temp)
    shutil.copyfile('C:/Windows/Fonts/segoeuib.ttf',work/'font.ttf')
    (work/'brand.txt').write_text('Never86’d  |  Owner seat',encoding='utf-8')
    (work/'disclosure.txt').write_text('PRODUCT PREVIEW  ·  FICTIONAL RECORDS',encoding='utf-8')
    concat=[];subtitles=[];elapsed=0
    for index,scene in enumerate(scenes,1):
        f=frames[scene['id']];c=f['crop'];v=f['viewport']
        # Crop only the inspected UI region, using viewport-normalized geometry.
        filters=[f"crop=iw*{c['w']}/{v['w']}:ih*{c['h']}/{v['h']}:iw*{c['x']}/{v['w']}:ih*{c['y']}/{v['h']}",
                 'scale=1800:794:force_original_aspect_ratio=decrease:flags=lanczos','setsar=1',
                 'pad=1920:1080:(ow-iw)/2:78+(794-ih)/2:color=0x25262A',
                 draw('brand.txt',26,24,x='60'),draw('disclosure.txt',20,28,'0xDFBBA2','w-tw-60')]
        for line,text in enumerate(scene['caption']):
            name=f'caption-{index}-{line}.txt';(work/name).write_text(text,encoding='utf-8')
            filters.append(draw(name,49,917+line*62))
        filters += [f'drawbox=x=60:y=1050:w={1800*index//len(scenes)}:h=4:color=0xB84322:t=fill','format=yuv420p']
        name=f'scene-{index}.mp4'
        print(f"Rendering {scene['id']} ({scene['seconds']} seconds)",flush=True)
        run(['-loop','1','-framerate','30','-i',str((args.captures/(scene['id']+'.jpg')).resolve()),'-vf',','.join(filters),'-an','-c:v','libx264','-preset','slow','-tune','stillimage','-crf','14','-pix_fmt','yuv420p','-frames:v',str(scene['seconds']*30),'-r','30',name],work)
        concat.append("file '"+name+"'")
        def stamp(s): return f'00:{s//60:02d}:{s%60:02d},000'
        subtitles.append(str(index)+'\n'+stamp(elapsed)+' --> '+stamp(elapsed+scene['seconds'])+'\n'+'\n'.join(scene['caption'])+'\n')
        elapsed+=scene['seconds']
    (work/'concat.txt').write_text('\n'.join(concat),encoding='utf-8')
    staged=work/'final.mp4'
    run(['-f','concat','-safe','1','-i','concat.txt','-c:v','copy','-an','-movflags','+faststart','-metadata','title=Never86 owner seat: price watch and food cost','-metadata','comment=Captioned UI still walkthrough. Fictional records. No audio. No live vendor message sent.',str(staged)],work)
    # Verify every frame decodes before replacing a deliverable.
    run(['-i',str(staged),'-f','null','-'],work)
    shutil.copyfile(staged,args.output)
    args.output.with_suffix('.srt').write_text('\n'.join(subtitles),encoding='utf-8')
print(json.dumps({'output':str(args.output),'seconds':elapsed,'resolution':'1920x1080','fps':30,'crf':14,'audio':False,'decode':'passed'}))
