/* ABORGHETTI — app.js
   Correções: imagens, scroll das soluções e depoimentos automáticos.
*/
(() => {
  'use strict';

  const $ = (s, scope = document) => scope.querySelector(s);
  const $$ = (s, scope = document) => [...scope.querySelectorAll(s)];

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 901px)');
  const motionOK = () => !reducedMotion.matches;
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));

  document.documentElement.classList.add('js');

  // =====================================================
  // ANIMAÇÕES DE ENTRADA
  // =====================================================

  const reveals = $$('.reveal');

  if ('IntersectionObserver' in window && motionOK()) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -25px 0px'
    });

    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches) {
      reveals.forEach(el => el.classList.add('in'));
    }
  });

  // =====================================================
  // NAVBAR E MENU MOBILE
  // =====================================================

  const navbar = $('#navbar');
  const siteHeader = $('#siteHeader');
  const menuButton = $('#menuBtn');
  const menu = $('#menu-mobile');
  const navLinks = $$('[data-navlink]');

  if (navbar) navbar.classList.add('enter');

  let menuOpen = false;
  let lastFocus = null;

  function toggleMenu(open) {
    if (!menu || !menuButton) return;

    menuOpen = Boolean(open);

    if (menuOpen) {
      lastFocus = document.activeElement;
    }

    menu.classList.toggle('open', menuOpen);
    menu.setAttribute('aria-hidden', String(!menuOpen));

    menuButton.setAttribute('aria-expanded', String(menuOpen));
    menuButton.setAttribute(
      'aria-label',
      menuOpen ? 'Fechar menu' : 'Abrir menu'
    );

    document.body.style.overflow = menuOpen ? 'hidden' : '';

    $$('a, button', menu).forEach(el => {
      el.tabIndex = menuOpen ? 0 : -1;
    });

    if (menuOpen) {
      $('a', menu)?.focus({ preventScroll: true });
    } else if (lastFocus?.isConnected) {
      lastFocus.focus({ preventScroll: true });
    }
  }

  if (menu && menuButton) {
    $$('a, button', menu).forEach(el => {
      el.tabIndex = -1;
    });

    menuButton.addEventListener('click', () => {
      toggleMenu(!menuOpen);
    });

    $$('a', menu).forEach(link => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    window.addEventListener('keydown', event => {
      if (!menuOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        toggleMenu(false);
      }

      if (event.key === 'Tab') {
        const focusables = [
          menuButton,
          ...$$('a, button', menu).filter(el => !el.hidden)
        ];

        const index = focusables.indexOf(document.activeElement);

        if (event.shiftKey && index === 0) {
          event.preventDefault();
          focusables.at(-1).focus();
        } else if (
          !event.shiftKey &&
          index === focusables.length - 1
        ) {
          event.preventDefault();
          focusables[0].focus();
        }
      }
    });

    desktop.addEventListener?.('change', () => {
      if (desktop.matches && menuOpen) {
        toggleMenu(false);
      }
    });
  }

  // Navegação ativa conforme a seção visível.

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        navLinks.forEach(link => {
          const active =
            link.dataset.navlink === entry.target.id;

          link.classList.toggle('active', active);

          if (active) {
            link.setAttribute('aria-current', 'location');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      });
    }, {
      rootMargin: '-30% 0px -60% 0px'
    });

    [
      'topo',
      'quem-somos',
      'nossa-rede',
      'solucoes',
      'portfolio',
      'depoimentos',
      'clientes',
      'contato'
    ].forEach(id => {
      const section = document.getElementById(id);

      if (section) sectionObserver.observe(section);
    });
  }

  // =====================================================
  // HERO
  // =====================================================

  const heroWord = $('#heroWord');

  const words = [
    'NOVIDADE.',
    'EXPERIÊNCIA.',
    'INOVAÇÃO.'
  ];

  if (heroWord && motionOK()) {
    let wordIndex = 0;

    window.setInterval(() => {
      if (document.hidden || reducedMotion.matches) return;

      wordIndex = (wordIndex + 1) % words.length;

      heroWord.textContent = words[wordIndex];

      heroWord.classList.remove('swap');

      void heroWord.offsetWidth;

      heroWord.classList.add('swap');

    }, 2900);
  }

  const heroContent = $('.hero-content');
  const heroScene = $('.hero-scene');

  let pointerX = 0;
  let pointerY = 0;
  let smoothX = 0;
  let smoothY = 0;

  if (window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', event => {
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }

  // =====================================================
  // SCROLL GLOBAL E VISIBILIDADE DO LOGO
  // =====================================================

  let scrollScheduled = false;
  const scrollTasks = [];

  function scheduleScroll() {
    if (scrollScheduled) return;

    scrollScheduled = true;

    requestAnimationFrame(() => {
      scrollScheduled = false;

      const y = window.scrollY;
      const vh = Math.max(1, window.innerHeight);

      const isScrolled = y > 24;

      navbar?.classList.toggle('scrolled', isScrolled);
      siteHeader?.classList.toggle('is-scrolled', isScrolled);

      scrollTasks.forEach(fn => fn(y, vh));
    });
  }

  if (heroContent) {
    scrollTasks.push((y, vh) => {
      if (!motionOK()) {
        heroContent.style.opacity = '';
        heroContent.style.transform = '';
        return;
      }

      const progress = clamp(y / vh);

      heroContent.style.opacity = String(1 - progress * 0.65);

      heroContent.style.transform =
        `translateY(${-48 * progress}px)`;
    });
  }

  // Movimento sutil do cenário do Hero.

  if (
    heroScene &&
    motionOK() &&
    window.matchMedia('(pointer:fine)').matches
  ) {
    let visible = true;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
      }).observe($('.hero') || heroScene);
    }

    function parallax() {
      if (
        visible &&
        !document.hidden &&
        motionOK() &&
        desktop.matches
      ) {
        smoothX += (pointerX - smoothX) * 0.07;
        smoothY += (pointerY - smoothY) * 0.07;

        heroScene.style.transform =
          `translate3d(${(-smoothX * 10).toFixed(2)}px,${(-smoothY * 7).toFixed(2)}px,0)`;
      } else {
        heroScene.style.transform = '';
      }

      requestAnimationFrame(parallax);
    }

    requestAnimationFrame(parallax);
  }
    // =====================================================
  // NOSSAS SOLUÇÕES — 8 SLIDES
  // Imagens: assets/solucoes/
  // =====================================================

  const solutionsImageBase = new URL(
    'assets/solucoes/',
    document.baseURI
  );

  const solutions = [
    {
      title: 'Consultoria',
      image: 'Consultoria.webp',
      paragraphs: [
        'Transforme seus desafios em soluções educacionais estratégicas. Atuamos desde a concepção até a execução do seu projeto, desenvolvendo arquiteturas de aprendizagem personalizadas e alinhadas aos objetivos do seu negócio.',
        'Conte com uma rede de especialistas para desenvolver pessoas, potencializar competências e criar novas possibilidades de aprendizagem.'
      ]
    },
    {
      title: 'Vídeos Institucionais',
      image: 'videos.webp',
      paragraphs: [
        'Transforme a mensagem da sua empresa em produções audiovisuais de alto impacto. Unimos criatividade, estratégia e qualidade técnica para desenvolver vídeos que fortalecem sua marca, comunicam seus valores e conectam pessoas.',
        'Do roteiro à produção final, cuidamos de cada etapa para entregar conteúdos relevantes e envolventes.'
      ]
    },
    {
      title: 'Videoaulas e Lives',
      image: 'lives.webp',
      paragraphs: [
        'Amplie o alcance do conhecimento com experiências audiovisuais dinâmicas e envolventes. Produzimos videoaulas, conteúdos animados e transmissões ao vivo para treinamentos, eventos e ações corporativas.',
        'Oferecemos uma estrutura completa, do planejamento à execução, para conectar sua empresa ao público com qualidade e profissionalismo.'
      ]
    },
    {
      title: 'E-learning e SCORM',
      image: 'scorm.webp',
      paragraphs: [
        'Transforme a aprendizagem corporativa em uma experiência digital interativa, acessível e escalável. Desenvolvemos treinamentos personalizados em SCORM e HTML5, combinando design instrucional, tecnologia e recursos multimídia.',
        'Capacite suas equipes com conteúdos que estimulam o engajamento, facilitam o aprendizado e permitem acompanhar a evolução dos colaboradores.'
      ]
    },
    {
      title: 'Apresentações Institucionais',
      image: 'apresentacao.webp',
      paragraphs: [
        'Comunique suas ideias com clareza, criatividade e impacto. Desenvolvemos apresentações personalizadas que combinam narrativa estratégica, identidade visual e organização inteligente das informações.',
        'Seja para treinamentos, reuniões, eventos ou apresentações comerciais, transformamos seu conteúdo em uma experiência visual profissional e envolvente.'
      ]
    },
    {
      title: 'Simuladores e Tutoriais',
      image: 'simuladores.webp',
      paragraphs: [
        'Transforme processos complexos em experiências práticas de aprendizagem. Desenvolvemos simuladores interativos e tutoriais personalizados para capacitar equipes na utilização de sistemas, ferramentas e processos corporativos.',
        'Proporcione um ambiente seguro para aprender, praticar e desenvolver competências, preparando seus colaboradores para os desafios do dia a dia.'
      ]
    },
    {
      title: 'Campanhas de Incentivo',
      image: 'campanha.webp',
      paragraphs: [
        'Engaje pessoas, fortaleça objetivos e mobilize suas equipes. Criamos campanhas de incentivo personalizadas, alinhadas às metas e à cultura da sua organização.',
        'Da estratégia à execução, desenvolvemos mecânicas de participação, comunicação visual, ações promocionais e experiências que estimulam o reconhecimento e a motivação dos colaboradores.'
      ]
    },
    {
      title: 'Gamificação',
      image: 'game.webp',
      paragraphs: [
        'Transforme conhecimento em experiências que despertam o interesse, estimulam a participação e tornam o aprendizado mais envolvente.',
        'Desenvolvemos jogos educacionais e soluções gamificadas, presenciais e digitais, combinando desafios, interatividade e objetivos de aprendizagem para fortalecer o engajamento e o desenvolvimento das suas equipes.'
      ]
    }
  ];

  const solTall = $('#solTall');
  const solIndex = $('#solIndex');
  const solCount = $('#solCount');
  const solTitle = $('#solTitle');
  const solDesc = $('#solDesc');
  const solMeta = $('#solMeta');

  let activeSolution = -1;

  if (
    solTall &&
    solIndex &&
    solCount &&
    solTitle &&
    solDesc
  ) {

    // Cria os oito itens do menu lateral.

    solutions.forEach((solution, index) => {
      const li = document.createElement('li');
      const button = document.createElement('button');

      button.type = 'button';
      button.dataset.solI = String(index);

      const number = document.createElement('span');
      number.className = 'n';
      number.setAttribute('aria-hidden', 'true');
      number.textContent = String(index + 1).padStart(2, '0');

      const title = document.createElement('span');
      title.className = 't';
      title.textContent = solution.title;

      const bar = document.createElement('span');
      bar.className = 'bar';
      bar.setAttribute('aria-hidden', 'true');

      button.append(number, title, bar);
      li.append(button);

      solIndex.append(li);
    });

    const solutionButtons = $$('button', solIndex);

    // Atualiza o conteúdo da solução.

    function setSolution(index) {
      index = clamp(index, 0, solutions.length - 1);

      if (activeSolution === index) return;

      activeSolution = index;

      const item = solutions[index];

      solCount.textContent =
        `${String(index + 1).padStart(2, '0')} / 08`;

      solTitle.textContent = item.title;

      const badge = $('#solBadge');

      if (badge) {
        badge.textContent =
          String(index + 1).padStart(2, '0');
      }

      // CAMINHO DAS IMAGENS CORRIGIDO.

      const art = $('#solArt');

      if (art) {
        const imageURL = new URL(
          item.image,
          solutionsImageBase
        );

        art.onerror = () => {
          console.error(
            '[Aborghetti] Imagem não encontrada:',
            imageURL.href
          );
        };

        art.src = imageURL.href;

        art.alt =
          item.title + ' — apresentação da solução';
      }

      // Insere os dois parágrafos do texto.

      solDesc.replaceChildren(
        ...item.paragraphs.map(text => {
          const paragraph = document.createElement('p');

          paragraph.textContent = text;

          return paragraph;
        })
      );

      if (solMeta) {
        solMeta.textContent = '';
      }

      solutionButtons.forEach((button, i) => {
        button.parentElement.classList.toggle(
          'on',
          i === index
        );

        if (i === index) {
          button.setAttribute('aria-current', 'true');
        } else {
          button.removeAttribute('aria-current');
        }
      });
    }

    // Clique no menu lateral.

    function selectSolution(index) {
      setSolution(index);

      if (!desktop.matches || !motionOK()) return;

      const travel = Math.max(
        0,
        solTall.offsetHeight - window.innerHeight
      );

      const top =
        solTall.getBoundingClientRect().top + window.scrollY;

      const destination =
        top + ((index + 0.5) / solutions.length) * travel;

      window.scrollTo({
        top: destination,
        behavior: 'smooth'
      });
    }

    solutionButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        selectSolution(index);
      });
    });

    // Navegação pelo teclado.

    solIndex.addEventListener('keydown', event => {
      const keys = [
        'ArrowDown',
        'ArrowUp',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End'
      ];

      if (!keys.includes(event.key)) return;

      event.preventDefault();

      const delta =
        ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1;

      let nextIndex;

      if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = solutions.length - 1;
      } else {
        nextIndex =
          (activeSolution + delta + solutions.length) %
          solutions.length;
      }

      selectSolution(nextIndex);

      solutionButtons[nextIndex].focus({
        preventScroll: true
      });
    });

    // Troca a solução conforme a rolagem da página.

    scrollTasks.push((_y, vh) => {
      if (!desktop.matches || !motionOK()) return;

      const rect = solTall.getBoundingClientRect();

      if (rect.top > vh || rect.bottom < 0) return;

      const travel = Math.max(
        1,
        solTall.offsetHeight - vh
      );

      const progress = clamp(-rect.top / travel);

      const index = Math.min(
        solutions.length - 1,
        Math.floor(progress * solutions.length)
      );

      setSolution(index);
    });

    // Cria uma apresentação contínua exclusiva para telas menores.
    // Cada solução terá sua própria imagem e texto no fluxo natural do scroll.
    const mobileSolutions = $('#solutionsMobile');

    if (mobileSolutions) {
      solutions.forEach((item, index) => {
        const article = document.createElement('article');
        article.className = 'solution-mobile-card';

        const visual = document.createElement('div');
        visual.className = 'solution-mobile-visual';

        const image = document.createElement('img');
        image.src = new URL(item.image, solutionsImageBase).href;
        image.alt = item.title + ' — apresentação da solução';
        image.loading = index === 0 ? 'eager' : 'lazy';
        visual.append(image);

        const content = document.createElement('div');
        content.className = 'solution-mobile-content';

        const number = document.createElement('span');
        number.className = 'solution-mobile-number';
        number.textContent = String(index + 1).padStart(2, '0') + ' / 08';

        const heading = document.createElement('h3');
        heading.textContent = item.title;

        content.append(number, heading);
        item.paragraphs.forEach(text => {
          const paragraph = document.createElement('p');
          paragraph.textContent = text;
          content.append(paragraph);
        });

        article.append(visual, content);
        mobileSolutions.append(article);
      });
    }

    // Inicializa a primeira solução.

    setSolution(0);
  }

  // =====================================================
  // MODAL DE IMAGENS E ZOOM
  // =====================================================

  const viewer = $('#imageViewer');
  const viewerImage = $('#viewerImage');

  let zoom = 1;

  function openImage(src, alt) {
    if (!viewer || !viewerImage) return;

    zoom = 1;

    viewerImage.style.width = '100%';
    viewerImage.src = src;
    viewerImage.alt = alt;

    viewer.showModal();
  }

  $('.zoom-art')?.addEventListener('click', () => {
    const img = $('#solArt');

    if (img && img.src) {
      openImage(img.src, img.alt);
    }
  });

  $('#viewerClose')?.addEventListener('click', () => {
    viewer.close();
  });

  $('#zoomIn')?.addEventListener('click', () => {
    zoom = Math.min(3, zoom + 0.25);

    viewerImage.style.width = `${zoom * 100}%`;
  });

  $('#zoomOut')?.addEventListener('click', () => {
    zoom = Math.max(1, zoom - 0.25);

    viewerImage.style.width = `${zoom * 100}%`;
  });

  // Imagens do portfólio.

  $$('.project-slot').forEach(button => {
    const img = new Image();

    img.alt = button
      .getAttribute('aria-label')
      .replace(', aguardando material', '');

    img.onload = () => {
      button.replaceChildren(img);

      button.setAttribute(
        'aria-label',
        'Ampliar ' + img.alt
      );

      button.addEventListener('click', () => {
        openImage(img.src, img.alt);
      });
    };

    img.onerror = () => {
      button.disabled = true;
    };

    img.src = button.dataset.photo;
  });

  // =====================================================
  // NOSSA REDE — INTERAÇÃO DO DIAGRAMA
  // =====================================================

  const orbit = $('#orbitWrap');

  if (orbit) {
    const cards = $$('.ocard-g', orbit);
    const lines = $$('.obit-ln', orbit);

    let tapTimeout;

    function highlight(index) {
      cards.forEach((card, i) => {
        card.classList.toggle('active', index === i);
        card.classList.toggle(
          'dim',
          index !== null && index !== i
        );
      });

      lines.forEach((line, i) => {
        line.classList.toggle('hi', index === i);
        line.classList.toggle(
          'lo',
          index !== null && index !== i
        );
      });
    }

    cards.forEach((card, i) => {
      card.addEventListener('mouseenter', () => {
        highlight(i);
      });

      card.addEventListener('mouseleave', () => {
        highlight(null);
      });

      card.addEventListener('click', () => {
        highlight(i);

        clearTimeout(tapTimeout);

        tapTimeout = setTimeout(() => {
          highlight(null);
        }, 2200);
      });
    });
  }

  // =====================================================
  // DEPOIMENTOS — CARROSSEL AUTOMÁTICO
  // =====================================================

  const testimonialTrack = $('#tWrap');
  const prev = $('#testimonialPrev');
  const next = $('#testimonialNext');
  const counter = $('#testimonialCounter');

  if (testimonialTrack) {
    const slides = $$('.t-item', testimonialTrack);

    let current = 0;
    let autoplayTimer = null;

    // Tempo entre depoimentos.
    const autoplayDelay = 5500;

    function showTestimonial(index) {
      if (!slides.length) return;

      current = (index + slides.length) % slides.length;

      slides.forEach((slide, i) => {
        const active = i === current;

        slide.hidden = !active;

        slide.classList.toggle(
          'is-active',
          active
        );

        slide.setAttribute(
          'aria-hidden',
          String(!active)
        );

        if (active) {
          slide.classList.add('in');
        }
      });

      if (counter) {
        counter.textContent =
          `${current + 1} / ${slides.length}`;
      }
    }

    function stopAutoplay() {
      if (autoplayTimer !== null) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();

      if (slides.length < 2 || document.hidden) return;

      autoplayTimer = setInterval(() => {
        showTestimonial(current + 1);
      }, autoplayDelay);
    }

    function goToTestimonial(index) {
      showTestimonial(index);
      startAutoplay();
    }

    prev?.addEventListener('click', () => {
      goToTestimonial(current - 1);
    });

    next?.addEventListener('click', () => {
      goToTestimonial(current + 1);
    });

    // Teclado.

    testimonialTrack.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToTestimonial(current - 1);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToTestimonial(current + 1);
      }
    });

    // Gesto horizontal no celular.

    let touchStartX = null;

    testimonialTrack.addEventListener('touchstart', event => {
      touchStartX =
        event.changedTouches[0]?.screenX ?? null;
    }, { passive: true });

    testimonialTrack.addEventListener('touchend', event => {
      if (touchStartX === null) return;

      const touchEndX =
        event.changedTouches[0]?.screenX ?? touchStartX;

      const distance = touchEndX - touchStartX;

      if (Math.abs(distance) > 45) {
        goToTestimonial(
          current + (distance < 0 ? 1 : -1)
        );
      }

      touchStartX = null;
    }, { passive: true });

    // Pausa quando a aba está em segundo plano.

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    showTestimonial(0);
    startAutoplay();
  }
    // =====================================================
  // FORMULÁRIO
  // =====================================================

  const form = $('#form-apresentacao');
  const submitButton = $('#leadBtn');
  const success = $('#leadSuccess');
  const formError = $('#leadFormErr');

  const pdfPath = 'assets/propostacomercial.pdf';

  const fields = [
    'nome',
    'empresa',
    'email',
    'whatsapp'
  ];

  const input = key => $(`#lead-${key}`);
  const error = key => $(`#lead-${key}-err`);

  const digits = value => value.replace(/\D/g, '');

  function phoneMask(value) {
    let number = digits(value).slice(0, 13);

    if (number.startsWith('55') && number.length > 11) {
      number = number.slice(2);
    }

    number = number.slice(0, 11);

    if (number.length <= 2) {
      return number ? `(${number}` : '';
    }

    if (number.length <= 6) {
      return `(${number.slice(0, 2)}) ${number.slice(2)}`;
    }

    if (number.length <= 10) {
      return `(${number.slice(0, 2)}) ${number.slice(2, 6)}-${number.slice(6)}`;
    }

    return `(${number.slice(0, 2)}) ${number.slice(2, 7)}-${number.slice(7)}`;
  }

  function clearError(key) {
    const element = error(key);
    const field = input(key);

    if (element) {
      element.hidden = true;
      element.textContent = '';
    }

    field?.removeAttribute('aria-invalid');
    field?.removeAttribute('aria-describedby');
  }

  function setError(key, message) {
    const element = error(key);
    const field = input(key);

    if (!element || !field) return;

    element.textContent = message;
    element.hidden = false;

    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', element.id);
  }

  if (form && submitButton && success) {
    fields.forEach(key => {
      input(key)?.addEventListener('input', () => {
        clearError(key);
      });
    });

    input('whatsapp')?.addEventListener('input', event => {
      event.target.value = phoneMask(event.target.value);
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();

      if (submitButton.disabled) return;

      fields.forEach(clearError);

      if (formError) {
        formError.hidden = true;
      }

      const values = Object.fromEntries(
        fields.map(key => [
          key,
          input(key)?.value.trim() || ''
        ])
      );

      let valid = true;

      if (values.nome.length < 2) {
        setError('nome', 'Informe seu nome.');
        valid = false;
      }

      if (values.empresa.length < 2) {
        setError('empresa', 'Informe sua empresa.');
        valid = false;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) {
        setError('email', 'Informe um e-mail válido.');
        valid = false;
      }

      const phone = digits(values.whatsapp);

      if (![10, 11].includes(phone.length)) {
        setError('whatsapp', 'Informe um WhatsApp válido com DDD.');
        valid = false;
      }

      if (!valid) {
        fields
          .map(key => input(key))
          .find(field =>
            field?.getAttribute('aria-invalid') === 'true'
          )
          ?.focus();

        return;
      }

      const originalContent = submitButton.innerHTML;

      submitButton.disabled = true;

      submitButton.innerHTML =
        '<span class="lead-spinner" aria-hidden="true"></span> Preparando apresentação...';

      try {
        const response = await fetch(pdfPath, {
          method: 'GET',
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(
            `PDF indisponível (HTTP ${response.status})`
          );
        }

        const blob = await response.blob();

        if (!blob.size) {
          throw new Error('Arquivo PDF vazio.');
        }

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'Apresentacao-Aborghetti.pdf';

        document.body.appendChild(link);

        link.click();
        link.remove();

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 30000);

        form.hidden = true;
        success.hidden = false;

        success.setAttribute('tabindex', '-1');

        success.focus({
          preventScroll: true
        });

      } catch (err) {
        if (formError) {
          formError.textContent =
            'Não foi possível baixar a apresentação. Confira se o arquivo assets/propostacomercial.pdf existe e tente novamente.';

          formError.hidden = false;
          formError.setAttribute('tabindex', '-1');

          formError.focus({
            preventScroll: true
          });
        }

        console.warn(
          '[Aborghetti] Erro no download:',
          err
        );

      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalContent;
      }
    });
  }

  // =====================================================
  // ANO AUTOMÁTICO NO RODAPÉ
  // =====================================================

  const year = $('#year');

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  // =====================================================
  // PARTÍCULAS THREE.JS
  // =====================================================

  const canvas = $('#heroParticles');

  if (canvas && window.THREE && motionOK()) {
    try {
      const hero = $('.hero');

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
      });

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        60,
        1,
        0.1,
        200
      );

      camera.position.z = 60;

      const count = 110;

      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      const palette = [
        [0.49, 0.36, 1],
        [0.78, 0, 0.49],
        [0.85, 0.82, 1]
      ];

      for (let i = 0; i < count; i++) {
        positions[i * 3] =
          (Math.random() - 0.5) * 120;

        positions[i * 3 + 1] =
          (Math.random() - 0.5) * 70;

        positions[i * 3 + 2] =
          (Math.random() - 0.5) * 40;

        colors.set(
          palette[i % palette.length],
          i * 3
        );
      }

      const geometry = new THREE.BufferGeometry();

      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );

      geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3)
      );

      const material = new THREE.PointsMaterial({
        size: 1.4,
        vertexColors: true,
        transparent: true,
        opacity: 0.45,
        depthWrite: false
      });

      const points = new THREE.Points(
        geometry,
        material
      );

      scene.add(points);

      let visible = true;

      if ('IntersectionObserver' in window && hero) {
        new IntersectionObserver(entries => {
          visible = entries[0].isIntersecting;
        }).observe(hero);
      }

      function resize() {
        if (!hero) return;

        const width = hero.clientWidth;
        const height = hero.clientHeight;

        if (!width || !height) return;

        renderer.setPixelRatio(
          Math.min(window.devicePixelRatio || 1, 1.75)
        );

        renderer.setSize(width, height, false);

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      resize();

      window.addEventListener(
        'resize',
        resize,
        { passive: true }
      );

      let time = 0;

      function animate() {
        requestAnimationFrame(animate);

        if (
          !visible ||
          document.hidden ||
          reducedMotion.matches
        ) {
          return;
        }

        time += 0.002;

        points.rotation.y = Math.sin(time) * 0.07;
        points.rotation.z = Math.cos(time * 0.7) * 0.02;

        camera.position.x +=
          (pointerX * 3 - camera.position.x) * 0.03;

        camera.position.y +=
          (-pointerY * 2 - camera.position.y) * 0.03;

        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      }

      requestAnimationFrame(animate);

    } catch (err) {
      console.info(
        '[Aborghetti] Partículas desativadas:',
        err.message
      );
    }
  }

  // =====================================================
  // EVENTOS FINAIS DE SCROLL E REDIMENSIONAMENTO
  // =====================================================

  window.addEventListener(
    'scroll',
    scheduleScroll,
    { passive: true }
  );

  window.addEventListener(
    'resize',
    scheduleScroll,
    { passive: true }
  );

  scheduleScroll();

})();