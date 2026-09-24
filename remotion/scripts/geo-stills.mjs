import { bundle } from '@remotion/bundler';
import { selectComposition, renderStill } from '@remotion/renderer';
import path from 'path';
const root = process.cwd();
const serveUrl = await bundle({ entryPoint: path.join(root, 'src', 'index.ts'), publicDir: path.join(root, '..', 'media') });
const composition = await selectComposition({ serveUrl, id: 'ShortWalkIndiaUsa' });
for (const s of [13, 18, 24, 36, 40]) {
  const frame = Math.round(s * 30);
  await renderStill({ serveUrl, composition, output: path.join(root, 'out', `walk_${s}.png`), frame, scale: 0.5, overwrite: true, imageFormat: 'jpeg' });
  console.log('still', s);
}
