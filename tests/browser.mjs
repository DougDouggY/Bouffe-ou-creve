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
      content = Buffer.concat([content, Buffer.from('\nwindow.__gameTest = { Game: zt, Body: eA, World: XA, overlaps: RA, get active() { return K; } };')]);
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
let checks = 0;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__RealAudio = window.Audio;
    window.__audioCalls = [];
    let blocked = true;
    window.Audio = class extends EventTarget {
      constructor(src) { super(); this.src = src; }
      play() {
        window.__audioCalls.push(this.src);
        if (this.src.endsWith('jingle.m4a') && blocked) {
          blocked = false;
          return Promise.reject(new DOMException('Gesture required', 'NotAllowedError'));
        }
        return Promise.resolve();
      }
      pause() {}
    };
  });
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector('.burger-menu').dataset.masksReady === 'true');
  await page.evaluate(() => document.fonts.ready);
  const idle = await page.screenshot({ path: path.join(output, 'menu-repos.png') });
  await page.addStyleTag({ content: '.ingredient-light { display: none !important; }' });
  const noLights = await page.screenshot();
  assert.deepEqual(idle, noLights, 'Lighting must be invisible at rest');
  await page.evaluate(() => document.querySelector('style:last-of-type').remove());
  checks++;

  async function point(x, y) {
    return page.evaluate(({x,y}) => {
      const p = new DOMPoint(x,y).matrixTransform(document.querySelector('.burger-menu').getScreenCTM());
      return {x:p.x,y:p.y};
    }, {x,y});
  }
  const ingredients = [
    ['trophies-entry',768,160,'#trophies-dialog','#close-trophies'],
    ['somalia',768,355,'#map-screen','#back-title'],
    ['classic',768,478,'#map-screen','#back-title'],
    ['gros',768,570,'#map-screen','#back-title'],
    ['menu-shop',768,700,'#shop-dialog','#close-shop'],
    ['options-entry',768,855,'#options-dialog','#close-options'],
  ];
  for (const [id,x,y,opened,close] of ingredients) {
    const p = await point(x,y);
    await page.mouse.move(p.x,p.y);
    await page.waitForTimeout(350);
    assert.equal(await page.locator('.ingredient-button.is-hovered').getAttribute('data-ingredient'),id);
    if (id === 'gros' || id === 'somalia' || id === 'trophies-entry') {
      await page.screenshot({ path: path.join(output, `menu-${id}.png`) });
    }
    await page.waitForFunction(id=>{
      const node=document.querySelector(`[data-ingredient="${id}"] .ingredient-surface`);
      return Number(getComputedStyle(node).opacity)===1;
    },id);
    const animation = await page.locator(`[data-ingredient="${id}"]`).evaluate(group => ({
      opacity: Number(getComputedStyle(group.querySelector('.ingredient-surface')).opacity),
      transform: getComputedStyle(group.querySelector('.ingredient-texture')).transform,
      masked: group.querySelector('.ingredient-surface').getAttribute('mask'),
    }));
    assert.equal(animation.opacity,1);
    assert.notEqual(animation.transform,'matrix(1, 0, 0, 1, 0, 0)');
    assert.equal(animation.masked,`url(#alpha-${id})`);
    await page.mouse.click(p.x,p.y);
    assert.equal(await page.locator(`[data-ingredient="${id}"]`).evaluate(group => getComputedStyle(group.querySelector('.ingredient-texture')).animationName),'ingredient-press');
    await page.locator(opened).waitFor({state:'visible'});
    assert(await page.locator(opened).isVisible(),id+' opens its destination');
    if (opened === '#map-screen') assert.equal(await page.locator('#map-mode-title').textContent(), id === 'somalia' ? 'SOMALIE · 50 AFFAMÉS' : id === 'gros' ? 'ÉTATS-UNIS · 24 AFFAMÉS' : 'CLASSIQUE · 8 AFFAMÉS');
    await page.locator(close).click();
    checks++;
  }
  const bg = await point(100,500);
  await page.mouse.click(bg.x,bg.y);
  assert(await page.locator('#title-screen').isVisible());
  assert.equal(await page.locator('dialog[open]').count(),0);
  checks++;

  // Keyboard activates semantic buttons even though mouse picking uses pixel alpha.
  await page.locator('#trophies-entry').focus();
  await page.keyboard.press('Enter');
  await page.locator('#trophies-dialog').waitFor({state:'visible'});
  assert(await page.locator('#trophies-dialog').isVisible());
  await page.locator('#close-trophies').click();
  assert.equal(await page.evaluate(() => window.__audioCalls.filter(src => src.endsWith('jingle.m4a')).length),2);
  checks++;

  // Map curation must apply to both the gallery and the in-game selector.
  const classicMenuPoint = await point(768,478);
  await page.mouse.click(classicMenuPoint.x,classicMenuPoint.y);
  await page.locator("#map-screen").waitFor({state:"visible"});
  for (const id of ['sushi','cinema','gym','space','candy','train']) {
    assert.equal(await page.locator(`[data-map="${id}"], #map-select option[value="${id}"]`).count(),0);
  }
  const catalog = await page.evaluate(async()=>{
    const {WORK_IN_PROGRESS_MAPS}=await import('/map-catalog.js');
    return [...WORK_IN_PROGRESS_MAPS];
  });
  assert.equal(catalog.length,14);
  assert.deepEqual((await page.locator('#maps-in-progress .map-card').evaluateAll(cards=>cards.map(card=>card.dataset.map))).sort(),catalog.sort());
  assert.equal(await page.locator('#map-select optgroup[label="En travaux · cartes de test"] option').count(),14);
  for(const id of ['cold','pirate'])assert(await page.locator(`#maps-available [data-map="${id}"]`).isVisible());
  checks++;
  await page.locator('#maps-in-progress').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(output,'cartes-en-travaux.png')});
  await page.locator('#map-search').fill('miroir');
  assert(await page.locator('#maps-available').isHidden());
  assert(await page.locator('#maps-in-progress').isVisible());
  assert.equal(await page.locator('#map-gallery .map-card:visible').count(),1);
  await page.locator('[data-map="mirror"]').click();
  assert((await page.locator('#menu-map-description').textContent()).includes('pas encore validée'));
  await page.locator('#start-game').click();
  assert.equal(await page.evaluate(()=>window.__gameTest.active.mapId),'mirror');
  assert((await page.locator('#briefing-title').textContent()).includes('En travaux'));
  checks++;
  await page.locator('#back-menu').click();
  const nightMenuPoint=await point(768,478);
  await page.mouse.click(nightMenuPoint.x,nightMenuPoint.y);
  await page.locator('[data-map="nightmarket"]').click();
  await page.locator('#start-game').click();
  assert.equal(await page.evaluate(()=>window.__gameTest.active.mapId),'nightmarket');
  await page.locator('#close-briefing').click();
  await page.screenshot({path:path.join(output,'supermarche-nocturne.png')});
  await page.locator('#back-menu').click();
  await page.mouse.click((await point(768,355)).x,(await point(768,355)).y);
  await page.locator('#map-screen').waitFor({state:'visible'});
  assert(await page.locator('#maps-in-progress').isHidden());
  assert.equal(await page.locator('#map-gallery .map-card:visible').count(),1);
  assert(await page.locator('[data-map="savanna"]').isVisible());
  await page.locator('#back-title').click();
  checks++;

  // Sample real raster output to catch cone regressions, abrupt edges and a misplaced halo.
  const halo = await page.evaluate(async()=>{
    const {drawMarketFog}=await import('/visibility.js');
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1200;
    const context=canvas.getContext('2d',{willReadFrequently:true});
    const player={body:{position:{x:600,y:600},circleRadius:19},heading:0};
    const game={mapId:'nightmarket',w:1200,h:1200,people:[player],obstacles:[]};
    function draw(){context.fillStyle='white';context.fillRect(0,0,1200,1200);drawMarketFog(context,game);}
    draw();
    const pixel=(x,y)=>context.getImageData(x,y,1,1).data[0];
    const radial=[0,25,60,90,120,150,159,161,210].map(distance=>pixel(600+distance,600));
    const directions=[[700,600],[499,600],[600,700],[600,499]].map(([x,y])=>pixel(x,y));
    const before=canvas.toDataURL();player.heading=Math.PI;draw();
    const stable=before===canvas.toDataURL();
    player.body.position={x:300,y:300};draw();
    const follows= pixel(300,300)>250 && pixel(900,900)<30;
    drawMarketFog(context,{...game,people:[{...player,body:{...player.body,position:{x:900,y:900}}}]});
    return {radial,directions,stable,follows,png:before.split(',')[1]};
  });
  assert(halo.radial[0]>250);
  for(let i=1;i<halo.radial.length;i++)assert(halo.radial[i]<=halo.radial[i-1]);
  assert(halo.radial.at(-1)<30);
  assert(halo.directions[0]>60 && halo.directions[0]<250);
  assert(Math.max(...halo.directions)-Math.min(...halo.directions)<=2);
  assert(Math.abs(halo.radial[6]-halo.radial[7])<=2,'No hard rim at the halo edge');
  assert(halo.stable && halo.follows);
  await writeFile(path.join(output,'halo-nocturne.png'),Buffer.from(halo.png,'base64'));
  checks++;

  // Real Chromium decoding validates both uploaded AAC/M4A files independently of the audio spy.
  const decoded = await page.evaluate(async () => {
    const context = new AudioContext();
    const result = [];
    for (const file of ['jingle.m4a','bruitage-gourmand.m4a','ambiance-douce.mp3']) {
      const data = await (await fetch('/assets/'+file)).arrayBuffer();
      const buffer = await context.decodeAudioData(data);
      result.push(buffer.duration);
    }
    await context.close();
    return result;
  });
  assert(decoded[0] > 1 && decoded[1] > .2 && decoded[2] > 20);
  checks++;

  const shelves = await page.evaluate(() => {
    const {Game,Body,World,overlaps} = window.__gameTest;
    const results = [];
    for (const mapId of ['market','nightmarket']) {
      for (const mass of [349,350,400,500,2000]) {
        let seed=12345;
        const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
        const game=new Game(1000,560,random,{mapId,count:1,chef:true});
        const player=game.people[0];
        const original=game.obstacles[0], body=game.obstacleBodies[0];
        const events=[];game.onEvent=(...args)=>events.push(args);
        Body.setPosition(player.body,{x:original.x,y:original.y});
        game.resize(player,mass);
        const removed=!game.obstacles.includes(original);
        const physicalRemoved=!World.allBodies(game.engine.world).includes(body);
        const gain=events.filter(e=>e[0]==='shelf').length*15;
        const allClear=!game.obstacles.some(shelf=>overlaps(player.body.position,player.body.circleRadius,shelf));
        results.push({mapId,mass,removed,physicalRemoved,gain,actual:player.mass,allClear});
        if(mass>=350){
          const before={...player.body.position};
          game.launch({x:12,y:0});
          for(let i=0;i<30;i++)game.step(1000/60);
          results[results.length-1].distance=Math.hypot(player.body.position.x-before.x,player.body.position.y-before.y);
        }
        game.destroy();
      }
    }
    return results;
  });
  for(const result of shelves){
    assert.equal(result.removed,result.mass>=350,JSON.stringify(result));
    assert.equal(result.physicalRemoved,result.removed);
    assert.equal(result.actual,result.mass+result.gain);
    assert(result.allClear,JSON.stringify(result));
    if(result.mass>=350)assert(result.distance>10,JSON.stringify(result));
    checks++;
  }
  console.log('Shelf engine scenarios:',JSON.stringify(shelves));

  // Actual UI-started game uses the player-only sound predicate, including death.
  const classic=await point(768,478);await page.mouse.click(classic.x,classic.y);
  await page.locator('[data-map="cantine"]').click();
  await page.locator('#start-game').click();
  await page.waitForFunction(()=>!!window.__gameTest.active);
  const audio = await page.evaluate(()=>{
    const game=window.__gameTest.active;
    const before=window.__audioCalls.filter(src=>src.endsWith('bruitage-gourmand.m4a')).length;
    const food={type:'burger',size:'normal'};
    game.emit('food',game.people[1],food);
    game.emit('eat',game.people[1],game.people[2]);
    const afterAI=window.__audioCalls.filter(src=>src.endsWith('bruitage-gourmand.m4a')).length;
    game.emit('food',game.people[0],food);
    game.emit('fondue',game.people[0]);
    game.emit('eat',game.people[0],game.people[2]);
    game.eat(game.people[1],game.people[0]);
    const afterPlayer=window.__audioCalls.filter(src=>src.endsWith('bruitage-gourmand.m4a')).length;
    return {before,afterAI,afterPlayer};
  });
  assert.equal(audio.afterAI,audio.before);
  assert.equal(audio.afterPlayer-audio.afterAI,4);
  checks++;
  await page.locator('#sound').click();
  const muted = await page.evaluate(()=>{
    const before=window.__audioCalls.length;
    window.__gameTest.active.emit('fondue',window.__gameTest.active.people[0]);
    return window.__audioCalls.length===before;
  });
  assert(muted);checks++;
  await page.locator('#back-menu').click();
  assert.equal(await page.evaluate(()=>window.__audioCalls.filter(src=>src.endsWith('jingle.m4a')).length),2);
  checks++;
  assert.deepEqual(errors,[]);
  await page.close();

  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  mobile.on('pageerror',error=>errors.push(error.message));
  await mobile.goto(url);
  await mobile.waitForFunction(()=>document.querySelector('.burger-menu').dataset.masksReady==='true');
  const mobilePoint=await mobile.evaluate(()=>{const p=new DOMPoint(768,478).matrixTransform(document.querySelector('.burger-menu').getScreenCTM());return {x:p.x,y:p.y};});
  await mobile.screenshot({path:path.join(output,'menu-mobile.png')});
  await mobile.touchscreen.tap(mobilePoint.x,mobilePoint.y);
  await mobile.locator('#map-screen').waitFor({state:'visible'});
  assert(await mobile.locator('#map-screen').isVisible());
  checks++;
  await mobile.locator('#back-title').click();
  await mobile.emulateMedia({reducedMotion:'reduce'});
  const motion=await mobile.evaluate(()=>{
    const g=document.querySelector('[data-menu-mode="classic"]');g.classList.add('is-hovered');
    return getComputedStyle(g.querySelector('.ingredient-reflection')).animationName;
  });
  assert.equal(motion,'none');
  const textureMotion=await mobile.locator('[data-menu-mode="classic"] .ingredient-texture').evaluate(node=>({animation:getComputedStyle(node).animationName,transform:getComputedStyle(node).transform}));
  assert.equal(textureMotion.animation,'none');assert.equal(textureMotion.transform,'none');checks++;
  assert.deepEqual(errors,[]);
  await mobile.close();
  const musicContext=await browser.newContext({viewport:{width:390,height:844}});
  const musicPage=await musicContext.newPage();
  musicPage.on('pageerror',error=>errors.push(error.message));
  await musicPage.addInitScript(()=>{
    const OriginalAudio=window.Audio;
    window.__musicVoices=[];
    window.Audio=class extends OriginalAudio {
      constructor(src){super(src);if(src.endsWith('ambiance-douce.mp3'))window.__musicVoices.push(this);}
    };
  });
  async function openMusicOptions(){
    await musicPage.waitForFunction(()=>document.querySelector('.burger-menu').dataset.masksReady==='true');
    await musicPage.locator('#options-entry').focus();
    await musicPage.keyboard.press('Enter');
    await musicPage.locator('#options-dialog').waitFor({state:'visible'});
  }
  await musicPage.goto(url);
  await openMusicOptions();
  assert.equal(await musicPage.locator('#music-enabled').isChecked(),false);
  await musicPage.locator('#music-enabled').check();
  await musicPage.waitForFunction(()=>window.__musicVoices[0]?.currentTime>0.1);
  const playing=await musicPage.evaluate(()=>{const a=window.__musicVoices[0];return {loop:a.loop,volume:a.volume,paused:a.paused};});
  assert(playing.loop && !playing.paused);assert.equal(playing.volume,.25);
  checks++;
  await musicPage.locator('#music-volume').focus();
  await musicPage.keyboard.press('End');
  assert.equal(await musicPage.locator('#music-volume-value').textContent(),'100 %');
  assert.equal(await musicPage.evaluate(()=>window.__musicVoices[0].volume),1);
  await musicPage.keyboard.press('Home');
  assert(await musicPage.evaluate(()=>window.__musicVoices[0].paused));
  for(let i=0;i<30;i++)await musicPage.keyboard.press('ArrowRight');
  assert.equal(await musicPage.locator('#music-volume-value').textContent(),'30 %');
  assert.equal(await musicPage.evaluate(()=>window.__musicVoices[0].volume),.3);
  await musicPage.locator('#option-sound').click();
  assert(await musicPage.evaluate(()=>window.__musicVoices[0].paused));
  assert.equal(await musicPage.locator('#music-status').textContent(),'Le son général est coupé.');
  await musicPage.locator('#option-sound').click();
  await musicPage.waitForFunction(()=>!window.__musicVoices[0].paused);
  await musicPage.screenshot({path:path.join(output,'options-musique-mobile.png')});
  checks++;
  await musicPage.reload();
  await openMusicOptions();
  assert(await musicPage.locator('#music-enabled').isChecked());
  assert.equal(await musicPage.locator('#music-volume').inputValue(),'30');
  assert.equal(await musicPage.evaluate(()=>window.__musicVoices[0].volume),.3);
  await musicPage.locator('#music-enabled').uncheck();
  assert(await musicPage.evaluate(()=>window.__musicVoices[0].paused));
  await musicPage.reload();await openMusicOptions();
  assert.equal(await musicPage.locator('#music-enabled').isChecked(),false);
  checks++;
  assert.deepEqual(errors,[]);
  await musicContext.close();
  console.log(`${checks} browser checks passed. Screenshots: test-results/`);
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
