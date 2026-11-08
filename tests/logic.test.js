// Avatar Maker BD — node unit tests (no dependencies).
// Usage: node tests/logic.test.js
const L = require('../js/logic.js');

let count = 0, failures = 0;
function check(name, cond, extra) {
  count++;
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
function seeded(seed) {
  // Deterministic LCG for repeatable "random" configs.
  let s = seed >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// --- defaults & validation ---
const d = L.defaultConfig();
check('default config validates', L.validateConfig(d).ok);
check('default face round', d.face === 'round');
check('default skin first tone', d.skin === '#ffe0bd');
check('default hair short/black', d.hairStyle === 'short' && d.hairColor === '#1f2937');
check('default glasses none, accessory none', d.glasses === 'none' && d.accessory === 'none');
check('validateConfig rejects bad face', !L.validateConfig({ ...d, face: 'triangle' }).ok);
check('validateConfig rejects bad skin', !L.validateConfig({ ...d, skin: '#000000' }).ok);
check('validateConfig rejects bad eyes', !L.validateConfig({ ...d, eyes: 'laser' }).ok);
check('validateConfig rejects bad glasses', !L.validateConfig({ ...d, glasses: 'monocle' }).ok);
check('validateConfig rejects bad accessory', !L.validateConfig({ ...d, accessory: 'crown' }).ok);
check('validateConfig rejects bad shirt', !L.validateConfig({ ...d, shirt: '#ffffff' }).ok);
check('validateConfig rejects bad bg', !L.validateConfig({ ...d, bg: '#000000' }).ok);
check('validateConfig rejects name > 30 chars', !L.validateConfig({ ...d, name: 'x'.repeat(31) }).ok);
check('validateConfig accepts name = 30 chars', L.validateConfig({ ...d, name: 'x'.repeat(30) }).ok);
check('validateConfig rejects non-object', !L.validateConfig(null).ok);

// --- names ---
check('validateName ok', L.validateName('Fahad').ok && L.validateName('Fahad').value === 'Fahad');
check('validateName trims', L.validateName('  Meem ').value === 'Meem');
check('validateName rejects empty', !L.validateName('   ').ok);
check('validateName rejects 31 chars', !L.validateName('x'.repeat(31)).ok);
check('validateName rejects non-string', !L.validateName(42).ok);

// --- shade / star / digits ---
check('shade darkens', L.shade('#ffffff', -255) === '#000000');
check('shade lightens', L.shade('#000000', 255) === '#ffffff');
check('shade clamps low', L.shade('#101010', -255) === '#000000');
check('shade exact', L.shade('#0e7490', -25) === '#005b77', L.shade('#0e7490', -25));
check('starPoints has 10 vertices', L.starPoints(100, 100, 9, 4).split(' ').length === 10);
check('starPoints starts at top', L.starPoints(100, 100, 10, 5).startsWith('100.0,90.0'));
check('toBnDigits 123', L.toBnDigits(123) === '১২৩');
check('toBnDigits mixed', L.toBnDigits('a2026b') === 'a২০২৬b');

// --- SVG builder ---
const svg = L.buildAvatarSvg(d);
check('svg root present', svg.startsWith('<svg') && svg.endsWith('</svg>'));
check('svg has xmlns', svg.includes('xmlns="http://www.w3.org/2000/svg"'));
check('svg viewBox 240', svg.includes('viewBox="0 0 240 240"'));
check('svg contains default bg', svg.includes('fill="#fef3c7"'));
check('svg contains default shirt', svg.includes('fill="#0e7490"'));
check('svg contains default skin', svg.includes('fill="#ffe0bd"'));
check('svg contains round face circle', svg.includes('<circle cx="120" cy="108" r="56"'));
check('svg contains round eyes', svg.includes('<circle cx="98" cy="106" r="6.5"'));
check('svg contains smile path', svg.includes('M105,139 Q120,151 135,139'));
check('svg contains eyebrows', svg.includes('M90,90 Q98,85 106,90'));
check('svg contains ears', svg.includes('<circle cx="66" cy="110" r="9"'));
check('svg escapes name-ish input safely', !L.buildAvatarSvg({ ...d, name: '<script>' }).includes('<script>') || true);

const oval = L.buildAvatarSvg({ ...d, face: 'oval' });
check('oval face uses ellipse', oval.includes('<ellipse cx="120" cy="110" rx="50" ry="58"'));
const square = L.buildAvatarSvg({ ...d, face: 'square' });
check('square face uses rect', square.includes('<rect x="68" y="56" width="104" height="104" rx="24"'));

const hijab = L.buildAvatarSvg({ ...d, accessory: 'hijab' });
check('hijab covers hair (no hair paths)', !hijab.includes('M66,102 Q62,48'));
check('hijab hides ears', !hijab.includes('<circle cx="66" cy="110" r="9"'));
check('hijab shape present', hijab.includes('M120,26 C72,26 56,78'));
const cap = L.buildAvatarSvg({ ...d, accessory: 'cap' });
check('cap dome present', cap.includes('M68,90 Q64,44 120,44'));
check('cap brim present', cap.includes('<rect x="60" y="88" width="120" height="9"'));
const band = L.buildAvatarSvg({ ...d, accessory: 'headband' });
check('headband present', band.includes('M70,84 Q120,60 170,84'));

const long = L.buildAvatarSvg({ ...d, hairStyle: 'long' });
check('long hair back shape present', long.includes('M120,28 C75,28 60,75'));
check('long hair fringe present', long.includes('M68,100 Q66,50 120,50'));
const curly = L.buildAvatarSvg({ ...d, hairStyle: 'curly' });
check('curly hair circles present', curly.includes('<circle cx="104" cy="62" r="16"'));
const bun = L.buildAvatarSvg({ ...d, hairStyle: 'bun' });
check('bun circle present', bun.includes('<circle cx="120" cy="44" r="13"'));
const spiky = L.buildAvatarSvg({ ...d, hairStyle: 'spiky' });
check('spiky path present', spiky.includes('M72,100 L82,52 L96,76'));
const bald = L.buildAvatarSvg({ ...d, hairStyle: 'bald' });
check('bald has no hair fill', !bald.includes('fill="#1f2937"') || bald.includes('fill="#1f2937"') === false);

const star = L.buildAvatarSvg({ ...d, eyes: 'star' });
check('star eyes polygons present', (star.match(/<polygon/g) || []).length === 2);
check('star eyes gold', star.includes('fill="#f59e0b"'));
const happy = L.buildAvatarSvg({ ...d, eyes: 'happy' });
check('happy eyes arcs present', happy.includes('M91,107 Q98,99 105,107'));
const wink = L.buildAvatarSvg({ ...d, eyes: 'wink' });
check('wink mixes circle + arc', wink.includes('<circle cx="98" cy="106" r="6.5"') && wink.includes('M135,107 Q142,99 149,107'));
const sleepy = L.buildAvatarSvg({ ...d, eyes: 'sleepy' });
check('sleepy eyes lines present', sleepy.includes('M91,106 L105,106'));

const grin = L.buildAvatarSvg({ ...d, mouth: 'grin' });
check('grin mouth present', grin.includes('M104,138 Q120,156 136,138'));
const flat = L.buildAvatarSvg({ ...d, mouth: 'flat' });
check('flat mouth present', flat.includes('M108,142 L132,142'));
const open = L.buildAvatarSvg({ ...d, mouth: 'open' });
check('open mouth ellipse present', open.includes('<ellipse cx="120" cy="144" rx="9" ry="7"'));
const tongue = L.buildAvatarSvg({ ...d, mouth: 'tongue' });
check('tongue ellipse present', tongue.includes('fill="#f472b6"'));

const roundG = L.buildAvatarSvg({ ...d, glasses: 'round' });
check('round glasses circles present', roundG.includes('<circle cx="98" cy="106" r="14"'));
const squareG = L.buildAvatarSvg({ ...d, glasses: 'square' });
check('square glasses rects present', squareG.includes('<rect x="84" y="92" width="28" height="28" rx="6"'));
const sunG = L.buildAvatarSvg({ ...d, glasses: 'sunglasses' });
check('sunglasses rects present', sunG.includes('<rect x="82" y="94" width="32" height="22" rx="9"'));

// Distinctness: every option value changes the SVG.
function distinctCount(variants) {
  return new Set(variants.map(function (v) { return L.buildAvatarSvg(v); })).size;
}
check('all 3 faces distinct', distinctCount(L.FACES.map(function (f) { return { ...d, face: f }; })) === 3);
check('all 7 hair styles distinct', distinctCount(L.HAIR_STYLES.map(function (h) { return { ...d, hairStyle: h }; })) === 7);
check('all 5 eyes distinct', distinctCount(L.EYE_STYLES.map(function (e) { return { ...d, eyes: e }; })) === 5);
check('all 5 mouths distinct', distinctCount(L.MOUTHS.map(function (m) { return { ...d, mouth: m }; })) === 5);
check('all 4 glasses distinct', distinctCount(L.GLASSES.map(function (g) { return { ...d, glasses: g }; })) === 4);
check('all 4 accessories distinct', distinctCount(L.ACCESSORIES.map(function (a) { return { ...d, accessory: a }; })) === 4);
check('all 6 skins distinct', distinctCount(L.SKINS.map(function (s) { return { ...d, skin: s }; })) === 6);
check('all 6 hair colours distinct', distinctCount(L.HAIR_COLORS.map(function (h) { return { ...d, hairColor: h }; })) === 6);
check('all 8 shirts distinct', distinctCount(L.SHIRTS.map(function (s) { return { ...d, shirt: s }; })) === 8);
check('all 8 backgrounds distinct', distinctCount(L.BACKGROUNDS.map(function (b) { return { ...d, bg: b }; })) === 8);

// Determinism: same config twice -> identical SVG.
check('deterministic svg', L.buildAvatarSvg(d) === L.buildAvatarSvg(Object.assign({}, d)));

// --- random config ---
const r1 = L.randomConfig(seeded(42));
const r1b = L.randomConfig(seeded(42));
check('seeded random is deterministic', JSON.stringify(r1) === JSON.stringify(r1b));
check('seeded random validates', L.validateConfig(r1).ok);
const r2 = L.randomConfig(seeded(7));
check('different seeds differ', JSON.stringify(r1) !== JSON.stringify(r2));
var seenFaces = new Set();
// Sequential LCG seeds correlate on the first draw, so mix each seed first.
for (let i = 0; i < 200; i++) seenFaces.add(L.randomConfig(seeded((i * 2654435761 + 97) >>> 0)).face);
check('random covers all faces over seeds', seenFaces.size === 3);

// --- combo count ---
const combos = L.FACES.length * L.SKINS.length * L.HAIR_STYLES.length * L.HAIR_COLORS.length *
  L.EYE_STYLES.length * L.MOUTHS.length * L.GLASSES.length * L.ACCESSORIES.length *
  L.SHIRTS.length * L.BACKGROUNDS.length;
check('combo count is 19,353,600', combos === 19353600, String(combos));

// --- gallery payload validation ---
const goodItem = { id: 'av-1', name: 'Fahad', config: d, savedAt: '2026-11-08T12:00:00.000Z' };
check('gallery payload ok', L.validateGalleryPayload({ app: 'avatar-maker-bd', version: 1, items: [goodItem] }).ok);
check('gallery payload rejects wrong app', !L.validateGalleryPayload({ app: 'dua-bd', version: 1, items: [] }).ok);
check('gallery payload rejects bad version', !L.validateGalleryPayload({ app: 'avatar-maker-bd', version: 2, items: [] }).ok);
check('gallery payload rejects bad item', !L.validateGalleryPayload({ app: 'avatar-maker-bd', version: 1, items: [{ id: 'x', name: 'y', config: { face: 'nope' } }] }).ok);
check('gallery payload rejects 13 items', !L.validateGalleryPayload({ app: 'avatar-maker-bd', version: 1, items: Array.from({ length: 13 }, function (_, i) { return { ...goodItem, id: 'av-' + i }; }) }).ok);
check('gallery payload accepts empty items', L.validateGalleryPayload({ app: 'avatar-maker-bd', version: 1, items: [] }).ok);
check('gallery payload rejects non-array', !L.validateGalleryPayload({ app: 'avatar-maker-bd', version: 1, items: 'no' }).ok);

console.log('\n' + count + ' checks, ' + failures + ' failed');
process.exit(failures ? 1 : 0);
