// Avatar Maker BD — headless-Chrome smoke test via raw CDP (no puppeteer dependency).
// Usage: node tests/smoke.js
// Exits non-zero on any failed assertion; fails on page console errors.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 9346;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
let failures = 0;
let count = 0;
const pageErrors = [];
function check(name, cond, extra) {
  count++;
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // NOTE: /opt/meta-chromium/chrome refuses raw launches in this VM
  // ("Hatch WebGL domain policy is required for browser startup" — the
  // policy is normally supplied by browser-daemon). The unpatched
  // Playwright headless_shell serves the same CDP smoke purpose.
  const CHROME_BIN = process.env.CHROME_BIN ||
    require('os').homedir() + '/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell';
  const chrome = spawn(CHROME_BIN, [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/avatar-smoke-' + process.pid,
    'about:blank',
  ], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await wait(200);
    try {
      targets = JSON.parse(await new Promise((res, rej) => {
        http.get('http://127.0.0.1:' + PORT + '/json/list', (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        }).on('error', rej);
      }));
    } catch (e) { /* retry */ }
  }
  if (!targets.length) { console.log('FAIL - chrome did not start'); process.exit(2); }
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => { ws.onopen = res; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push(JSON.stringify(msg.params.args));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    }
  };
  const send = (method, params) => new Promise((res) => {
    const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: FILE });
  await wait(1500);
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) return { error: JSON.stringify(r.result.exceptionDetails).slice(0, 300) };
    return r.result ? r.result.result.value : undefined;
  };

  check('page title contains Avatar', (await ev('document.title'))?.includes('Avatar'));
  check('stage renders an SVG', (await ev(`document.querySelector('#stage svg') !== null`)) === true);
  check('stage svg viewBox 240', (await ev(`document.querySelector('#stage svg').getAttribute('viewBox')`)) === '0 0 240 240');
  check('10 option groups render', (await ev(`document.querySelectorAll('#controls .opt-group').length`)) === 10);
  check('face group has 3 chips', (await ev(`document.querySelector('[data-group="face"].opt-group, section[data-group="face"] .chip').length`)) === 3 ||
    (await ev(`document.querySelectorAll('section[data-group="face"] .chip').length`)) === 3);
  check('skin group has 6 swatches', (await ev(`document.querySelectorAll('section[data-group="skin"] .swatch').length`)) === 6);
  check('hair style group has 7 chips', (await ev(`document.querySelectorAll('section[data-group="hairStyle"] .chip').length`)) === 7);
  check('hair colour group has 6 swatches', (await ev(`document.querySelectorAll('section[data-group="hairColor"] .swatch').length`)) === 6);
  check('eyes group has 5 chips', (await ev(`document.querySelectorAll('section[data-group="eyes"] .chip').length`)) === 5);
  check('mouth group has 5 chips', (await ev(`document.querySelectorAll('section[data-group="mouth"] .chip').length`)) === 5);
  check('glasses group has 4 chips', (await ev(`document.querySelectorAll('section[data-group="glasses"] .chip').length`)) === 4);
  check('accessory group has 4 chips', (await ev(`document.querySelectorAll('section[data-group="accessory"] .chip').length`)) === 4);
  check('shirt group has 8 swatches', (await ev(`document.querySelectorAll('section[data-group="shirt"] .swatch').length`)) === 8);
  check('bg group has 8 swatches', (await ev(`document.querySelectorAll('section[data-group="bg"] .swatch').length`)) === 8);
  check('combo line shows 19353600', (await ev(`document.getElementById('comboLine').textContent`)).includes('19353600'));
  check('test hooks present', (await ev(`typeof window.__avatar.setOption`)) === 'function');
  check('disclaimer renders', (await ev(`document.getElementById('disclaimer').textContent.length`)) > 40);
  check('gallery empty message visible', (await ev(`document.getElementById('galleryEmpty').hidden`)) === false);

  // Option change: oval face -> ellipse in stage SVG.
  const before = await ev(`window.__avatar.svg()`);
  await ev(`window.__avatar.setOption('face', 'oval')`);
  const afterOval = await ev(`window.__avatar.svg()`);
  check('oval face changes svg', before !== afterOval && afterOval.includes('<ellipse cx="120" cy="110"'));
  check('oval selected chip marked', (await ev(`document.querySelector('section[data-group="face"] .chip.selected').dataset.value`)) === 'oval');
  // Glasses + hijab.
  await ev(`window.__avatar.setOption('glasses', 'round')`);
  check('round glasses render', (await ev(`window.__avatar.svg()`)).includes('<circle cx="98" cy="106" r="14"'));
  await ev(`window.__avatar.setOption('accessory', 'hijab')`);
  const hijabSvg = await ev(`window.__avatar.svg()`);
  check('hijab renders, ears hidden', hijabSvg.includes('M120,26 C72,26 56,78') && !hijabSvg.includes('<circle cx="66" cy="110" r="9"'));
  await ev(`window.__avatar.reset()`);
  check('reset restores round face', (await ev(`window.__avatar.state().config.face`)) === 'round');

  // Randomize: at least one field differs from default after up to 3 tries.
  let changed = false;
  for (let i = 0; i < 3 && !changed; i++) {
    const cfgBefore = await ev(`JSON.stringify(window.__avatar.state().config)`);
    await ev(`window.__avatar.randomize()`);
    const cfgAfter = await ev(`JSON.stringify(window.__avatar.state().config)`);
    changed = cfgBefore !== cfgAfter;
  }
  check('randomize changes the avatar', changed);
  await ev(`window.__avatar.reset()`);

  // PNG rasterisation: real PNG data URL from the SVG.
  const png = await ev(`window.__avatar.pngDataUrl()`);
  check('PNG data URL is a real PNG', typeof png === 'string' && png.startsWith('data:image/png;base64,iVBOR'), String(png).slice(0, 60));
  check('PNG data URL is substantial', typeof png === 'string' && png.length > 5000, 'len=' + (png ? png.length : 0));

  // Save flow: empty name rejected, then a named save works and persists.
  await ev(`document.getElementById('avatarName').value = ''`);
  const saveEmpty = await ev(`JSON.stringify(window.__avatar.save())`);
  check('save with empty name rejected', saveEmpty.includes('"ok":false'), saveEmpty);
  check('error toast shows', (await ev(`document.getElementById('toast').hidden`)) === false);
  await ev(`document.getElementById('avatarName').value = 'Fahad'`);
  const saveOk = await ev(`JSON.stringify(window.__avatar.save())`);
  check('save named avatar ok', saveOk.includes('"ok":true'), saveOk);
  check('gallery shows 1 card', (await ev(`document.querySelectorAll('.gcard').length`)) === 1);
  check('gallery card name is Fahad', (await ev(`document.querySelector('.gname').textContent`)) === 'Fahad');
  check('gallery card has mini svg', (await ev(`document.querySelector('.gthumb svg') !== null`)) === true);
  check('empty message hidden', (await ev(`document.getElementById('galleryEmpty').hidden`)) === true);
  const saveDup = await ev(`JSON.stringify(window.__avatar.save())`);
  check('duplicate name rejected', saveDup.includes('"ok":false') && saveDup.includes('nameDup'), saveDup);
  check('still 1 card after duplicate', (await ev(`document.querySelectorAll('.gcard').length`)) === 1);

  // Reload persistence.
  await send('Page.navigate', { url: FILE });
  await wait(1200);
  check('gallery persists after reload', (await ev(`document.querySelectorAll('.gcard').length`)) === 1);
  check('name persists after reload', (await ev(`document.getElementById('avatarName').value`)) === 'Fahad');

  // Load + delete via buttons.
  await ev(`window.__avatar.setOption('face', 'square')`);
  await ev(`document.querySelector('.gcard .btn.small').click()`);
  check('load restores saved face', (await ev(`window.__avatar.state().config.face`)) === 'round');
  await ev(`document.querySelectorAll('.gcard .btn.small.danger')[0].click()`);
  check('delete removes card', (await ev(`document.querySelectorAll('.gcard').length`)) === 0);

  // Export / import round-trip + invalid import.
  await ev(`document.getElementById('avatarName').value = 'Meem'`);
  await ev(`window.__avatar.save()`);
  const payload = await ev(`JSON.stringify(window.__avatar.exportPayload())`);
  check('export payload is avatar-maker-bd v1', payload.includes('"app":"avatar-maker-bd"') && payload.includes('"version":1'));
  await ev(`window.__avatar.eraseAll()`);
  check('eraseAll clears gallery', (await ev(`window.__avatar.state().gallery.length`)) === 0);
  const imp = await ev(`JSON.stringify(window.__avatar.importPayload(JSON.stringify({app:'avatar-maker-bd',version:1,items:[{id:'av-t1',name:'Test',config:JSON.parse(JSON.stringify(window.__avatar.state().config)),savedAt:'2026-11-08T12:00:00.000Z'}]})))`);
  check('import valid payload ok', imp.includes('"ok":true'), imp);
  check('import restores 1 card', (await ev(`document.querySelectorAll('.gcard').length`)) === 1);
  const badImp = await ev(`JSON.stringify(window.__avatar.importPayload('{"app":"dua-bd","version":1,"items":[]}'))`);
  check('import wrong app rejected', badImp.includes('"ok":false'));
  check('invalid import leaves data intact', (await ev(`document.querySelectorAll('.gcard').length`)) === 1);
  await ev(`window.__avatar.eraseAll()`);

  // Language toggle: Bangla title + Bengali digits, persists after reload.
  await ev(`document.getElementById('langBtn').click()`);
  check('BN toggle: page title in Bengali', (await ev(`document.getElementById('title').textContent`)) === 'অ্যাভাটার মেকার বিডি');
  check('BN toggle: combo line uses Bengali digits', (await ev(`document.getElementById('comboLine').textContent`)).match(/[০-৯]/) !== null);
  check('BN toggle: face label in Bengali', (await ev(`document.querySelector('section[data-group="face"] h3').textContent`)) === 'মুখের আকৃতি');
  await send('Page.navigate', { url: FILE });
  await wait(1200);
  check('BN toggle persists after reload', (await ev(`window.__avatar.state().lang`)) === 'bn');
  await ev(`document.getElementById('langBtn').click()`);
  check('back to EN', (await ev(`window.__avatar.state().lang`)) === 'en');

  // Mobile 390px: no horizontal overflow.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: FILE });
  await wait(1200);
  const overflow = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  check('390px no horizontal overflow', overflow <= 0, 'overflow=' + overflow);
  await ev(`window.__avatar.setOption('hairStyle', 'long')`);
  const overflow2 = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  check('390px no overflow after option change', overflow2 <= 0, 'overflow=' + overflow2);

  // Zero network requests: app is fully offline (only file:// loads).
  const reqs = await ev(`performance.getEntriesByType('resource').map(r => r.name).filter(n => !n.startsWith('file://')).length`);
  check('zero non-file network requests', reqs === 0, 'non-file=' + reqs);

  check('no console/page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));

  chrome.kill();
  console.log('\n' + count + ' checks, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.log('FAIL - harness error: ' + e.message); try { chrome.kill(); } catch (_) {} process.exit(2); });
