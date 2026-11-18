/* Reconstrução por rolagem (parallax) em toda a tela.
   Cada posição da barra de rolagem corresponde a um ponto do vídeo. Além de trocar os quadros,
   a câmera desce das ruínas até o fórum e se aproxima aos poucos, e o fundo desfocado se move em
   velocidade diferente da imagem nítida, criando profundidade.

   Dois conjuntos de quadros:
   - frames-m: leve (480 px de largura), para celular e telas em pé, onde o vídeo ocupa a tela toda;
   - frames-w: nítido (720 px de largura), para computador e tablet deitado, onde o vídeo aparece
     grande ao lado do texto e se funde ao fundo desfocado.
   Para trocar o vídeo, gere novos quadros com os mesmos nomes (f001.jpg, f002.jpg...) e ajuste "count". */
(function () {
  "use strict";

  var SETS = {
    m: { dir: "frames-m", count: 119, panFrom: 0.12, panTo: 0.72, zoomEnd: 0.09 },
    w: { dir: "frames-w", count: 119, panFrom: 0.04, panTo: 0.86, zoomEnd: 0.05 }
  };

  var scene = document.getElementById("inicio");
  var canvas = document.getElementById("fg");
  var bgCanvas = document.getElementById("bg");
  var ctx = canvas.getContext("2d");
  var bgCtx = bgCanvas.getContext("2d");
  var nav = document.getElementById("nav");
  var hint = document.getElementById("hint");
  var hintText = document.getElementById("hintText");
  var railFill = document.getElementById("railFill");
  var railItems = Array.prototype.slice.call(document.querySelectorAll("#rail li"));
  var chapters = Array.prototype.slice.call(document.querySelectorAll(".chap"));

  var setKey = null, set = null;
  var images = [], loaded = [], loadedCount = 0, loadToken = 0;

  var progress = 0;   // 0 a 1 dentro da cena
  var current = 0;    // posição suavizada, em quadros
  var lastKey = "";
  var dpr = 1;

  function wantedSet() {
    return (window.innerWidth > window.innerHeight && window.innerWidth > 820) ? "w" : "m";
  }
  function framePath(i) { return set.dir + "/f" + String(i + 1).padStart(3, "0") + ".jpg"; }

  /* ---------- carregamento dos quadros ---------- */
  function useSet(key) {
    setKey = key;
    set = SETS[key];
    images = new Array(set.count);
    loaded = new Array(set.count);
    loadedCount = 0;
    lastKey = "";
    var token = ++loadToken;

    // primeiro quadros espaçados (a rolagem rápida já funciona), depois os intermediários
    var order = [], i;
    for (i = 0; i < set.count; i += 6) { order.push(i); }
    for (i = 0; i < set.count; i++) { if (i % 6 !== 0) { order.push(i); } }

    var next = 0, active = 0, MAX = 8;
    function pump() {
      while (active < MAX && next < order.length) {
        (function (idx) {
          active++;
          var img = new Image();
          img.decoding = "async";
          img.onload = function () {
            if (token !== loadToken) { return; }
            images[idx] = img; loaded[idx] = true; loadedCount++; lastKey = "";
            status();
            active--; pump();
          };
          img.onerror = function () { if (token === loadToken) { active--; pump(); } };
          img.src = framePath(idx);
        })(order[next++]);
      }
    }
    pump();
  }

  function status() {
    if (progress >= 0.02) { return; }
    hintText.textContent = loadedCount >= set.count
      ? "Role para reconstruir"
      : "Carregando cenário " + Math.round(loadedCount / set.count * 100) + "%";
  }

  /* ---------- desenho ---------- */
  function nearestLoaded(i) {
    if (loaded[i]) { return i; }
    for (var d = 1; d < set.count; d++) {
      if (i - d >= 0 && loaded[i - d]) { return i - d; }
      if (i + d < set.count && loaded[i + d]) { return i + d; }
    }
    return -1;
  }

  function drawCover(c, cv, img, alpha, pan, zoom) {
    var w = cv.width, h = cv.height;
    var s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    var x = (w - dw) / 2;
    var y = dh > h ? -(dh - h) * pan : (h - dh) / 2;
    c.globalAlpha = alpha;
    c.drawImage(img, x, y, dw, dh);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    bgCanvas.width = Math.max(48, Math.round(window.innerWidth / 16));
    bgCanvas.height = Math.max(48, Math.round(window.innerHeight / 16));
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    lastKey = "";
    if (wantedSet() !== setKey) { useSet(wantedSet()); }
  }

  function smooth(t) { return t * t * (3 - 2 * t); }

  function render() {
    var cp = current / (set.count - 1);
    var f = Math.min(set.count - 1, Math.max(0, current));
    var i0 = Math.floor(f), i1 = Math.min(set.count - 1, i0 + 1), t = f - i0;
    var a = nearestLoaded(i0), b = nearestLoaded(i1);
    if (a === -1) { return; }
    var pan = set.panFrom + (set.panTo - set.panFrom) * smooth(cp);
    var zoom = 1 + set.zoomEnd * cp;
    var key = a + "|" + b + "|" + t.toFixed(2) + "|" + pan.toFixed(3) + "|" + zoom.toFixed(3) + "|" + canvas.width;
    if (key === lastKey) { return; }
    lastKey = key;

    ctx.globalAlpha = 1;
    drawCover(ctx, canvas, images[a], 1, pan, zoom);
    if (b !== -1 && b !== a && t > 0.01) { drawCover(ctx, canvas, images[b], t, pan, zoom); } // mistura entre quadros vizinhos
    ctx.globalAlpha = 1;

    // fundo desfocado: o mesmo quadro, em baixa resolução, cobrindo a tela toda
    bgCtx.globalAlpha = 1;
    drawCover(bgCtx, bgCanvas, images[a], 1, 0.5, 1);
    bgCtx.globalAlpha = 1;
  }

  /* ---------- progresso da rolagem ---------- */
  function readScroll() {
    var rect = scene.getBoundingClientRect();
    var total = scene.offsetHeight - window.innerHeight;
    progress = Math.min(1, Math.max(0, -rect.top / total));
    nav.classList.toggle("solid", window.scrollY > 40);
  }

  var activeStep = -1;
  function updateText() {
    var step = 0;
    chapters.forEach(function (el, i) {
      var on = progress >= parseFloat(el.dataset.start) && progress < parseFloat(el.dataset.end);
      if (on) { step = i; }
      el.classList.toggle("on", on);
    });
    if (step !== activeStep) {
      activeStep = step;
      railItems.forEach(function (li, i) { li.classList.toggle("on", i === step); });
    }
    railFill.style.height = (progress * 100).toFixed(1) + "%";
    hint.classList.toggle("gone", progress > 0.02);
  }

  /* ---------- laço de animação ---------- */
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function tick() {
    readScroll();
    var target = progress * (set.count - 1);
    current += (target - current) * (reduced ? 1 : 0.14);
    if (Math.abs(target - current) < 0.005) { current = target; }
    render();
    updateText();
    // profundidade: o fundo desfocado desliza em sentido contrário ao da câmera
    bgCanvas.style.transform = "scale(1.25) translateY(" + ((0.5 - current / (set.count - 1)) * 5).toFixed(2) + "%)";
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  resize();
  tick();
})();
