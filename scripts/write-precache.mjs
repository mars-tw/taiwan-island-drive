import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const build = join(project, 'dist');
const precache = [];

async function collect(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.isSymbolicLink()) continue;
    if (item.name === 'downloads') continue;
    const file = join(directory, item.name);
    if (item.isDirectory()) await collect(file);
    else if (item.isFile()) {
      const name = relative(build, file).split(sep).join('/');
      if (name === 'sw.js' || name === 'precache.json' || name.endsWith('.map')) continue;
      if (/\.(?:html|js|css|json|txt|webmanifest|svg|png|jpe?g|webp|glb|woff2?|mp3|ogg|wav)$/i.test(name)) {
        precache.push(`./${name}`);
      }
    }
  }
}

await collect(build);
if (!precache.includes('./index.html')) throw new Error('Build index.html is missing. Run vite build first.');
precache.sort();
await writeFile(join(build, 'precache.json'), JSON.stringify(precache, null, 2) + '\n', 'utf8');
// A model can change without its URL changing. Make the worker itself change
// whenever a precached file changes, so browsers install a fresh asset set.
const hash = createHash('sha256');
for (const entry of precache) {
  hash.update(entry);
  hash.update(await readFile(join(build, entry.slice(2))));
}
const workerPath = join(build, 'sw.js');
const worker = (await readFile(workerPath, 'utf8')).replace(/\n\/\* build-content-hash: [a-f0-9]+ \*\/\s*$/, '');
await writeFile(workerPath, `${worker.trimEnd()}\n/* build-content-hash: ${hash.digest('hex')} */\n`, 'utf8');
console.log(`PWA precache manifest: ${precache.length} local files.`);
