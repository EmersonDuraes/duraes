/* Emerson Durães — Advocacia · comportamento do app (JavaScript simples, compatível com celulares antigos) */
(function () {
  'use strict';

  /* ===== CONFIGURAÇÃO — edite aqui ===== */
  var SITE = {
    whatsapp: '5500000000000',          // DDI + DDD + número, só dígitos (ex.: 5511999999999)
    telefone: '5500000000000',          // idem, para o botão "ligar"
    email: 'contato@seudominio.com.br'
  };

  var PAGES = [
    ['Início', 'index.html'],
    ['O Escritório', 'sobre.html'],
    ['Áreas de Atuação', 'areas.html'],
    ['Direito Civil', 'direito-civil.html'],
    ['Direito Trabalhista', 'direito-trabalhista.html'],
    ['Direito Previdenciário', 'direito-previdenciario.html'],
    ['Família e Sucessões', 'direito-de-familia.html'],
    ['Direito Empresarial', 'direito-empresarial.html'],
    ['Contato', 'contato.html']
  ];

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function ok(n) { return /^\d{10,15}$/.test(n) && !/0{8,}/.test(n); }
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var app = $('.app');

  /* ===== links de ação rápida (WhatsApp / ligar / e-mail) ===== */
  $$('[data-act]').forEach(function (a) {
    var t = a.getAttribute('data-act');
    if (t === 'wa') a.href = ok(SITE.whatsapp) ? 'https://wa.me/' + SITE.whatsapp : 'contato.html#form';
    if (t === 'tel') a.href = ok(SITE.telefone) ? 'tel:+' + SITE.telefone : 'contato.html#form';
    if (t === 'mail') a.href = 'mailto:' + SITE.email;
    if (t === 'wa' && ok(SITE.whatsapp)) { a.target = '_blank'; a.rel = 'noopener'; }
  });

  /* ===== data e relógio ===== */
  var WD = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
  var MM = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function tick() {
    var d = new Date();
    $$('[data-wd]').forEach(function (e) { e.textContent = WD[d.getDay()]; });
    $$('[data-dd]').forEach(function (e) { e.textContent = two(d.getDate()); });
    $$('[data-mm]').forEach(function (e) { e.textContent = MM[d.getMonth()]; });
    $$('[data-clock]').forEach(function (e) { e.textContent = two(d.getHours()) + ':' + two(d.getMinutes()); });
  }
  tick(); setInterval(tick, 15000);

  /* ===== toast ===== */
  var toast = document.createElement('div');
  toast.className = 'toast'; toast.setAttribute('role', 'status');
  (app || document.body).appendChild(toast);
  var tt;
  function say(m) {
    toast.textContent = m; toast.className = 'toast show';
    clearTimeout(tt); tt = setTimeout(function () { toast.className = 'toast'; }, 2400);
  }

  /* ===== menu ===== */
  var menu = document.createElement('div');
  menu.className = 'menu'; menu.setAttribute('aria-hidden', 'true');
  var items = '';
  for (var i = 0; i < PAGES.length; i++) {
    items += '<li><a href="' + PAGES[i][1] + '"><small>' + two(i + 1) + '</small>' + PAGES[i][0] + '</a></li>';
  }
  menu.innerHTML =
    '<div class="menu-top"><span>Menu</span><button class="round" data-close aria-label="Fechar menu">' +
    '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l12 12M15 3 3 15"/></svg></button></div>' +
    '<ul>' + items + '</ul>' +
    '<div class="menu-foot"><button data-share>Compartilhar</button><a data-act="wa" href="contato.html#form">WhatsApp</a></div>' +
    '<p class="menu-tip">Dica: no navegador do celular, use “Adicionar à tela inicial” para abrir como app.</p>';
  (app || document.body).appendChild(menu);
  // reaplica links de ação dentro do menu
  $$('[data-act]', menu).forEach(function (a) {
    if (a.getAttribute('data-act') === 'wa' && ok(SITE.whatsapp)) { a.href = 'https://wa.me/' + SITE.whatsapp; a.target = '_blank'; a.rel = 'noopener'; }
  });

  var lastFocus;
  function openMenu() {
    lastFocus = document.activeElement;
    menu.className = 'menu open'; menu.setAttribute('aria-hidden', 'false');
    setTimeout(function () { var c = $('[data-close]', menu); if (c) c.focus(); }, 300);
  }
  function closeMenu() {
    menu.className = 'menu'; menu.setAttribute('aria-hidden', 'true');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('[data-menu]').forEach(function (b) { b.addEventListener('click', openMenu); });
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ===== compartilhar ===== */
  $$('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (navigator.share) { navigator.share({ title: document.title, url: location.href }).catch(function () {}); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(location.href).then(function () { say('Link copiado'); }, function () { say(location.href); });
      } else say(location.href);
    });
  });

  /* ===== voltar ===== */
  $$('[data-back]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (document.referrer && document.referrer.indexOf(location.host) > -1 && history.length > 1) { e.preventDefault(); history.back(); }
    });
  });

  /* ===== HOME: coluna de bolhas + régua ===== */
  var rail = $('#rail');
  if (rail) {
    var lis = $$('li', rail), bubbles = $$('.bubble', rail);
    var range = $('#scrub'), curName = $('[data-cur-name]'), curNum = $('[data-cur-num]'), counter = $('[data-counter]');
    var names = lis.map(function (li) { return li.getAttribute('data-name'); });
    var pitch = lis[0].offsetHeight || 110;
    var lock = false, raf = 0, shown = -1;

    function layout() {
      pitch = lis[0].offsetHeight || 110;
      var pad = Math.max(0, (rail.clientHeight - pitch) / 2);
      rail.style.paddingTop = pad + 'px';
      rail.style.paddingBottom = pad + 'px';
    }
    function update() {
      raf = 0;
      var pos = rail.scrollTop / pitch;       // 0 .. n-1 (contínuo)
      for (var i = 0; i < bubbles.length; i++) {
        var t = Math.max(0, 1 - Math.abs(pos - i));
        var e = t * t * (3 - 2 * t);
        var s = Math.round(62 + 50 * e);
        var r = Math.round(s / 2 - (s / 2 - s * 0.27) * e);
        var b = bubbles[i];
        b.style.setProperty('--s', s + 'px');
        b.style.setProperty('--r', r + 'px');
        b.style.setProperty('--o', e > .6 ? 1 : 0);
        lis[i].className = e > .6 ? 'on' : '';
      }
      var n = Math.max(0, Math.min(lis.length - 1, Math.round(pos)));
      if (n !== shown) {
        shown = n;
        if (curName) curName.textContent = names[n];
        if (curNum) curNum.textContent = two(n + 1);
        if (counter) counter.textContent = two(n + 1) + '/' + two(lis.length);
        var dm = $('#discover'); if (dm) dm.setAttribute('href', lis[n].getAttribute('data-href'));
      }
      if (range && !lock) range.value = pos.toFixed(3);
    }
    function onScroll() { if (!raf) raf = (window.requestAnimationFrame || setTimeout)(update, 16); }
    function goTo(n, smooth) {
      var y = n * pitch;
      if (rail.scrollTo && smooth && !reduced) rail.scrollTo({ top: y, behavior: 'smooth' }); else rail.scrollTop = y;
    }
    rail.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { layout(); update(); });
    window.addEventListener('orientationchange', function () { setTimeout(function () { layout(); update(); }, 300); });

    // toque: se não for a bolha em foco, apenas centraliza; se for, abre a página
    bubbles.forEach(function (b, i) {
      b.addEventListener('click', function (e) {
        var pos = rail.scrollTop / pitch;
        if (Math.abs(pos - i) > .35) { e.preventDefault(); goTo(i, true); }
      });
    });

    if (range) {
      range.max = String(lis.length - 1);
      range.addEventListener('input', function () { lock = true; rail.style.scrollSnapType = 'none'; rail.scrollTop = parseFloat(range.value) * pitch; });
      var rel = function () { lock = false; rail.style.scrollSnapType = ''; goTo(Math.round(parseFloat(range.value)), true); };
      range.addEventListener('change', rel);
      range.addEventListener('touchend', rel); range.addEventListener('mouseup', rel);
    }
    document.addEventListener('keydown', function (e) {
      var n = Math.round(rail.scrollTop / pitch);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goTo(Math.min(lis.length - 1, n + 1), true);
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goTo(Math.max(0, n - 1), true);
    });

    layout(); update();
    // começa na primeira área; após fontes carregarem, recalcula
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); update(); });
  }

  /* ===== ÁREA: efeito de digitação ===== */
  var typ = $('[data-type]');
  if (typ) {
    var full = typ.getAttribute('data-type'), cur = '<span class="cur" aria-hidden="true"></span>';
    if (reduced) { typ.innerHTML = full + cur; }
    else {
      var k = 0; typ.innerHTML = cur;
      setTimeout(function step() {
        k++; typ.innerHTML = full.slice(0, k) + cur;
        if (k < full.length) setTimeout(step, 38);
      }, 700);
    }
  }

  /* ===== revelar ao rolar ===== */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window && rv.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.className += ' in'; io.unobserve(e.target); } });
    }, { threshold: .08 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.className += ' in'; });

  /* ===== formulário de contato ===== */
  var form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = function (n) { return (form.elements[n] && form.elements[n].value) || ''; };
      var msg = 'Olá, meu nome é ' + g('nome') + '.\nÁrea de interesse: ' + g('area') +
        '\nTelefone: ' + (g('tel') || '-') + '\nE-mail: ' + g('email') + '\n\n' + g('msg');
      if (ok(SITE.whatsapp)) {
        window.open('https://wa.me/' + SITE.whatsapp + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
        say('Abrindo o WhatsApp…');
      } else {
        location.href = 'mailto:' + SITE.email + '?subject=' + encodeURIComponent('Contato pelo site — ' + g('area')) + '&body=' + encodeURIComponent(msg);
        say('Abrindo seu e-mail…');
      }
    });
  }

  /* ===== PWA (só funciona em http/https) ===== */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
