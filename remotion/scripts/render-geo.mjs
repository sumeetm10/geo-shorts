// Render one data-driven composition.
//   node scripts/render-geo.mjs <CompositionId> <props.json> <out.mp4>
//
// The props file carries everything the video needs, including its length:
// durationInSeconds overrides the composition's placeholder, so one registered
// template renders routes of any length.
import { bundle } from '@remotion/bundler';
import { selectComposition, renderMedia } from '@remotion/renderer';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [id, propsFile, out] = process.argv.slice(2);
if (!id || !propsFile || !out) {
  console.error('usage: node scripts/render-geo.mjs <CompositionId> <props.json> <out.mp4>');
  process.exit(2);
}

const inputProps = JSON.parse(readFileSync(propsFile, 'utf8'));
mkdirSync(path.dirname(path.resolve(out)), { recursive: true });

console.log('bundling...');
const serveUrl = await bundle({
  entryPoint: path.join(root, 'src', 'index.ts'),
  publicDir: path.join(root, '..', 'media'),
});
const base = await selectComposition({ serveUrl, id, inputProps });
const fps = base.fps;
const composition = {
  ...base,
  durationInFrames: Math.max(1, Math.round((inputProps.durationInSeconds ?? base.durationInFrames / fps) * fps)),
};

let last = -1;
await renderMedia({
  serveUrl,
  composition,
  codec: 'h264',
  outputLocation: path.resolve(out),
  inputProps,
  onProgress: ({ progress }) => {
    const pct = Math.floor(progress * 10) * 10;
    if (pct !== last) {
      last = pct;
      console.log(`  ${id}: ${pct}%`);
    }
  },
});
console.log(`done -> ${out}`);
