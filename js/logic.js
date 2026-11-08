// Avatar Maker BD — pure logic (no DOM). Testable with node.
// Builds a deterministic flat-style SVG avatar from a config object.
(function (root) {
  'use strict';

  var SKINS = ['#ffe0bd', '#f5c99b', '#e8ac7a', '#c98d5f', '#a06b42', '#7c4a21'];
  var HAIR_COLORS = ['#1f2937', '#4b2e1e', '#b45309', '#d6a419', '#dc2626', '#6b7280'];
  var SHIRTS = ['#0e7490', '#e0654f', '#4d7c0f', '#7c3aed', '#1e3a5f', '#d97706', '#db2777', '#334155'];
  var BACKGROUNDS = ['#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#ede9fe', '#ffedd5', '#cffafe', '#f1f5f9'];

  var FACES = ['round', 'oval', 'square'];
  var HAIR_STYLES = ['short', 'curly', 'long', 'buzz', 'bun', 'spiky', 'bald'];
  var EYE_STYLES = ['round', 'happy', 'wink', 'sleepy', 'star'];
  var MOUTHS = ['smile', 'grin', 'flat', 'open', 'tongue'];
  var GLASSES = ['none', 'round', 'square', 'sunglasses'];
  var ACCESSORIES = ['none', 'cap', 'hijab', 'headband'];

  function defaultConfig() {
    return {
      face: 'round', skin: SKINS[0], hairStyle: 'short', hairColor: HAIR_COLORS[0],
      eyes: 'round', mouth: 'smile', glasses: 'none', accessory: 'none',
      shirt: SHIRTS[0], bg: BACKGROUNDS[0], name: ''
    };
  }

  function shade(hex, amt) {
    // amt in [-255,255]; lighten (+) / darken (-) a #rrggbb colour.
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
    var b = Math.max(0, Math.min(255, (n & 0xff) + amt));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  function starPoints(cx, cy, rO, rI, points) {
    points = points || 5;
    var out = [];
    for (var i = 0; i < points * 2; i++) {
      var r = i % 2 === 0 ? rO : rI;
      var a = (Math.PI * i) / points - Math.PI / 2;
      out.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return out.join(' ');
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hairBack(cfg) {
    // Long hair drawn behind the face; hijab drawn behind the face too.
    if (cfg.accessory === 'hijab') {
      return '<path d="M120,26 C72,26 56,78 56,122 C56,178 64,240 64,240 L176,240 C176,240 184,178 184,122 C184,78 168,26 120,26 Z" fill="' + cfg.shirt + '"/>';
    }
    if (cfg.hairStyle === 'long') {
      return '<path d="M120,28 C75,28 60,75 60,120 L60,240 L180,240 L180,120 C180,75 165,28 120,28 Z" fill="' + cfg.hairColor + '"/>';
    }
    return '';
  }

  function faceShape(cfg) {
    if (cfg.face === 'oval') return '<ellipse cx="120" cy="110" rx="50" ry="58" fill="' + cfg.skin + '"/>';
    if (cfg.face === 'square') return '<rect x="68" y="56" width="104" height="104" rx="24" fill="' + cfg.skin + '"/>';
    return '<circle cx="120" cy="108" r="56" fill="' + cfg.skin + '"/>';
  }

  function hairFront(cfg) {
    if (cfg.accessory === 'hijab') return '';
    var c = cfg.hairColor;
    switch (cfg.hairStyle) {
      case 'short':
        return '<path d="M66,102 Q62,48 120,48 Q178,48 174,102 Q168,64 120,64 Q72,64 66,102 Z" fill="' + c + '"/>';
      case 'curly':
        return '<rect x="72" y="70" width="96" height="12" fill="' + c + '"/>' +
          '<circle cx="82" cy="74" r="15" fill="' + c + '"/><circle cx="104" cy="62" r="16" fill="' + c + '"/>' +
          '<circle cx="136" cy="62" r="16" fill="' + c + '"/><circle cx="158" cy="74" r="15" fill="' + c + '"/>';
      case 'long':
        return '<path d="M68,100 Q66,50 120,50 Q174,50 172,100 Q160,66 120,66 Q80,66 68,100 Z" fill="' + c + '"/>';
      case 'buzz':
        return '<path fill-rule="evenodd" d="M68,102 Q64,46 120,46 Q176,46 172,102 Q166,68 120,68 Q74,68 68,102 Z M82,102 Q86,74 120,74 Q154,74 158,102 Z" fill="' + c + '"/>';
      case 'bun':
        return '<circle cx="120" cy="44" r="13" fill="' + c + '"/>' +
          '<path d="M66,102 Q62,48 120,48 Q178,48 174,102 Q168,64 120,64 Q72,64 66,102 Z" fill="' + c + '"/>';
      case 'spiky':
        return '<path d="M72,100 L82,52 L96,76 L108,44 L120,72 L132,44 L144,76 L158,52 L168,100 L72,100 Z" fill="' + c + '"/>';
      default: // bald
        return '';
    }
  }

  function accessoryFront(cfg) {
    if (cfg.accessory === 'cap') {
      return '<path d="M68,90 Q64,44 120,44 Q176,44 172,90 Q120,66 68,90 Z" fill="' + cfg.shirt + '"/>' +
        '<rect x="60" y="88" width="120" height="9" rx="4.5" fill="' + shade(cfg.shirt, -25) + '"/>';
    }
    if (cfg.accessory === 'headband') {
      return '<path d="M70,84 Q120,60 170,84 L170,74 Q120,50 70,74 Z" fill="' + cfg.shirt + '"/>';
    }
    return '';
  }

  function eyesSvg(cfg) {
    var dark = '#222222';
    switch (cfg.eyes) {
      case 'happy':
        return '<path d="M91,107 Q98,99 105,107" stroke="' + dark + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
          '<path d="M135,107 Q142,99 149,107" stroke="' + dark + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
      case 'wink':
        return '<circle cx="98" cy="106" r="6.5" fill="' + dark + '"/>' +
          '<path d="M135,107 Q142,99 149,107" stroke="' + dark + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
      case 'sleepy':
        return '<path d="M91,106 L105,106" stroke="' + dark + '" stroke-width="3.5" stroke-linecap="round"/>' +
          '<path d="M135,106 L149,106" stroke="' + dark + '" stroke-width="3.5" stroke-linecap="round"/>';
      case 'star':
        return '<polygon points="' + starPoints(98, 106, 9, 4) + '" fill="#f59e0b"/>' +
          '<polygon points="' + starPoints(142, 106, 9, 4) + '" fill="#f59e0b"/>';
      default:
        return '<circle cx="98" cy="106" r="6.5" fill="' + dark + '"/>' +
          '<circle cx="142" cy="106" r="6.5" fill="' + dark + '"/>';
    }
  }

  function mouthSvg(cfg) {
    var dark = '#5b2333';
    switch (cfg.mouth) {
      case 'grin':
        return '<path d="M104,138 Q120,156 136,138 Q120,146 104,138 Z" fill="#7f1d1d"/>';
      case 'flat':
        return '<path d="M108,142 L132,142" stroke="' + dark + '" stroke-width="3.5" stroke-linecap="round"/>';
      case 'open':
        return '<ellipse cx="120" cy="144" rx="9" ry="7" fill="#7f1d1d"/>';
      case 'tongue':
        return '<path d="M105,139 Q120,151 135,139" stroke="' + dark + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
          '<ellipse cx="120" cy="151" rx="6" ry="4.5" fill="#f472b6"/>';
      default:
        return '<path d="M105,139 Q120,151 135,139" stroke="' + dark + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
    }
  }

  function glassesSvg(cfg) {
    var dark = '#1f2937';
    if (cfg.glasses === 'round') {
      return '<circle cx="98" cy="106" r="14" fill="rgba(255,255,255,0.12)" stroke="' + dark + '" stroke-width="3"/>' +
        '<circle cx="142" cy="106" r="14" fill="rgba(255,255,255,0.12)" stroke="' + dark + '" stroke-width="3"/>' +
        '<path d="M112,106 L128,106 M84,104 L68,100 M156,104 L172,100" stroke="' + dark + '" stroke-width="3" fill="none"/>';
    }
    if (cfg.glasses === 'square') {
      return '<rect x="84" y="92" width="28" height="28" rx="6" fill="rgba(255,255,255,0.12)" stroke="' + dark + '" stroke-width="3"/>' +
        '<rect x="128" y="92" width="28" height="28" rx="6" fill="rgba(255,255,255,0.12)" stroke="' + dark + '" stroke-width="3"/>' +
        '<path d="M112,106 L128,106 M84,104 L68,100 M156,104 L172,100" stroke="' + dark + '" stroke-width="3" fill="none"/>';
    }
    if (cfg.glasses === 'sunglasses') {
      return '<rect x="82" y="94" width="32" height="22" rx="9" fill="#111827"/>' +
        '<rect x="126" y="94" width="32" height="22" rx="9" fill="#111827"/>' +
        '<path d="M114,103 L126,103 M82,102 L68,98 M158,102 L172,98" stroke="#111827" stroke-width="3" fill="none"/>';
    }
    return '';
  }

  function buildAvatarSvg(cfg) {
    var c = Object.assign(defaultConfig(), cfg || {});
    var nose = shade(c.skin, -45);
    var parts = [];
    parts.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" role="img" aria-label="Avatar">');
    parts.push('<rect x="0" y="0" width="240" height="240" fill="' + c.bg + '"/>');
    parts.push(hairBack(c));
    parts.push('<path d="M52,240 L52,208 Q52,190 70,188 L170,188 Q188,190 188,208 L188,240 Z" fill="' + c.shirt + '"/>');
    parts.push('<rect x="106" y="158" width="28" height="34" fill="' + shade(c.skin, -12) + '"/>');
    if (c.accessory !== 'hijab') {
      parts.push('<circle cx="66" cy="110" r="9" fill="' + c.skin + '"/><circle cx="174" cy="110" r="9" fill="' + c.skin + '"/>');
    }
    parts.push(faceShape(c));
    parts.push(hairFront(c));
    parts.push(accessoryFront(c));
    parts.push('<path d="M90,90 Q98,85 106,90" stroke="#333333" stroke-width="3" fill="none" stroke-linecap="round"/>');
    parts.push('<path d="M134,90 Q142,85 150,90" stroke="#333333" stroke-width="3" fill="none" stroke-linecap="round"/>');
    parts.push(eyesSvg(c));
    parts.push('<path d="M120,114 Q124,122 118,124" stroke="' + nose + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>');
    parts.push(mouthSvg(c));
    parts.push(glassesSvg(c));
    parts.push('</svg>');
    return parts.join('');
  }

  function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }

  function randomConfig(rng) {
    rng = rng || Math.random;
    return {
      face: pick(FACES, rng), skin: pick(SKINS, rng),
      hairStyle: pick(HAIR_STYLES, rng), hairColor: pick(HAIR_COLORS, rng),
      eyes: pick(EYE_STYLES, rng), mouth: pick(MOUTHS, rng),
      glasses: pick(GLASSES, rng), accessory: pick(ACCESSORIES, rng),
      shirt: pick(SHIRTS, rng), bg: pick(BACKGROUNDS, rng), name: ''
    };
  }

  function validateConfig(obj) {
    var errors = [];
    if (!obj || typeof obj !== 'object') return { ok: false, errors: ['notObject'] };
    if (FACES.indexOf(obj.face) < 0) errors.push('face');
    if (SKINS.indexOf(obj.skin) < 0) errors.push('skin');
    if (HAIR_STYLES.indexOf(obj.hairStyle) < 0) errors.push('hairStyle');
    if (HAIR_COLORS.indexOf(obj.hairColor) < 0) errors.push('hairColor');
    if (EYE_STYLES.indexOf(obj.eyes) < 0) errors.push('eyes');
    if (MOUTHS.indexOf(obj.mouth) < 0) errors.push('mouth');
    if (GLASSES.indexOf(obj.glasses) < 0) errors.push('glasses');
    if (ACCESSORIES.indexOf(obj.accessory) < 0) errors.push('accessory');
    if (SHIRTS.indexOf(obj.shirt) < 0) errors.push('shirt');
    if (BACKGROUNDS.indexOf(obj.bg) < 0) errors.push('bg');
    if (obj.name !== undefined && (typeof obj.name !== 'string' || obj.name.length > 30)) errors.push('name');
    return { ok: errors.length === 0, errors: errors };
  }

  function validateName(name) {
    if (typeof name !== 'string') return { ok: false, error: 'nameType' };
    var t = name.trim();
    if (t.length === 0) return { ok: false, error: 'nameEmpty' };
    if (t.length > 30) return { ok: false, error: 'nameLong' };
    return { ok: true, value: t };
  }

  // Gallery payload: {app, version, items:[{id, name, config, savedAt}]}
  function validateGalleryPayload(payload) {
    if (!payload || payload.app !== 'avatar-maker-bd' || payload.version !== 1) {
      return { ok: false, error: 'badApp' };
    }
    if (!Array.isArray(payload.items)) return { ok: false, error: 'badItems' };
    if (payload.items.length > 12) return { ok: false, error: 'tooMany' };
    for (var i = 0; i < payload.items.length; i++) {
      var it = payload.items[i];
      if (!it || typeof it.id !== 'string' || typeof it.name !== 'string' || !validateConfig(it.config).ok) {
        return { ok: false, error: 'badItem' };
      }
    }
    return { ok: true };
  }

  var BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  function toBnDigits(value) {
    return String(value).replace(/[0-9]/g, function (d) { return BN_DIGITS[+d]; });
  }

  var api = {
    SKINS: SKINS, HAIR_COLORS: HAIR_COLORS, SHIRTS: SHIRTS, BACKGROUNDS: BACKGROUNDS,
    FACES: FACES, HAIR_STYLES: HAIR_STYLES, EYE_STYLES: EYE_STYLES, MOUTHS: MOUTHS,
    GLASSES: GLASSES, ACCESSORIES: ACCESSORIES,
    defaultConfig: defaultConfig, buildAvatarSvg: buildAvatarSvg,
    randomConfig: randomConfig, validateConfig: validateConfig,
    validateName: validateName, validateGalleryPayload: validateGalleryPayload,
    shade: shade, starPoints: starPoints, esc: esc, toBnDigits: toBnDigits
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.AvatarLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
