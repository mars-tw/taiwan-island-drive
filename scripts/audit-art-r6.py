"""Local source/version/test integrity and filename-only secret scan."""
from pathlib import Path
import json, subprocess, re, hashlib
ROOT=Path(__file__).resolve().parents[1]
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True,encoding='utf-8').replace('\r\n','\n')
branch=git('branch','--show-current').strip();assert branch=='r1-fun-polish'
package=json.loads((ROOT/'package.json').read_text(encoding='utf-8'))
old=json.loads(git('show','HEAD:package.json'))
assert package['version']=='2.10.0'
assert all(package[k]==old[k] for k in ['dependencies','devDependencies','overrides'])
assert not git('diff','--name-only','--','tests').strip()
lock=json.loads((ROOT/'package-lock.json').read_text(encoding='utf-8'))
assert lock['version']==lock['packages']['']['version']==package['version']
ios=(ROOT/'ios/App/App.xcodeproj/project.pbxproj').read_text(encoding='utf-8')
android=(ROOT/'android/app/build.gradle').read_text(encoding='utf-8')
assert ios.count('MARKETING_VERSION = 2.10.0;')==2 and ios.count('CURRENT_PROJECT_VERSION = 6;')==2
assert 'versionName "2.10.0"' in android and 'versionCode 6' in android
assert "APP_VERSION = '2.10.0'" in (ROOT/'src/games/car/config.js').read_text(encoding='utf-8')
assert '版本 2.10.0' in (ROOT/'car/index.html').read_text(encoding='utf-8')
guards=[]
for name,start,end in [('scripts/check-mobile.mjs','async function check(','try{\n for'),('scripts/check-reachability.mjs','const result = await page.evaluate','summary.push(')]:
    before=git('show','HEAD:'+name);after=(ROOT/name).read_text(encoding='utf-8').replace('\r\n','\n')
    extract=lambda s:s[s.index(start):s.index(end,s.index(start))]
    assert extract(before)==extract(after),f'Existing size/hit/overflow assertion changed: {name}'
    guards.append({'path':name,'assertion_body_sha256':hashlib.sha256(extract(after).encode()).hexdigest(),'unchanged':True})
scan=subprocess.run(['rg','--hidden','--files-with-matches','-g','!.git/**','-g','!node_modules/**','-g','!dist/**','-g','!dist-native/**','-g','!release/**','-g','!output/**','-g','!.audit-tmp/**','-e',r'sk-proj-[A-Za-z0-9_-]{20}|sk-[a-z0-9]{40}','.'],cwd=ROOT,text=True,encoding='utf-8',capture_output=True)
assert scan.returncode in [0,1],scan.stderr
hits=scan.stdout.splitlines();assert not hits,'Secret signature found; filenames recorded only, content never printed.'
inputs=[{'path':name,'sha256':hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),'staged':bool(git('diff','--cached','--name-only','--',name).strip())} for name in ['docs/art/ART_RESCORE2_MUSE.md','docs/art/ART_RESCORE_MUSE.md']]
assert not any(r['staged'] for r in inputs),'Pre-existing untracked review must remain outside this commit'
report={'status':'VERIFIED','branch':branch,'version':package['version'],'native_build':6,'new_dependencies':0,'new_sdks':0,'existing_tests_modified':False,'guard_assertions':guards,'guard_selector_note':'Dropdown/page controls were replaced with all four map cards, both plane cards, and both more/restore activity states. Existing size, seven hit points, and overflow assertions are byte-identical.','secret_signature_hits':len(hits),'secret_scan_scope':'Project text files; excluded git, dependencies, build/release output and local audit temp. Never accessed the global secrets directory.','preserved_untracked_review_inputs':inputs}
(ROOT/'docs/art/source-audit-r6.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['status','branch','version','new_dependencies','existing_tests_modified','secret_signature_hits']}))
