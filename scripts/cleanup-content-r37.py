"""Hash-bound deletion of superseded tracked media; protect every reader input."""
import hashlib,json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r37'
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT).decode('utf8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def refs(v):
 if isinstance(v,dict):
  for k,x in v.items():
   if isinstance(x,str) and k in ('path','source','original','before','after','baseline'):yield x
   elif isinstance(x,(dict,list)):yield from refs(x)
 elif isinstance(v,list):
  for x in v:yield from refs(x)
def prepare():
 assert Path.cwd().resolve()==ROOT.resolve();assert git('branch','--show-current').strip()=='r1-fun-polish'
 tracked=set(git('ls-files','-z').split('\0'));dirty=set(git('diff','--name-only','-z').split('\0'));dependencies={}
 # Historical verification scripts hash the media named in their JSON inputs.
 for base in ['docs/content','docs/evidence']:
  for p in (ROOT/base).rglob('*.json'):
   if OUT in p.parents or 'cleanup' in p.name:continue
   if not(p.name.startswith('browser') or p.name in ('before-images.json','before-after.json','merge-path.json','review-path.json','review-set.json','review-inspection.json','captures.json')):continue
   try:
    for ref in refs(json.loads(p.read_text(encoding='utf-8-sig'))):dependencies.setdefault(ref,[]).append(p.relative_to(ROOT).as_posix())
   except(ValueError,UnicodeError):pass
 source='\n'.join(p.read_text(encoding='utf8',errors='replace') for base in ['scripts','tests'] for p in (ROOT/base).rglob('*') if p.is_file() and p.suffix in ('.js','.mjs','.py','.ps1'))
 files=[];retained=[]
 for rel in sorted(tracked):
  if not(re.match(r'docs/content/r(?:[1-9]|[12]\d|3[0-6])/',rel) or rel.startswith('docs/evidence/')):continue
  p=ROOT/rel
  if p.suffix.lower() not in ('.png','.webp','.jpg','.jpeg','.gif','.mp4','.webm') or not p.is_file():continue
  p.resolve().relative_to(ROOT.resolve());assert not p.is_symlink()
  reason='original art and source contract' if '/art/' in rel else 'historical verifier hashes manifest media' if rel in dependencies else 'explicit test or validation script input' if rel in source or p.name in source else 'preexisting modification' if rel in dirty else ''
  row=dict(path=rel,bytes=p.stat().st_size,sha256=sha(p))
  (retained if reason else files).append(dict(**row,reason=reason,readers=dependencies.get(rel,[])) if reason else row)
 plan=dict(status='PREPARED',root=str(ROOT),branch='r1-fun-polish',files=files,retained=retained,filesToDelete=len(files),bytesToRelease=sum(r['bytes'] for r in files))
 (OUT/'cleanup-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps({k:plan[k] for k in ['status','filesToDelete','bytesToRelease']}))
def apply():
 plan=json.loads((OUT/'cleanup-plan.json').read_text(encoding='utf8'));assert Path(plan['root']).resolve()==ROOT.resolve()==Path.cwd().resolve();assert git('branch','--show-current').strip()==plan['branch']
 tracked=set(git('ls-files','-z').split('\0'));dirty=set(git('diff','--name-only','-z').split('\0'))
 for row in plan['files']:
  p=ROOT/row['path'];p.resolve().relative_to(ROOT.resolve());assert row['path'] in tracked and row['path'] not in dirty;assert p.is_file() and not p.is_symlink() and sha(p)==row['sha256']
 for row in plan['files']:(ROOT/row['path']).unlink()
 result=dict(status='EXECUTED',plan='docs/content/r37/cleanup-plan.json',deletedFiles=len(plan['files']),releasedBytes=sum(r['bytes'] for r in plan['files']),retainedFiles=len(plan['retained']),files=plan['files'])
 (OUT/'cleanup-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps({k:result[k] for k in ['status','deletedFiles','releasedBytes']}))
if __name__=='__main__':apply() if '--apply' in sys.argv else prepare()
