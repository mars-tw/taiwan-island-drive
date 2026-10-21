"""Run every registered test unchanged, quietly, and remove only generated evidence.

Historical UI suites may conflict with the latest UI. Their failures remain in
the report; they are never filtered out or converted to passing results.
"""
import hashlib
import atexit
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import subprocess
import time
import threading
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PROOF = ROOT / 'docs/testflight-validation.json'
ALLOWED = ('docs/content/', 'docs/evidence/', 'docs/store/screenshots/')


def git_names(arguments):
    return {p.replace('\\', '/') for p in subprocess.check_output(
        ['git', *arguments], cwd=ROOT, encoding='utf-8').split('\0') if p}


def main():
    assert Path.cwd().resolve() == ROOT
    assert subprocess.check_output(['git', 'branch', '--show-current'], text=True).strip() == 'r1-fun-polish'
    assert not any(p.startswith(ALLOWED) for p in git_names(['diff', '--name-only', '-z', '--', 'docs'])), 'Preserve existing tracked evidence edits; start only with clean evidence paths'
    original = git_names(['ls-files', '--others', '--exclude-standard', '-z'])
    # Keep existing untracked user evidence in memory only, never backup files.
    existing = {p: (ROOT / p).read_bytes() for p in original
                if p.startswith(ALLOWED) and (ROOT / p).is_file()}
    proof = json.loads(PROOF.read_text(encoding='utf-8'))
    proof.update(silent=True, gpu='software rendering', assertionsChanged=False)
    counters = proof.setdefault('cleanup', {'generatedFilesRemoved': 0, 'testOutputRestores': 0})
    generated = ROOT / 'docs/testflight-generated'
    assert not generated.exists(), 'Refuse to reuse pre-existing generated output'
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass

    # Serve the identical built dist on a task-owned ephemeral loopback port.
    # No separate Vite process or shared fixed port can expire mid-suite.
    preview = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT / 'dist')))
    preview.daemon_threads = True
    preview_thread = threading.Thread(target=preview.serve_forever, daemon=True)
    preview_thread.start()
    base_url = f'http://127.0.0.1:{preview.server_port}/'

    def stop_preview():
        preview.shutdown()
        preview.server_close()
        preview_thread.join(timeout=5)

    atexit.register(stop_preview)
    for _ in range(100):
        assert preview_thread.is_alive(), 'Preview exited before ready'
        try:
            with urllib.request.urlopen(base_url, timeout=2) as response:
                assert response.status == 200
                break
        except OSError:
            time.sleep(.1)
    else:
        raise RuntimeError('Preview did not become ready')

    def cleanup():
        changed = sorted(p for p in git_names(['diff', '--name-only', '-z', '--', 'docs'])
                         if p.startswith(ALLOWED))
        if changed:
            subprocess.run(['git', 'restore', '--worktree', '--', *changed], check=True)
            counters['testOutputRestores'] += len(changed)
        for p in sorted(git_names(['ls-files', '--others', '--exclude-standard', '-z']) - original):
            if not p.startswith(ALLOWED):
                continue
            file = ROOT / p
            assert file.resolve().is_relative_to(ROOT) and not file.is_symlink()
            if file.is_file():
                file.unlink()
                counters['generatedFilesRemoved'] += 1
        for p, data in existing.items():
            file = ROOT / p
            if not file.exists() or hashlib.sha256(file.read_bytes()).digest() != hashlib.sha256(data).digest():
                file.write_bytes(data)
                counters['testOutputRestores'] += 1
        if generated.exists():
            for file in sorted(generated.rglob('*'), key=lambda p: len(p.parts), reverse=True):
                assert file.resolve().is_relative_to(ROOT) and not file.is_symlink()
                if file.is_file():
                    file.unlink()
                    counters['generatedFilesRemoved'] += 1
                elif file.is_dir():
                    file.rmdir()
            generated.rmdir()
        counters['existingUntrackedPreserved'] = True

    def check(name, script, extra=None, regression=False):
        if any(row['name'] == name for row in proof['rows']):
            return
        env = dict(os.environ, BASE_URL=base_url,
                   PLAYWRIGHT_MODULE=str(ROOT / 'scripts' / ('playwright-regression-r35.mjs' if regression else 'playwright-cpu-r34.mjs')),
                   EVIDENCE_FOLDER='docs/testflight-generated', SCREENSHOT_FOLDER='docs/testflight-generated/screens')
        env.update(extra or {})
        begin = time.time()
        assert preview_thread.is_alive(), 'Managed preview exited; stop instead of generating connection failures'
        process = subprocess.run(['node', script], capture_output=True, encoding='utf-8',
                                 errors='replace', env=env, creationflags=subprocess.CREATE_NO_WINDOW)
        output = process.stdout + '\n' + process.stderr
        row = {'name': name, 'exitCode': process.returncode, 'seconds': round(time.time() - begin, 2),
               'outputTail': output[-5000:] if process.returncode else output[-1200:]}
        if name == 'R37 performance':
            artifact = ROOT / 'docs/content/r37/performance/performance.json'
            if artifact.exists():
                row['performanceEvidence'] = json.loads(artifact.read_text(encoding='utf-8'))
        proof['rows'].append(row)
        # Write the outcome before cleanup so cleanup failures cannot lose it.
        PROOF.write_text(json.dumps(proof, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        cleanup()
        PROOF.write_text(json.dumps(proof, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps({k: row[k] for k in ('name', 'exitCode', 'seconds')}, ensure_ascii=False), flush=True)
        if process.returncode:
            print(output[-1200:], flush=True)

    check('test:content:r37', 'scripts/check-content-r37.mjs', {'R37_SCOPE': 'all'})
    for scope in ('layout', 'offline', 'performance', 'switching', 'store'):
        check('R37 ' + scope, 'scripts/check-content-r37.mjs', {'R37_SCOPE': scope})
    check('test:merge', 'scripts/check-merge.mjs', regression=True)
    check('test:store', 'scripts/check-store-review.mjs', regression=True)
    check('check-mobile', 'scripts/check-mobile.mjs', regression=True)
    package = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))
    for name, command in package['scripts'].items():
        if name.startswith('test:'):
            parts = command.split()
            assert len(parts) == 2 and parts[0] == 'node'
            check(name, parts[1])
    proof['allRegisteredTestCommandsExecuted'] = True
    PROOF.write_text(json.dumps(proof, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('ALL REGISTERED TEST COMMANDS EXECUTED', flush=True)
    return int(any(row['exitCode'] != 0 for row in proof['rows']))


if __name__ == '__main__':
    raise SystemExit(main())
