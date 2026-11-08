// Avatar Maker BD — app wiring (DOM + storage + downloads).
(function () {
  'use strict';
  var L = window.AvatarLogic;
  var DATA = window.AvatarData;
  var I18N = window.AvatarI18n.STRINGS;
  var STORE_KEY = 'avatar-maker-bd-v1';
  var LANG_KEY = 'avatar-maker-bd-lang';
  var MAX_GALLERY = 12;

  var state = {
    lang: 'en',
    config: L.defaultConfig(),
    gallery: [] // [{id, name, config, savedAt}]
  };

  function $(id) { return document.getElementById(id); }
  function t(key) { return I18N[state.lang][key] || I18N.en[key] || key; }
  function num(n) { return state.lang === 'bn' ? L.toBnDigits(n) : String(n); }

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && L.validateConfig(data.config).ok) state.config = data.config;
      if (data && Array.isArray(data.gallery)) {
        state.gallery = data.gallery.filter(function (it) {
          return it && typeof it.id === 'string' && typeof it.name === 'string' && L.validateConfig(it.config).ok;
        }).slice(0, MAX_GALLERY);
      }
    } catch (e) { /* corrupted storage: start fresh */ }
    try {
      var lang = localStorage.getItem(LANG_KEY);
      if (lang === 'bn' || lang === 'en') state.lang = lang;
    } catch (e) { /* ignore */ }
  }

  function saveStore() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ config: state.config, gallery: state.gallery }));
      localStorage.setItem(LANG_KEY, state.lang);
    } catch (e) { /* storage unavailable: session-only */ }
  }

  function comboCount() {
    return L.FACES.length * L.SKINS.length * L.HAIR_STYLES.length * L.HAIR_COLORS.length *
      L.EYE_STYLES.length * L.MOUTHS.length * L.GLASSES.length * L.ACCESSORIES.length *
      L.SHIRTS.length * L.BACKGROUNDS.length;
  }

  function renderStage() {
    $('stage').innerHTML = L.buildAvatarSvg(state.config);
  }

  function buildControls() {
    var wrap = $('controls');
    wrap.innerHTML = '';
    DATA.OPTION_GROUPS.forEach(function (group) {
      var section = document.createElement('section');
      section.className = 'opt-group';
      section.dataset.group = group.key;
      var h = document.createElement('h3');
      h.dataset.i18n = group.key;
      h.textContent = t(group.key);
      section.appendChild(h);
      var row = document.createElement('div');
      row.className = group.type === 'swatch' ? 'swatches' : 'chips';
      if (group.type === 'swatch') {
        group.values.forEach(function (value, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'swatch';
          b.style.background = value;
          b.dataset.group = group.key;
          b.dataset.value = value;
          b.title = group.labels[i][state.lang] || group.labels[i].en;
          b.setAttribute('aria-label', group.labels[i].en);
          b.addEventListener('click', function () { setOption(group.key, value); });
          row.appendChild(b);
        });
      } else {
        group.options.forEach(function (opt) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'chip';
          b.dataset.group = group.key;
          b.dataset.value = opt.id;
          b.textContent = opt[state.lang] || opt.en;
          b.addEventListener('click', function () { setOption(group.key, opt.id); });
          row.appendChild(b);
        });
      }
      section.appendChild(row);
      wrap.appendChild(section);
    });
    markSelected();
  }

  function markSelected() {
    document.querySelectorAll('#controls [data-group]').forEach(function (el) {
      var key = el.dataset.group;
      el.classList.toggle('selected', String(state.config[key]) === el.dataset.value);
    });
  }

  function setOption(key, value) {
    var cfg = Object.assign({}, state.config);
    cfg[key] = value;
    if (!L.validateConfig(cfg).ok) return false;
    state.config = cfg;
    renderStage();
    markSelected();
    saveStore();
    return true;
  }

  function randomize() {
    var name = state.config.name;
    state.config = L.randomConfig();
    state.config.name = name;
    renderStage();
    markSelected();
    saveStore();
  }

  function resetAll() {
    var name = state.config.name;
    state.config = L.defaultConfig();
    state.config.name = name;
    renderStage();
    markSelected();
    saveStore();
  }

  function renderGallery() {
    var wrap = $('galleryGrid');
    var empty = $('galleryEmpty');
    wrap.innerHTML = '';
    empty.hidden = state.gallery.length !== 0;
    $('galleryCount').textContent = num(state.gallery.length) + ' ' + t('savedCount');
    state.gallery.forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'gcard';
      card.dataset.id = item.id;
      var thumb = document.createElement('div');
      thumb.className = 'gthumb';
      thumb.innerHTML = L.buildAvatarSvg(item.config);
      card.appendChild(thumb);
      var name = document.createElement('div');
      name.className = 'gname';
      name.textContent = item.name;
      card.appendChild(name);
      var actions = document.createElement('div');
      actions.className = 'gactions';
      var loadBtn = document.createElement('button');
      loadBtn.type = 'button';
      loadBtn.className = 'btn small';
      loadBtn.textContent = t('load');
      loadBtn.addEventListener('click', function () { loadFromGallery(item.id); });
      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn small danger';
      delBtn.textContent = t('del');
      delBtn.addEventListener('click', function () { deleteFromGallery(item.id); });
      actions.appendChild(loadBtn);
      actions.appendChild(delBtn);
      card.appendChild(actions);
      wrap.appendChild(card);
    });
  }

  function saveToGallery() {
    var name = $('avatarName').value;
    var v = L.validateName(name);
    if (!v.ok) {
      toast(v.error === 'nameLong' ? t('nameLong') : t('nameEmpty'), true);
      return { ok: false, error: v.error };
    }
    if (state.gallery.length >= MAX_GALLERY) {
      toast(t('galleryFull'), true);
      return { ok: false, error: 'galleryFull' };
    }
    if (state.gallery.some(function (it) { return it.name.toLowerCase() === v.value.toLowerCase(); })) {
      toast(t('nameDup'), true);
      return { ok: false, error: 'nameDup' };
    }
    state.config.name = v.value; // keep the name with the live config so it persists
    var item = {
      id: 'av-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36),
      name: v.value,
      config: Object.assign({}, state.config, { name: v.value }),
      savedAt: new Date().toISOString()
    };
    state.gallery.unshift(item);
    saveStore();
    renderGallery();
    toast(t('saved'));
    return { ok: true, id: item.id };
  }

  function loadFromGallery(id) {
    var item = state.gallery.find(function (it) { return it.id === id; });
    if (!item) return false;
    state.config = Object.assign({}, item.config);
    $('avatarName').value = item.name;
    renderStage();
    markSelected();
    saveStore();
    toast(t('loaded'));
    return true;
  }

  function deleteFromGallery(id) {
    state.gallery = state.gallery.filter(function (it) { return it.id !== id; });
    saveStore();
    renderGallery();
    toast(t('deleted'));
    return true;
  }

  function exportPayload() {
    return { app: 'avatar-maker-bd', version: 1, items: state.gallery };
  }

  function importPayload(text) {
    var data;
    try { data = JSON.parse(text); } catch (e) { return { ok: false, error: 'badJson' }; }
    var v = L.validateGalleryPayload(data);
    if (!v.ok) return { ok: false, error: v.error };
    state.gallery = data.items.slice(0, MAX_GALLERY);
    saveStore();
    renderGallery();
    return { ok: true, count: state.gallery.length };
  }

  function eraseAll() {
    state.gallery = [];
    saveStore();
    renderGallery();
  }

  function download(filename, href) {
    var a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function downloadSvg() {
    var svg = L.buildAvatarSvg(state.config);
    var blob = new Blob([svg], { type: 'image/svg+xml' });
    var url = URL.createObjectURL(blob);
    download((state.config.name || 'avatar').replace(/[^\w\-]+/g, '-').toLowerCase() + '.svg', url);
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    toast(t('downloadReady'));
  }

  function svgToPngDataUrl(size) {
    return new Promise(function (resolve, reject) {
      var svg = L.buildAvatarSvg(state.config);
      var blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        try {
          var canvas = document.createElement('canvas');
          canvas.width = size; canvas.height = size;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, size, size);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) { reject(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('svg-image-load')); };
      img.src = url;
    });
  }

  function downloadPng() {
    svgToPngDataUrl(480).then(function (dataUrl) {
      download((state.config.name || 'avatar').replace(/[^\w\-]+/g, '-').toLowerCase() + '.png', dataUrl);
      toast(t('downloadReady'));
    }).catch(function () { toast(t('copyFail'), true); });
  }

  function copySvg() {
    var svg = L.buildAvatarSvg(state.config);
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = svg;
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      toast(ok ? t('copied') : t('copyFail'), !ok);
      return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(svg).then(function () { toast(t('copied')); }, fallback);
    } else { fallback(); }
  }

  var toastTimer = null;
  function toast(msg, isError) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.toggle('error', !!isError);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  function applyLang() {
    document.documentElement.lang = state.lang === 'bn' ? 'bn' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.placeholder = t(el.dataset.i18nPh);
    });
    $('langBtn').textContent = state.lang === 'bn' ? 'English' : 'বাংলা';
    $('comboLine').textContent = num(comboCount()) + ' ' + t('combos');
    buildControls();
    renderGallery();
    saveStore();
  }

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'bn') return false;
    state.lang = lang;
    applyLang();
    return true;
  }

  function init() {
    loadStore();
    $('avatarName').value = state.config.name || '';
    $('avatarName').addEventListener('input', function () {
      state.config.name = $('avatarName').value;
      saveStore();
    });
    renderStage();
    buildControls();
    renderGallery();
    $('randomBtn').addEventListener('click', randomize);
    $('resetBtn').addEventListener('click', resetAll);
    $('saveBtn').addEventListener('click', saveToGallery);
    $('pngBtn').addEventListener('click', downloadPng);
    $('svgBtn').addEventListener('click', downloadSvg);
    $('copyBtn').addEventListener('click', copySvg);
    $('langBtn').addEventListener('click', function () { setLang(state.lang === 'bn' ? 'en' : 'bn'); });
    $('exportBtn').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      download('avatar-maker-gallery.json', url);
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    });
    $('importBtn').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var r = importPayload(String(reader.result || ''));
        toast(r.ok ? t('importOk') : t('importBad'), !r.ok);
      };
      reader.readAsText(file);
      e.target.value = '';
    });
    $('eraseBtn').addEventListener('click', function () {
      var ans = window.prompt(t('eraseConfirm'), '');
      if (ans === 'DELETE') { eraseAll(); toast(t('eraseDone')); }
    });
    applyLang();
  }

  document.addEventListener('DOMContentLoaded', init);

  // Test hooks (used by tests/smoke.js only).
  window.__avatar = {
    state: function () { return { lang: state.lang, config: Object.assign({}, state.config), gallery: state.gallery.slice() }; },
    setOption: setOption, randomize: randomize, reset: resetAll,
    save: saveToGallery, load: loadFromGallery, del: deleteFromGallery,
    exportPayload: exportPayload, importPayload: importPayload, eraseAll: eraseAll,
    setLang: setLang, svg: function () { return L.buildAvatarSvg(state.config); },
    pngDataUrl: function () { return svgToPngDataUrl(240); },
    comboCount: comboCount
  };
})();
