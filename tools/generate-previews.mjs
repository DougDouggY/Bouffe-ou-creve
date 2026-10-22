import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = path.join(root, 'test-results');
await mkdir(output, { recursive: true });
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.webp': 'image/webp', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg' };
const server = createServer(async (request, response) => {
  try {
    const relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const filename = path.resolve(root, '.' + (relative === '/' ? '/index.html' : relative));
    if (!filename.startsWith(root + path.sep)) throw new Error('Invalid path');
    let content = await readFile(filename);
    if (filename === path.join(root, 'game.js')) {
      // Test-only access to the actual running engine, never included in the app.
      content = Buffer.concat([content, Buffer.from('\nwindow.__gameTest = { Game: zt, Body: eA, World: XA, overlaps: RA, renderFloor:dt,catalog:CA,get active() { return K; } };')]);
    }
    response.writeHead(200, { 'content-type': types[path.extname(filename)] || 'application/octet-stream' });
    response.end(content);
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
  headless: true,
  args: ['--no-sandbox'],
});
try {
const page=await browser.newPage({viewport:{width:1000,height:800}});await page.goto(url);await page.waitForFunction(()=>window.__gameTest);
await mkdir(path.join(root,'assets/previews'),{recursive:true});
for(const id of ['cantine','cuisine','foodcourt','cold','pirate']){
 const data=await page.evaluate(async id=>{const {Game,renderFloor,catalog}=window.__gameTest;const game=new Game(1900,1400,Math.random,{mapId:id});const canvas=document.createElement('canvas');canvas.width=950;canvas.height=700;const ctx=canvas.getContext('2d');ctx.scale(.5,.5);renderFloor(ctx,game,catalog[id],0);await new Promise(r=>setTimeout(r,300));renderFloor(ctx,game,catalog[id],0);game.destroy();return canvas.toDataURL('image/webp',.94).split(',')[1];},id);
 await writeFile(path.join(root,'assets/previews',id+'.webp'),Buffer.from(data,'base64'));
}
}finally{await browser.close();await new Promise(r=>server.close(r));}
