// Render custom thumbnails: one frozen frame of each finished what-if video (captions off).
//   node scripts/thumbs.mjs list.json   with list.json = [{"job":"sgra","comp":"GalaxyHeart","sec":1.2}, ...]
// Writes ../data/thumbs/<job>.jpg (1080x1920 JPEG, well under YouTube's 2 MB limit).
import { bundle } from '@remotion/bundler';
import { selectComposition, renderStill } from '@remotion/renderer';
import { readFileSync, mkdirSync } from 'fs';
import path from 'path';
const root = process.cwd();
const list = JSON.parse(readFileSync(process.argv[2], 'utf8'));   // [{job, comp, sec}]
const serveUrl = await bundle({ entryPoint: path.join(root, 'src', 'index.ts'), publicDir: path.join(root, '..', 'media') });
const outDir = path.join(root, '..', 'data', 'thumbs'); mkdirSync(outDir, { recursive: true });
for (const t of list) {
  const props = JSON.parse(readFileSync(path.join(root, '..', 'data', 'jobs', t.job, 'props.json'), 'utf8'));
  props.vo = props.vo.map((v) => ({ ...v, text: '', words: [] }));       // no captions on a thumbnail
  const inputProps = { comp: t.comp, props, frame: Math.round(t.sec * 30) };
  const composition = await selectComposition({ serveUrl, id: 'Thumb', inputProps });
  await renderStill({ serveUrl, composition, inputProps, output: path.join(outDir, `${t.job}.jpg`), frame: 0, overwrite: true,
    imageFormat: 'jpeg', jpegQuality: 88, chromiumOptions: { gl: 'angle' } });
  console.log('ok', t.job);
}
