/* ============================================================
   ABORGHETTI — APP.JS (versão estática)
   ------------------------------------------------------------
   0. Base: classe js, helpers, motion reduzido, rAF de scroll
   1. Navbar: estado de scroll, menu mobile, link ativo
   2. Hero: palavra rotativa, entrada, parallax, fade no scroll
   3. Partners: monta esferas a partir dos dados (loop 2x)
   4. Reveals genéricos (IntersectionObserver)
   5. Dim de atos (Manifesto) por scroll
   6. CHATO? scrub + fio narrativo + resposta
   7. Methodology: etapas ativas + câmera
   8. Solutions: progresso único, índice clicável, luz/câmera
   9. Network: rótulos, hover/tap, entrada, parallax
   10. Pré-conversão: word scrub
   11. Formulário: máscara, validação, envio, sucesso + PDF
   12. Rodapé: ano dinâmico
   13. Three.js: partículas sutis no Hero
   Sem dependências além do Three.js (opcional, com fallback).
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 0. BASE ---------- */
  document.documentElement.classList.add('js'); // libera estados iniciais de animação
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var desktop = function () { return window.innerWidth >= 1024; };
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  // Progresso estilo ScrollTrigger: p=0 quando top atinge startVh da viewport,
  // p=1 quando bottom atinge endVh. (startVh/endVh em fração da altura)
  function rangeProgress(rect, vh, h, startVh, endVh) {
    return clamp01((startVh * vh - rect.top) / ((startVh - endVh) * vh + h));
  }
  var lerpColor = function (c1, c2, t) {
    return 'rgb(' + Math.round(c1[0] + (c2[0] - c1[0]) * t) + ',' +
      Math.round(c1[1] + (c2[1] - c1[1]) * t) + ',' +
      Math.round(c1[2] + (c2[2] - c1[2]) * t) + ')';
  };
  var LAV = [167, 159, 201], INK = [26, 20, 70];

  // Loop único de scroll (rAF): leitores registram funções baratas aqui.
  var scrollFns = [];
  var scrollDirty = true, rafOn = false;
  function onScroll(fn) { scrollFns.push(fn); fn(); }
  function requestTick() {
    if (rafOn) return;
    rafOn = true;
    requestAnimationFrame(runScroll);
  }
  function runScroll() {
    rafOn = false;
    if (!scrollDirty) return;
    scrollDirty = false;
    var vh = window.innerHeight;
    for (var i = 0; i < scrollFns.length; i++) scrollFns[i](vh);
  }
  window.addEventListener('scroll', function () { scrollDirty = true; requestTick(); }, { passive: true });
  window.addEventListener('resize', function () { scrollDirty = true; requestTick(); });

  /* ---------- 1. NAVBAR ---------- */
  var navbar = document.getElementById('navbar');
  var menuBtn = document.getElementById('menuBtn');
  var menuMobile = document.getElementById('menu-mobile');
  navbar.classList.add('enter'); // entrada suave (CSS)
  onScroll(function () {
    navbar.classList.toggle('scrolled', window.scrollY > 24);
  });
  // menu mobile: abre/fecha + trava scroll + Escape
  function setMenu(open) {
    var willOpen = open === undefined ? !menuMobile.classList.contains('open') : open;
    menuMobile.classList.toggle('open', willOpen);
    menuMobile.setAttribute('aria-hidden', String(!willOpen));
    menuBtn.setAttribute('aria-expanded', String(willOpen));
    menuBtn.setAttribute('aria-label', willOpen ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = willOpen ? 'hidden' : '';
    menuMobile.querySelectorAll('a').forEach(function (a) { a.tabIndex = willOpen ? 0 : -1; });
  }
  menuBtn.addEventListener('click', function () { setMenu(); });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  menuMobile.querySelectorAll('a').forEach(function (a) {
    a.tabIndex = -1;
    a.addEventListener('click', function () { setMenu(false); });
  });
  // link ativo por seção visível
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-navlink]'));
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('data-navlink') === en.target.id);
          if (a.getAttribute('data-navlink') === en.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    ['topo', 'quem-somos', 'metodologia', 'solucoes', 'nossa-rede', 'clientes', 'contato'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) secObs.observe(el);
    });
  }

  /* ---------- 2. HERO ---------- */
  var WORDS = ['NOVIDADE.', 'EXPERIÊNCIA.', 'INOVAÇÃO.'];
  var heroWord = document.getElementById('heroWord');
  var wi = 0;
  if (!reduced) {
    setInterval(function () {
      wi = (wi + 1) % WORDS.length;
      heroWord.textContent = WORDS[wi];
      heroWord.classList.remove('swap');
      void heroWord.offsetWidth; // reinicia a animação de máscara
      heroWord.classList.add('swap');
    }, 2800);
  }
  // delays de entrada escalonados dentro do Hero
  document.querySelectorAll('.hero .reveal').forEach(function (el, i) {
    el.style.transitionDelay = (i * 0.12) + 's';
  });
  var heroScene = document.querySelector('.hero-scene');
  var heroContent = document.querySelector('.hero-content');
  var mouseX = 0, mouseY = 0, px = 0, py = 0, heroP = 0; // parallax com interpolação
  if (finePointer && desktop() && !reduced) {
    window.addEventListener('pointermove', function (e) {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }
  onScroll(function (vh) {
    var y = window.scrollY;
    // fade/câmera do Hero ao sair (só no primeiro viewport)
    heroP = clamp01(y / vh);
    heroContent.style.opacity = String(1 - heroP * 0.75);
    heroContent.style.transform = 'translateY(' + (-70 * heroP) + 'px)';
  });
  // interpolação do parallax + deriva de scroll num único escritor
  (function heroParallax() {
    px += (mouseX - px) * 0.08;
    py += (mouseY - py) * 0.08;
    if (!reduced && window.scrollY < window.innerHeight * 1.2) {
      var vh = window.innerHeight;
      heroScene.style.transform = 'translate(' + (px * -14) + 'px,' + (py * -10 + heroP * vh * 0.1) + 'px)';
    }
    requestAnimationFrame(heroParallax);
  })();

  /* ---------- 3. PARTNERS (dados + loop) ---------- */
  // name = texto exibido · file = asset real · zoom = escala óptica opcional
  var PARTNERS = [
    { name: 'Serasa Experian', file: 'serasa.webp' },
    { name: 'Andrade Gutierrez', file: 'andrade.webp' },
    { name: 'Magalu', file: 'magalu.webp' },
    { name: 'Algar Telecom', file: 'algar.webp' },
    { name: 'Ecorodovias', file: 'ecorodovias.webp' },
    { name: 'Armac', file: 'armac.webp' },
    { name: 'ANAC', file: 'anac.webp', zoom: 1.15 },
    { name: 'Albert Einstein', file: 'albert.webp', zoom: 1.08 },
    { name: 'Unico', file: 'unico.webp' },
    { name: 'Santo Antônio Energia', file: 'santoantonio.webp' },
    { name: 'Sinergia Studios', file: 'sinergia.webp' },
    { name: 'Dolfyn', file: 'dolfyn.webp' },
    { name: 'BX Blue', file: 'bx.webp' }
  ];
  var track = document.getElementById('partnerTrack');
  var trackHTML = PARTNERS.map(function (p) {
    return '<div class="partner-item">' +
      '<span class="partner-name" aria-hidden="true">' + p.name + '</span>' +
      '<span class="partner-orb"><img src="../assets/' + p.file + '" alt="' + p.name + '" width="394" height="120" loading="lazy" decoding="async"' +
      (p.zoom ? ' style="transform:scale(' + p.zoom + ')"' : '') + ' /></span></div>';
  }).join('');
  track.innerHTML = trackHTML + trackHTML; // 2x = loop -50% perfeito
  // segunda metade: escondida de leitores de tela (conteúdo duplicado)
  Array.prototype.slice.call(track.children, PARTNERS.length).forEach(function (el) {
    el.setAttribute('aria-hidden', 'true');
    var img = el.querySelector('img');
    if (img) img.setAttribute('alt', '');
  });

  /* ---------- 4. REVEALS genéricos ---------- */
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    // sem IO ou motion reduzido: tudo visível
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 5. DIM dos atos (Manifesto) ---------- */
  var dimEls = Array.prototype.slice.call(document.querySelectorAll('[data-dim]'));
  if (!reduced && dimEls.length) {
    onScroll(function (vh) {
      dimEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var p = rangeProgress(r, vh, r.height, 0.30, 0.04);
        el.style.opacity = String(1 - p * 0.62);
      });
    });
  }

  /* ---------- 6. CHATO scrub + fio + resposta ---------- */
  var chatoBlock = document.getElementById('chatoBlock');
  if (chatoBlock && !reduced) {
    var chatoWords = Array.prototype.slice.call(chatoBlock.querySelectorAll('span span'));
    onScroll(function (vh) {
      var r = chatoBlock.getBoundingClientRect();
      var p = rangeProgress(r, vh, r.height, 0.80, 0.55);
      var n = chatoWords.length;
      chatoWords.forEach(function (w, i) {
        var l = clamp01(p * n - i);
        w.style.opacity = String(0.16 + 0.84 * l);
        w.style.filter = 'blur(' + (7 * (1 - l)).toFixed(2) + 'px)';
        w.style.color = lerpColor(LAV, INK, l);
      });
    });
  }
  // fio narrativo: desenhado pelo scroll (desktop)
  var threadPath = document.getElementById('threadPath');
  if (threadPath && !reduced && desktop()) {
    try {
      var tLen = threadPath.getTotalLength();
      threadPath.style.strokeDasharray = String(tLen);
      var threadBox = threadPath.closest('.thread');
      onScroll(function (vh) {
        var r = threadBox.getBoundingClientRect();
        var p = rangeProgress(r, vh, r.height, 0.55, 0.75);
        // OBS: end usa bottom em 75% (fórmula trata endVh<startVh)
        threadPath.style.strokeDashoffset = String(tLen * (1 - p));
      });
    } catch (e) { /* SVG indisponível: linha segue estática */ }
  }
  // resposta em dois tempos (reveal por IO, após a pergunta)
  ['.answer-spoiler', '.answer-main'].forEach(function (sel, k) {
    var el = document.querySelector(sel);
    if (!el || reduced || !('IntersectionObserver' in window)) return;
    el.classList.add('reveal');
    if (k === 1) el.style.transitionDuration = '1.1s';
    new IntersectionObserver(function (en, obs) {
      if (en[0].isIntersecting) { el.classList.add('in'); obs.disconnect(); }
    }, { threshold: 0.4 }).observe(el);
  });

  /* ---------- 7. METHODOLOGY ---------- */
  var methodTall = document.getElementById('methodTall');
  var methodScene = document.querySelector('.method-scene');
  var methodSteps = Array.prototype.slice.call(document.querySelectorAll('[data-step]'));
  onScroll(function (vh) {
    if (!methodTall) return;
    // etapa ativa: centro da viewport dentro da linha (desktop)
    if (desktop() && !reduced) {
      methodSteps.forEach(function (li) {
        var r = li.getBoundingClientRect();
        var on = r.top < vh * 0.62 && r.bottom > vh * 0.38;
        li.classList.toggle('dim', !on);
      });
      // câmera sutil do tall
      var tr = methodTall.getBoundingClientRect();
      if (tr.bottom > 0 && tr.top < vh) {
        var p = clamp01((vh - tr.top) / (vh + tr.height));
        methodScene.style.transform = 'translateY(' + (p * 3 * vh / 100) + '%) scale(' + (1 + p * 0.035) + ')';
      }
    } else {
      methodSteps.forEach(function (li) { li.classList.remove('dim'); });
      methodScene.style.transform = '';
    }
  });

  /* ---------- 8. SOLUTIONS (progresso único) ---------- */
  var SOLUTIONS = [
    { n: '01', title: 'E-learning & SCORM', desc: 'Experiências digitais estruturadas para LMS, com conteúdo, interações, exercícios e avaliações.', meta: 'SCORM 1.2 • HTML5', light: '58% 52%' },
    { n: '02', title: 'Vídeos & Videoaulas', desc: 'Do roteiro à produção: conteúdos audiovisuais para treinamento, comunicação e desenvolvimento.', meta: '', light: '50% 34%' },
    { n: '03', title: 'Apresentações', desc: 'Conteúdo corporativo transformado em apresentações claras, visuais e de alto impacto.', meta: '', light: '36% 48%' },
    { n: '04', title: 'Microlearning', desc: 'Conteúdo essencial em experiências curtas, objetivas e fáceis de consumir.', meta: '', light: '64% 62%' },
    { n: '05', title: 'Simuladores & Tutoriais', desc: 'Experiências guiadas para ensinar sistemas, processos e procedimentos na prática.', meta: '', light: '48% 74%' },
    { n: '06', title: 'Infográficos & E-books', desc: 'Informações complexas organizadas em materiais editoriais claros, visuais e envolventes.', meta: '', light: '38% 66%' },
    { n: '07', title: 'Gamificação', desc: 'Mecânicas de interação e desafio aplicadas ao aprendizado para ampliar participação e engajamento.', meta: '', light: '40% 32%' },
    { n: '08', title: 'Lives & Podcasts', desc: 'Conteúdo ao vivo ou sob demanda para ampliar o alcance da comunicação e do aprendizado.', meta: '', light: '70% 72%' },
    { n: '09', title: 'Consultoria Educacional', desc: 'Antes do formato, vem a estratégia. Entendemos o desafio para desenhar a solução educacional adequada.', meta: '', light: '52% 50%' }
  ];
  var solTall = document.getElementById('solTall');
  var solIndex = document.getElementById('solIndex');
  var solCount = document.getElementById('solCount');
  var solTitle = document.getElementById('solTitle');
  var solDesc = document.getElementById('solDesc');
  var solMeta = document.getElementById('solMeta');
  var solScene = document.querySelector('.sol-scene');
  var solStage = document.querySelector('.sol-stage');
  var solActive = -1;
  // monta o índice editorial (botões reais, com setas de teclado)
  solIndex.innerHTML = SOLUTIONS.map(function (s, i) {
    return '<li><button type="button" data-sol-i="' + i + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' +
      '<span class="n" aria-hidden="true">' + s.n + '</span>' +
      '<span class="t">' + s.title + '</span><span class="bar" aria-hidden="true"></span></button></li>';
  }).join('');
  var solBtns = Array.prototype.slice.call(solIndex.querySelectorAll('button'));
  function setSol(i) {
    if (i === solActive) return;
    solActive = i;
    var s = SOLUTIONS[i];
    solCount.textContent = s.n + ' / 09';
    solTitle.textContent = s.title;
    solDesc.textContent = s.desc;
    solMeta.textContent = s.meta || '';
    solBtns.forEach(function (b, k) {
      var on = k === i;
      b.parentElement.classList.toggle('on', on);
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    // luz reativa + micro-câmera (só desktop com motion)
    if (desktop() && !reduced && solStage) {
      solStage.style.setProperty('--sol-light', s.light);
      var veil = document.querySelector('.sol-veil');
      if (veil) veil.style.background = 'linear-gradient(90deg, rgba(251,250,255,.94), rgba(251,250,255,.78) 26%, rgba(251,250,255,.25) 44%, transparent 58%), radial-gradient(34rem 22rem at ' + s.light + ', rgba(198,0,126,.08), transparent 74%)';
      if (solScene) solScene.style.transform = 'translate(' + ((i % 3 - 1) * -5) + 'px,' + ((i % 2) * -3) + 'px) scale(' + (1.02 + (i % 4) * 0.004) + ')';
    }
  }
  // click = rola até o range do item; o scroll assume o estado (fonte única)
  function solGo(i) {
    if (reduced || !desktop()) { setSol(i); return; }
    var r = solTall.getBoundingClientRect();
    var top = r.top + window.scrollY;
    var total = solTall.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((i + 0.5) / SOLUTIONS.length) * total, behavior: 'smooth' });
  }
  solBtns.forEach(function (b, i) { b.addEventListener('click', function () { solGo(i); }); });
  solIndex.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    var n = e.key === 'ArrowDown' ? (solActive + 1) % 9 : (solActive - 1 + 9) % 9;
    solGo(n);
    solBtns[n].focus();
  });
  setSol(0);
  onScroll(function (vh) {
    if (!desktop() || reduced) return;
    var r = solTall.getBoundingClientRect();
    var total = solTall.offsetHeight - vh;
    if (total <= 0) return;
    var p = clamp01(-r.top / total);
    setSol(p <= 0 ? 0 : p >= 1 ? 8 : Math.min(8, Math.floor(p * 9)));
    // deriva de câmera ao longo do tall (move a foto interna, sem brigar
    // com o micro-deslocamento do item ativo aplicado no container)
    if (solScene && solScene.firstElementChild && r.bottom > 0 && r.top < vh) {
      var q = clamp01((vh - r.top) / (vh + r.height));
      solScene.firstElementChild.style.transform = 'translateY(' + (q * 4) + '%)';
    }
  });

  /* ---------- 9. NETWORK ---------- */
  // rótulos: id, texto, número, posição % (desktop 1000×620 / mobile 400×560)
  /* ═══ ORBIT NETWORK INTERACTIONS ══════════════════════════════ */
  (function initOrbit() {
    var wrap = document.getElementById('orbitWrap');
    if (!wrap) return;

    var cardGs = Array.prototype.slice.call(wrap.querySelectorAll('.ocard-g'));
    var lines  = Array.prototype.slice.call(wrap.querySelectorAll('.obit-ln'));

    /* Hover / tap: destaca card + linha, esmaece os outros */
    function setActive(activeI) {
      cardGs.forEach(function (g, i) {
        g.classList.toggle('active', i === activeI);
        g.classList.toggle('dim',    activeI !== null && i !== activeI);
      });
      lines.forEach(function (l, i) {
        l.classList.toggle('hi', i === activeI);
        l.classList.toggle('lo', activeI !== null && i !== activeI);
      });
    }

    var tapTimer = null;
    cardGs.forEach(function (g, i) {
      /* desktop hover */
      g.addEventListener('mouseenter', function () {
        if (finePointer) setActive(i);
      });
      g.addEventListener('mouseleave', function () {
        if (finePointer) setActive(null);
      });
      /* mobile tap */
      g.addEventListener('click', function () {
        setActive(i);
        if (tapTimer) clearTimeout(tapTimer);
        tapTimer = setTimeout(function () { setActive(null); }, 2400);
      });
    });

    /* Entrada: fade-in escalonado dos cards ao entrar no viewport */
    if ('IntersectionObserver' in window && !reduced) {
      cardGs.forEach(function (g) {
        g.style.opacity = '0';
        g.setAttribute('transform', g.getAttribute('transform') + ' scale(0.85)');
      });
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          cardGs.forEach(function (g, i) {
            setTimeout(function () {
              g.style.transition = 'opacity .55s ease, transform .55s cubic-bezier(.22,1,.36,1)';
              g.style.opacity = '1';
              /* restaura transform original removendo o scale(0.85) adicionado */
              var t = g.getAttribute('transform').replace(' scale(0.85)', '');
              g.setAttribute('transform', t);
            }, 60 + i * 65);
          });
          obs.unobserve(e.target);
        });
      }, { threshold: 0.12 });
      io.observe(wrap);
    }

    /* Micro-parallax do SVG inteiro no mouse (suave, desktop) */
    if (finePointer && !reduced) {
      var svg = document.getElementById('orbitSvg');
      var nmx = 0, nmy = 0, ntmx = 0, ntmy = 0;
      window.addEventListener('pointermove', function (e) {
        if (window.innerWidth < 768) return;
        ntmx = (e.clientX / window.innerWidth  - 0.5);
        ntmy = (e.clientY / window.innerHeight - 0.5);
      }, { passive: true });
      (function netLoop() {
        nmx += (ntmx - nmx) * 0.05;
        nmy += (ntmy - nmy) * 0.05;
        if (svg && Math.abs(nmx) > 0.001)
          svg.style.transform = 'translate(' + (nmx * 9) + 'px,' + (nmy * 6) + 'px)';
        requestAnimationFrame(netLoop);
      })();
    }
  })();

  /* ---------- 10. PRÉ-CONVERSÃO: word scrub ---------- */
  // Só palavras internas (filhos diretos do wrapper): o wrapper externo
  // com aria-hidden NÃO entra na animação (evita duplo fade).
  function innerWords(container) {
    return Array.prototype.slice.call(container.querySelectorAll(':scope > span > span'));
  }
  var preS1 = document.getElementById('preS1');
  var preS2 = document.getElementById('preS2');
  if (!reduced && preS1 && preS2) {
    var w1 = innerWords(preS1);
    var w2 = innerWords(preS2);
    onScroll(function (vh) {
      [[preS1, w1, 0.78, 0.55], [preS2, w2, 0.80, 0.60]].forEach(function (cfg) {
        var box = cfg[0], ws = cfg[1];
        var r = box.getBoundingClientRect();
        var p = rangeProgress(r, vh, r.height, cfg[2], cfg[3]);
        var n = ws.length;
        ws.forEach(function (w, i) {
          var l = clamp01(p * n - i);
          var accent = w.classList.contains('w-juntos');
          w.style.opacity = String(0.13 + 0.87 * l);
          w.style.filter = 'blur(' + (5 * (1 - l)).toFixed(2) + 'px)';
          if (!accent) w.style.color = lerpColor(LAV, INK, l);
        });
      });
    });
  }

  /* ---------- 11. FORMULÁRIO ---------- */
  var form = document.getElementById('form-apresentacao');
  var leadBtn = document.getElementById('leadBtn');
  var leadSuccess = document.getElementById('leadSuccess');
  var leadFormErr = document.getElementById('leadFormErr');
  function maskPhone(v) {
    var d = v.replace(/\D/g, '').slice(0, 13);
    var local = d.indexOf('55') === 0 ? d.slice(2) : d;
    if (!local.length) return '';
    if (local.length <= 2) return '(' + local;
    if (local.length <= 6) return '(' + local.slice(0, 2) + ') ' + local.slice(2);
    if (local.length <= 10) return '(' + local.slice(0, 2) + ') ' + local.slice(2, 6) + '-' + local.slice(6);
    return '(' + local.slice(0, 2) + ') ' + local.slice(2, 7) + '-' + local.slice(7, 11);
  }
  var fWhats = document.getElementById('lead-whatsapp');
  fWhats.addEventListener('input', function () { fWhats.value = maskPhone(fWhats.value); clearErr('whatsapp'); });
  ['nome', 'empresa', 'email'].forEach(function (k) {
    document.getElementById('lead-' + k).addEventListener('input', function () { clearErr(k); });
  });
  function setErr(k, msg) {
    var input = document.getElementById('lead-' + k);
    var err = document.getElementById('lead-' + k + '-err');
    err.textContent = msg;
    err.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', 'lead-' + k + '-err');
  }
  function clearErr(k) {
    var err = document.getElementById('lead-' + k + '-err');
    if (!err.hidden) {
      err.hidden = true;
      document.getElementById('lead-' + k).removeAttribute('aria-invalid');
    }
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (leadBtn.disabled) return; // sem double submit
    var v = {
      nome: document.getElementById('lead-nome').value.trim(),
      empresa: document.getElementById('lead-empresa').value.trim(),
      email: document.getElementById('lead-email').value.trim(),
      whatsapp: document.getElementById('lead-whatsapp').value
    };
    var ok = true;
    if (v.nome.length < 2) { setErr('nome', 'Informe seu nome.'); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) { setErr('email', 'Informe um e-mail válido.'); ok = false; }
    var dg = v.whatsapp.replace(/\D/g, '');
    var loc = dg.indexOf('55') === 0 ? dg.slice(2) : dg;
    if (loc.length < 10 || loc.length > 11) { setErr('whatsapp', 'Informe um WhatsApp válido com DDD.'); ok = false; }
    if (v.empresa.length < 2) { setErr('empresa', 'Informe sua empresa.'); ok = false; }
    if (!ok) {
      var first = document.querySelector('.field-err:not([hidden])');
      if (first) { var inp = first.parentElement.querySelector('input'); if (inp) inp.focus(); }
      return;
    }
    // loading → simula envio → sucesso libera o PDF real
    leadBtn.disabled = true;
    leadBtn.innerHTML = 'Preparando apresentação…';
    leadFormErr.hidden = true;
    setTimeout(function () {
      form.style.display = 'none';
      leadSuccess.hidden = false;
      leadSuccess.setAttribute('tabindex', '-1');
      leadSuccess.focus({ preventScroll: true });
    }, 900);
  });

  /* ---------- 12. RODAPÉ ---------- */
  document.getElementById('year').textContent = String(new Date().getFullYear());

  /* ---------- 13. THREE.JS — partículas sutis no Hero ---------- */
  (function heroParticles() {
    var canvas = document.getElementById('heroParticles');
    if (!canvas || reduced || !window.THREE) return; // fallback: Hero funciona sem
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch (e) { return; } // sem WebGL: sai em silêncio
    var hero = document.querySelector('.hero');
    var W = 0, H = 0, visible = true;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    camera.position.z = 60;
    var N = 130; // poucas partículas = leve
    var pos = new Float32Array(N * 3), col = new Float32Array(N * 3), seed = new Float32Array(N);
    var palette = [[0.49, 0.36, 1.0], [0.78, 0.0, 0.49], [0.85, 0.82, 1.0]]; // violeta/magenta/lavanda
    for (var i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 70;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
      var c = palette[i % 3];
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
      seed[i] = Math.random() * Math.PI * 2;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var mat = new THREE.PointsMaterial({ size: 1.6, vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false });
    scene.add(new THREE.Points(geo, mat));
    function size() {
      W = hero.clientWidth; H = hero.clientHeight;
      renderer.setSize(W, H, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }
    size();
    window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);
    }
    var t = 0, cmx = 0, cmy = 0;
    window.addEventListener('pointermove', function (e) {
      cmx = e.clientX / window.innerWidth - 0.5;
      cmy = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
    (function tick() {
      requestAnimationFrame(tick);
      if (!visible || document.hidden) return; // pausa fora da tela
      t += 0.0035;
      var p = geo.attributes.position.array;
      for (var k = 0; k < N; k++) {
        p[k * 3 + 1] += Math.sin(t * 2 + seed[k]) * 0.012; // deriva vertical suave
        p[k * 3] += Math.cos(t + seed[k]) * 0.008;
      }
      geo.attributes.position.needsUpdate = true;
      camera.position.x += (cmx * 4 - camera.position.x) * 0.03; // parallax da câmera
      camera.position.y += (cmy * -2 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    })();
  })();

  // primeira medição de scroll
  scrollDirty = true;
  requestTick();
})();
