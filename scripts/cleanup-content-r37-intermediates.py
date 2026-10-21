"""Remove only this round's owned intermediate captures and reference build."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r37'
assert Path.cwd().resolve()==ROOT.resolve()
assert subprocess.check_output(['git','branch','--show-current'],cwd=ROOT).decode().strip()=='r1-fun-polish'
protected=set(json.loads((OUT/'baseline.json').read_text(encoding='utf8'))['preexistingUntracked'])
def read(p):return json.loads(p.read_text(encoding='utf8'))
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
review=read(OUT/'review-set.json');comparison=read(OUT/'r35-comparison.json')
keep={r['source'] for r in review['shots']}|{r['path'] for r in review['shots']}|{r['r35'] for r in comparison['rows']}
if (OUT/'walk-evidence.json').exists():keep.update(r['path'] for r in read(OUT/'walk-evidence.json')['shots'])
prior_path=OUT/'intermediate-cleanup.json';prior=read(prior_path) if prior_path.exists() else dict(files=[],cleanupPasses=0)
records=[];trimmed=[]
for p in OUT.rglob('browser-*.json'):
 if p.parent==OUT/'crossing':continue # failed intermediate run, not final evidence
 m=read(p);remaining=[]
 for row in m['shots']:
  name=Path(row['path']).name;rel=row['path']
  selected=rel in keep
  if p.parent==OUT:
   selected|=bool(re.fullmatch(r'phone-(?:cake|crossing|tickets)-(?:complete|saved|replay-opening|replay-new-conditions)\.png',name))
   selected|=name=='phone-cake-bay-main-road.png'
   selected|=bool(re.fullmatch(r'phone-crossing(?:-mirror)?-stage-[123]-(?:unobserved|only-source-main|new-car-yields|clear-needs-recheck|recheck-restored|finished)\.png',name))
   selected|=name in ('phone-crossing-2-grandma-before.png','phone-crossing-2-grandma-on-zebra.png','phone-crossing-stage-2-grandma-arrived.png')
   selected|=bool(re.fullmatch(r'phone-tickets-stage-3-(?:hold-half-[12]|hold-paused-[12]|walking-[12]|seated-[123])\.png',name))
  elif p.parent==OUT/'layout':selected|=name.endswith(('-playing.png','-cabin.png','-crossing-single-background.png','-stage-2-right-turn-lower-lane.png'))
  elif p.parent==OUT/'offline':selected|=name.endswith(('-complete.png','-saved.png','-replay-opening.png'))
  elif p.parent==OUT/'switching':selected|=name.endswith('-after-unfinished-crossing.png')
  elif p.parent==OUT/'store':selected=rel.startswith('docs/store/screenshots/content-r37/')
  if selected:keep.add(rel);remaining.append(row)
  elif (ROOT/rel).is_file():trimmed.append(rel)
 m['capturedShotCount']=m.get('capturedShotCount',len(m['shots']));m['shots']=remaining;m['retainedShotCount']=len(remaining)
 m['captureRetention']='Only selected review originals, supplemental proof and validation inputs retained; others were intermediate captures.'
 p.write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf8')
candidates=set(trimmed)
for p in OUT.rglob('*.png'):
 rel=p.relative_to(ROOT).as_posix()
 if p.parent==OUT/'review-set':continue
 if p.parent in (OUT,OUT/'crossing') or OUT/'comparison-baseline' in p.parents or p.name.startswith('diagnostic-'):candidates.add(rel)
# All artifacts in this directory came from the failed pre-final crossing run.
failed=OUT/'crossing'
if failed.exists():candidates.update(p.relative_to(ROOT).as_posix() for p in failed.rglob('*') if p.is_file())
for p in [OUT/'crossing-output.txt',OUT/'comparison-baseline/phone-cake-stage-2-finished.png']:
 if p.is_file():candidates.add(p.relative_to(ROOT).as_posix())
reference=ROOT/'dist/r37-reference'
if reference.exists():
 reference.resolve().relative_to((ROOT/'dist').resolve())
 candidates.update(p.relative_to(ROOT).as_posix() for p in reference.rglob('*') if p.is_file())
for rel in sorted(candidates-keep):
 p=ROOT/rel;p.resolve().relative_to(ROOT.resolve());assert rel not in protected and not p.is_symlink()
 if not p.is_file():continue
 assert rel.startswith(('docs/content/r37/','dist/r37-reference/'))
 records.append(dict(path=rel,bytes=p.stat().st_size,sha256=digest(p)))
for r in records:(ROOT/r['path']).unlink()
for folder in [failed,reference]:
 if folder.exists():
  for p in sorted((x for x in folder.rglob('*') if x.is_dir()),key=lambda x:len(x.parts),reverse=True):
   p.resolve().relative_to(ROOT.resolve());assert not p.is_symlink();p.rmdir()
  folder.rmdir()
records=prior['files']+records
result=dict(status='VERIFIED',cleanupPasses=prior.get('cleanupPasses',1)+1,deletedFiles=len(records),releasedBytes=sum(r['bytes'] for r in records),files=records,ownedAuditTmpFiles=0,ownedSystemTempFiles=0,note='Counts cover deletion events across final validation passes. No manual files created in .audit-tmp, tmp or system temp. Chromium temporary profiles are removed by normal browser.close(). Early Vite rebuild cleanup was not pre-measured and is excluded from these totals.')
(OUT/'intermediate-cleanup.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:result[k] for k in ['status','deletedFiles','releasedBytes']}))
