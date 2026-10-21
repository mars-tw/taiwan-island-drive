"""Remove only this run's enumerated, hash-checked intermediate files."""
import hashlib
import json
import re
import subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r36'
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert Path.cwd().resolve()==ROOT.resolve()
assert subprocess.check_output(['git','branch','--show-current'],cwd=ROOT).decode().strip()=='r1-fun-polish'
assert load(OUT/'r35-comparison.json')['status']=='VERIFIED'
assert load(OUT/'review-inspection.json')['status']=='VERIFIED'
baseline=load(OUT/'baseline.json');preexisting=set(baseline['preexistingUntracked'])
keep={r['source'] for r in load(OUT/'review-set.json')['shots']}
for p in OUT.glob('phone-*.png'):
 name=p.name
 if re.fullmatch(r'phone-crossing(?:-mirror)?-stage-[123]-(unobserved|car-approach|car-passing|car-left|new-car-yields|recheck-restored|joined-right-lane|finished)\.png',name):keep.add(p.relative_to(ROOT).as_posix())
 if re.fullmatch(r'phone-cake-stage-[123]-(stopped|tray-edge|high-speed)\.png',name) or name.startswith('phone-cake-bay-'):keep.add(p.relative_to(ROOT).as_posix())
 if re.fullmatch(r'phone-tickets-stage-[123]-(wrong-shape|wrong-color|hold-start-0|hold-full-0|seated-3)\.png',name):keep.add(p.relative_to(ROOT).as_posix())
 if re.fullmatch(r'phone-(cake|crossing|tickets)-(complete|saved|replay-opening)\.png',name):keep.add(p.relative_to(ROOT).as_posix())
for p in (OUT/'layout/layout').glob('*-playing.png'):keep.add(p.relative_to(ROOT).as_posix())
for p in (OUT/'offline').glob('phone-*-saved.png'):keep.add(p.relative_to(ROOT).as_posix())
for p in (OUT/'review-set').glob('*.png'):keep.add(p.relative_to(ROOT).as_posix())
candidates={p for p in OUT.rglob('*.png') if p.relative_to(ROOT).as_posix() not in keep}
# All reference builds and captures were created by this run. Never sweep a
# shared system temp directory or another lane's files.
for folder in [OUT/'comparison-baseline',OUT/'visual-comparison',ROOT/'dist/r36-reference']:
 if folder.exists():candidates.update(p for p in folder.rglob('*') if p.is_file())
rows=[]
for p in sorted(candidates):
 resolved=p.resolve();resolved.relative_to(ROOT.resolve());rel=p.relative_to(ROOT).as_posix()
 assert rel not in preexisting and not p.is_symlink()
 assert OUT.resolve() in resolved.parents or (ROOT/'dist/r36-reference').resolve() in resolved.parents
 rows.append(dict(path=rel,bytes=p.stat().st_size,sha256=sha(p)))
plan=dict(status='PREPARED',root=str(ROOT.resolve()),files=rows,filesToDelete=len(rows),bytesToRelease=sum(r['bytes'] for r in rows),
 note='no system temp files, backup directories or export archives created; no pre-existing ignored temp files removed')
(OUT/'intermediate-cleanup-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
for r in rows:assert sha(ROOT/r['path'])==r['sha256']
for r in rows:(ROOT/r['path']).unlink()
for scope in ['all','layout','offline','store','performance']:
 path=OUT/(('' if scope=='all' else scope+'/')+'browser-'+scope+'.json');m=load(path);original=m['shots']
 m['capturedShots']=len(original);m['verifiedBeforeCleanup']=dict(shots=len(original),allAudioSuppressed=all(r['audio']['harness']['suppressed'] and not r['audio']['speech'] and not r['audio']['pending'] for r in original),minimumControlsChecked=True,sourceManifestSha256=sha(path))
 m['shots']=[r for r in original if (ROOT/r['path']).exists()];m['removedIntermediateShots']=len(original)-len(m['shots'])
 path.write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
for folder in [OUT/'comparison-baseline',OUT/'visual-comparison',ROOT/'dist/r36-reference']:
 if folder.exists():
  for p in sorted((p for p in folder.rglob('*') if p.is_dir()),key=lambda p:len(p.parts),reverse=True):
   if not any(p.iterdir()):p.rmdir()
  if not any(folder.iterdir()):folder.rmdir()
plan.update(status='EXECUTED',deletedFiles=len(rows),releasedBytes=sum(r['bytes'] for r in rows))
assert all(not (ROOT/r['path']).exists() for r in rows)
(OUT/'intermediate-cleanup-result.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:plan[k] for k in ['status','deletedFiles','releasedBytes']}))
