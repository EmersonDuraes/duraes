/* Troca de imagens direto no app: Menu > "Trocar imagens".
   As fotos escolhidas ficam salvas neste aparelho/navegador. */
(function () {
  'use strict';
  var SLOTS = [
    { id: 'fundo',          nome: 'Fundo do app',            css: '.stage',              v: '--fundo-app', thumb: '' },
    { id: 'civil',          nome: 'Direito Civil',           css: '.art-civil',          v: '--img', thumb: 'art-civil' },
    { id: 'trabalhista',    nome: 'Direito Trabalhista',     css: '.art-trabalhista',    v: '--img', thumb: 'art-trabalhista' },
    { id: 'previdenciario', nome: 'Direito Previdenciário',  css: '.art-previdenciario', v: '--img', thumb: 'art-previdenciario' },
    { id: 'familia',        nome: 'Família e Sucessões',     css: '.art-familia',        v: '--img', thumb: 'art-familia' },
    { id: 'empresarial',    nome: 'Direito Empresarial',     css: '.art-empresarial',    v: '--img', thumb: 'art-empresarial' }
  ];
  var DB = 'ed-imagens', ST = 'fotos', mem = {}, styleEl;

  /* ---- armazenamento (IndexedDB, com plano B em localStorage) ---- */
  function abrir(cb) {
    try {
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(ST); };
      r.onsuccess = function () { cb(r.result); };
      r.onerror = function () { cb(null); };
    } catch (e) { cb(null); }
  }
  function ler(cb) {
    abrir(function (db) {
      if (!db) {
        try { cb(JSON.parse(localStorage.getItem(DB) || '{}')); } catch (e) { cb({}); }
        return;
      }
      var out = {}, req = db.transaction(ST).objectStore(ST).openCursor();
      req.onsuccess = function () {
        var c = req.result;
        if (c) { out[c.key] = c.value; c['continue'](); } else cb(out);
      };
      req.onerror = function () { cb({}); };
    });
  }
  function gravar(id, val, cb) {
    abrir(function (db) {
      if (!db) {
        try {
          var o = JSON.parse(localStorage.getItem(DB) || '{}');
          if (val) o[id] = val; else delete o[id];
          localStorage.setItem(DB, JSON.stringify(o)); cb(true);
        } catch (e) { cb(false); }
        return;
      }
      var tx = db.transaction(ST, 'readwrite'), s = tx.objectStore(ST);
      if (val) s.put(val, id); else s['delete'](id);
      tx.oncomplete = function () { cb(true); };
      tx.onerror = function () { cb(false); };
    });
  }

  /* ---- aplicar as fotos escolhidas ---- */
  function aplicar() {
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'imagens-usuario'; document.head.appendChild(styleEl); }
    var css = '';
    SLOTS.forEach(function (s) { if (mem[s.id]) css += s.css + '{' + s.v + ':url("' + mem[s.id] + '")}\n'; });
    styleEl.textContent = css;
  }

  /* ---- reduzir a foto antes de salvar ---- */
  function reduzir(file, max, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.round(w * k); c.height = Math.round(h * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = function () { cb(null); };
      img.src = fr.result;
    };
    fr.onerror = function () { cb(null); };
    fr.readAsDataURL(file);
  }

  /* ---- painel ---- */
  var painel;
  function montar() {
    painel = document.createElement('div');
    painel.setAttribute('role', 'dialog'); painel.setAttribute('aria-label', 'Trocar imagens');
    painel.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;z-index:99999;background:#f6f6f3;color:#0a0a0a;overflow:auto;padding:20px 18px 40px;display:none;font-family:inherit';
    document.body.appendChild(painel);
  }
  function msg(t) { var m = painel.querySelector('[data-msg]'); if (m) m.textContent = t; }
  function desenhar() {
    var h = '<div style="max-width:520px;margin:0 auto">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
      '<b style="font-size:18px;text-transform:uppercase;letter-spacing:.06em">Trocar imagens</b>' +
      '<button data-fechar style="font-size:15px;border:1.5px solid #0a0a0a;border-radius:12px;padding:10px 16px;min-height:44px">Fechar</button></div>' +
      '<p style="font-size:14px;line-height:1.5;margin:8px 0 18px">Toque em “Escolher foto”, selecione a imagem do seu celular ou computador e pronto. As fotos ficam salvas neste aparelho.</p>' +
      '<p data-msg style="font-size:14px;min-height:20px;margin:0 0 10px"></p>';
    SLOTS.forEach(function (s) {
      var tem = !!mem[s.id];
      var bg = tem ? 'background:url(' + JSON.stringify(mem[s.id]).slice(1, -1) + ') center/cover' : '';
      h += '<div style="display:flex;gap:12px;align-items:center;padding:12px 0;border-top:1px solid rgba(10,10,10,.14)">' +
        '<div class="art ' + s.thumb + '" style="width:64px;height:64px;border-radius:12px;flex:none;' + bg + '"></div>' +
        '<div style="flex:1;min-width:0"><div style="font-size:16px;font-weight:700">' + s.nome + '</div>' +
        '<div style="font-size:12px;color:#6d6d69">' + (tem ? 'Foto personalizada' : 'Imagem original') + '</div></div>' +
        '<label style="font-size:14px;border:1.5px solid #0a0a0a;border-radius:12px;padding:10px 12px;min-height:44px;display:flex;align-items:center;cursor:pointer">Escolher foto' +
        '<input type="file" accept="image/*" data-slot="' + s.id + '" style="position:absolute;width:1px;height:1px;opacity:0"></label>' +
        (tem ? '<button data-rest="' + s.id + '" style="font-size:13px;text-decoration:underline;min-height:44px;padding:0 4px">Restaurar</button>' : '') +
        '</div>';
    });
    painel.innerHTML = h + '</div>';
  }
  function abrirPainel() { if (!painel) montar(); desenhar(); painel.style.display = 'block'; document.body.style.overflow = 'hidden'; }
  function fechar() { painel.style.display = 'none'; document.body.style.overflow = ''; }

  function ligar() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest && t.closest('[data-trocar-imagens]')) {
        var m = document.querySelector('.menu'); if (m) { m.className = 'menu'; m.setAttribute('aria-hidden', 'true'); }
        abrirPainel(); return;
      }
      if (painel && t.hasAttribute && t.hasAttribute('data-fechar')) fechar();
      if (painel && t.getAttribute && t.getAttribute('data-rest')) {
        var id = t.getAttribute('data-rest');
        gravar(id, null, function () { delete mem[id]; aplicar(); desenhar(); msg('Imagem original restaurada.'); });
      }
    });
    document.addEventListener('change', function (e) {
      var inp = e.target, id = inp.getAttribute && inp.getAttribute('data-slot');
      if (!id || !inp.files || !inp.files[0]) return;
      msg('Salvando…');
      reduzir(inp.files[0], id === 'fundo' ? 1800 : 1400, function (data) {
        if (!data) { msg('Não foi possível abrir esse arquivo. Escolha uma foto JPG ou PNG.'); return; }
        gravar(id, data, function (ok) {
          if (!ok) { msg('Não foi possível salvar (espaço cheio). Tente uma foto menor.'); return; }
          mem[id] = data; aplicar(); desenhar(); msg('Foto trocada com sucesso.');
        });
      });
    });
  }

  function botaoMenu() {
    var m = document.querySelector('.menu');
    if (!m || m.querySelector('[data-trocar-imagens]')) return;
    var b = document.createElement('button');
    b.setAttribute('data-trocar-imagens', ''); b.textContent = 'Trocar imagens';
    b.style.cssText = 'margin-top:12px;width:100%;min-height:48px;border:1.5px solid rgba(255,255,255,.4);border-radius:14px;color:#fff;font-size:13px;letter-spacing:.08em;text-transform:uppercase';
    var tip = m.querySelector('.menu-tip');
    m.insertBefore(b, tip || null);
  }

  function iniciar() { ligar(); botaoMenu(); ler(function (o) { mem = o || {}; aplicar(); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
