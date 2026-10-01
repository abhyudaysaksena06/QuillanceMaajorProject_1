import archiver from 'archiver';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const name = 'Abhyuday_Saksena_MajorProject_FullStackDevelopment';
const out = path.join(here, `${name}.zip`);

const tracked = execSync('git ls-files', { cwd: root }).toString().split('\n').filter(Boolean)
  .filter((f) => !f.startsWith('submission/') && fs.existsSync(path.join(root, f)));

const screenshots = fs.readdirSync(path.join(here, 'Screenshots')).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
const video = fs.readdirSync(here).find((f) => /\.(mp4|mov|webm|mkv)$/i.test(f));

const output = fs.createWriteStream(out);
const zip = archiver('zip', { zlib: { level: 9 } });
zip.pipe(output);
for (const f of tracked) zip.file(path.join(root, f), { name: `${name}/${f}` });
zip.file(path.join(here, 'LearnSphere_LMS_Documentation.pdf'), { name: `${name}/LearnSphere_LMS_Documentation.pdf` });
for (const s of screenshots) zip.file(path.join(here, 'Screenshots', s), { name: `${name}/Screenshots/${s}` });
if (video) zip.file(path.join(here, video), { name: `${name}/Demo Video${path.extname(video)}` });
await zip.finalize();
await new Promise((r) => output.on('close', r));

console.log(`Created ${path.relative(root, out)} (${(zip.pointer() / 1024 / 1024).toFixed(2)} MB)`);
console.log(`  source files: ${tracked.length}`);
console.log(`  screenshots:  ${screenshots.length}${screenshots.length ? '' : '  <- add PNGs to submission/Screenshots/'}`);
console.log(`  demo video:   ${video || 'missing  <- put your .mp4 in submission/'}`);
