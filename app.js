(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const desktop = () => innerWidth > 860;

  gsap.registerPlugin(ScrollTrigger);

  /* ——— split helpers ——— */
  function split(el) {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach(c => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.innerHTML = c === ' ' ? '&nbsp;' : c;
      el.appendChild(s);
    });
    return $$('.ch', el);
  }
  // split only text nodes, keep <br>/<em> structure
  function splitKeep(el) {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3 && n.textContent.trim()) {
          const frag = document.createDocumentFragment();
          [...n.textContent].forEach(c => {
            if (c === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'ch';
            s.textContent = c;
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'EM' && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return $$('.ch', el);
  }

  $$('[data-split]').forEach(splitKeep);
  $$('[data-split-hover]').forEach(splitKeep);

  if (reduced) {
    document.body.classList.remove('loading');
    document.body.classList.add('no-motion');
    $('.loader')?.remove();
    return; // static, readable page
  }

  /* ——— smooth scroll ——— */
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();

  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => document.documentElement.style.setProperty('--progress', self.progress)
  });

  /* ——— cursor ——— */
  if (fine) {
    const dot = $('.cursor-dot'), ring = $('.cursor-ring'), label = $('.cursor-label');
    const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    addEventListener('pointermove', e => {
      gsap.set(dot, { x: e.clientX, y: e.clientY });
      rx(e.clientX); ry(e.clientY);
    });
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', () => { ring.classList.add('is-on'); label.textContent = el.dataset.cursor; });
      el.addEventListener('pointerleave', () => { ring.classList.remove('is-on'); label.textContent = ''; });
    });
  } else { $('.cursor-dot')?.remove(); $('.cursor-ring')?.remove(); }

  /* ——— magnetic ——— */
  if (fine) $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.35, y: (e.clientY - r.top - r.height / 2) * 0.45, duration: 0.4 });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,.45)' }));
  });

  /* ——— hero pieces ——— */
  const heroChars = $$('.hero-title .ch');
  gsap.set(heroChars, { yPercent: 118, rotate: 8 });
  gsap.set('.hero-topline, .hero-roles, .hero-bottom', { autoAlpha: 0, y: 30 });
  gsap.set('.prop', { autoAlpha: 0, scale: 0.4, rotate: () => gsap.utils.random(-160, 160) });

  /* ——— loader ——— */
  const loadTl = gsap.timeline({
    onComplete() {
      document.body.classList.remove('loading');
      lenis.start();
      ScrollTrigger.refresh();
    }
  });
  loadTl
    .to('.loader-name span', { y: 0, yPercent: 0, startAt: { yPercent: 110 }, duration: 0.9, stagger: 0.06, ease: 'power4.out' })
    .to('.loader-bar i', { scaleX: 1, duration: 1.0, ease: 'power2.inOut' }, '-=.5')
    .to('.loader-name span', { yPercent: -115, duration: 0.6, stagger: 0.04, ease: 'power3.in' }, '+=.15')
    .to('.loader', { yPercent: -100, duration: 0.85, ease: 'power4.inOut' }, '-=.25')
    .set('.loader', { display: 'none' })
    // hero entrance
    .to(heroChars, { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.045, ease: 'power4.out' }, '-=.55')
    .to('.hero-sub', { clipPath: 'inset(0 0 -10% 0)', duration: 1, ease: 'power3.out' }, '-=.7')
    .to('.hero-topline, .hero-roles, .hero-bottom', { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12 }, '-=.8')
    .to('.prop', { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.2, stagger: 0.09, ease: 'elastic.out(1,.55)' }, '-=.9');

  /* ——— velocity: stretch & skew the big type, speed the marquees ——— */
  const skewTo = gsap.quickTo('.hero-title', 'skewX', { duration: 0.5, ease: 'power3' });
  const stretchTo = gsap.quickTo('.hero-title', 'scaleY', { duration: 0.5, ease: 'power3' });
  let marqueeTweens = [];
  $$('[data-marquee], [data-marquee-reverse], [data-marquee-slow]').forEach(m => {
    const row = $('.marquee-row', m);
    const dir = m.hasAttribute('data-marquee-reverse') ? 1 : -1;
    const dur = m.hasAttribute('data-marquee-slow') ? 30 : 16;
    const tw = gsap.to(row, { xPercent: 50 * dir, repeat: -1, ease: 'none', duration: dur });
    tw.progress(0.5); // start mid-loop so both directions are seamless
    marqueeTweens.push({ tw, dir });
  });
  lenis.on('scroll', e => {
    const v = gsap.utils.clamp(-18, 18, e.velocity);
    skewTo(v * -0.35);
    stretchTo(1 + Math.min(Math.abs(v) * 0.006, 0.12));
    marqueeTweens.forEach(({ tw }) => tw.timeScale(gsap.utils.clamp(0.6, 4, 1 + Math.abs(v) * 0.12)));
  });

  /* ——— props: pointer parallax, scroll drift, drag ——— */
  const props = $$('.prop');
  if (fine) {
    let px = 0, py = 0;
    addEventListener('pointermove', e => {
      px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5;
      props.forEach(p => {
        const d = +p.dataset.depth || 16;
        gsap.to(p, { xPercent: px * d, yPercent: py * d, duration: 1.1, ease: 'power3.out' });
      });
    }, { passive: true });
  }
  props.forEach(p => {
    gsap.to(p, {
      rotate: () => gsap.utils.random(-24, 24),
      y: () => gsap.utils.random(-70, 70),
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 }
    });
    // drag
    let drag = false, sx = 0, sy = 0, dx = 0, dy = 0;
    p.addEventListener('pointerdown', e => { drag = true; sx = e.clientX - dx; sy = e.clientY - dy; p.setPointerCapture(e.pointerId); });
    p.addEventListener('pointermove', e => {
      if (!drag) return;
      dx = gsap.utils.clamp(-180, 180, e.clientX - sx); dy = gsap.utils.clamp(-180, 180, e.clientY - sy);
      gsap.set(p, { x: dx, y: dy });
    });
    const up = () => drag = false;
    p.addEventListener('pointerup', up); p.addEventListener('pointercancel', up);
  });

  /* ——— role flipper ——— */
  const words = $$('.role-word');
  let wi = 0;
  setInterval(() => {
    const cur = words[wi]; wi = (wi + 1) % words.length; const nxt = words[wi];
    gsap.to(cur, { rotateX: 92, autoAlpha: 0, duration: 0.5, ease: 'power2.in' });
    gsap.fromTo(nxt, { rotateX: -92, autoAlpha: 0 }, { rotateX: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', delay: 0.35 });
  }, 2600);

  /* ——— generic char-heading reveals (outside hero) ——— */
  $$('.panel-title, .intro-huge, .about-h').forEach(h => {
    const chars = $$('.ch', h);
    gsap.set(chars, { yPercent: 115 });
    h.style.overflow = 'hidden';
  });

  /* ——— line reveals ——— */
  $$('.reveal-lines p').forEach(p => {
    gsap.to(p, {
      clipPath: 'inset(0 0 -10% 0)', duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: p, start: 'top 85%' }
    });
  });

  /* ——— count-ups ——— */
  function countUp(el, trigger, containerAnimation) {
    const target = +el.dataset.count;
    const obj = { v: target > 5 ? 1 : 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: 'power2.out',
      onUpdate: () => el.textContent = Math.round(obj.v),
      scrollTrigger: { trigger, start: containerAnimation ? 'left 70%' : 'top 80%', containerAnimation, horizontal: !!containerAnimation }
    });
  }

  /* ——— work section: pinned horizontal on desktop ——— */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const track = $('.work-track');
    const amount = () => track.scrollWidth - innerWidth;
    const scrollTween = gsap.to(track, {
      x: () => -amount(), ease: 'none',
      scrollTrigger: {
        trigger: '.work', start: 'top top', end: () => '+=' + amount(),
        pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1
      }
    });
    $$('.panel').forEach(panel => {
      const title = $$('.panel-title .ch, .intro-huge .ch', panel);
      if (title.length) gsap.to(title, {
        yPercent: 0, duration: 0.9, stagger: 0.025, ease: 'power4.out',
        scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: 'left 72%', horizontal: true }
      });
      const inner = $('.panel-inner', panel);
      if (inner) gsap.fromTo(inner, { x: 110 }, {
        x: -110, ease: 'none',
        scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: 'left right', end: 'right left', scrub: true, horizontal: true }
      });
      const ghost = $('.panel-ghost', panel);
      if (ghost) gsap.fromTo(ghost, { xPercent: 22 }, {
        xPercent: -14, ease: 'none',
        scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: 'left right', end: 'right left', scrub: true, horizontal: true }
      });
    });
    gsap.from('.ops-console', {
      scale: 0.85, autoAlpha: 0, rotate: 8, duration: 0.9, ease: 'back.out(1.5)',
      scrollTrigger: { trigger: '.panel-kge', containerAnimation: scrollTween, start: 'left 65%', horizontal: true }
    });
    gsap.from('.bubble', {
      scale: 0, autoAlpha: 0, duration: 0.7, stagger: 0.16, ease: 'back.out(2.2)',
      scrollTrigger: { trigger: '.panel-community', containerAnimation: scrollTween, start: 'left 65%', horizontal: true }
    });
    $$('.onetoten .count-to').forEach(el => countUp(el, '.panel-classes', scrollTween));

    // anchor into the pinned area
    const st = scrollTween.scrollTrigger;
    $$('a[href="#community"]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); lenis.scrollTo(st.end - 2);
    }));
    $$('a[href="#work"]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); lenis.scrollTo(st.start + amount() * 0.18);
    }));
    return () => {};
  });

  mm.add('(max-width: 860px)', () => {
    $$('.panel').forEach(panel => {
      const title = $$('.panel-title .ch, .intro-huge .ch', panel);
      if (title.length) gsap.to(title, {
        yPercent: 0, duration: 0.9, stagger: 0.02, ease: 'power4.out',
        scrollTrigger: { trigger: panel, start: 'top 72%' }
      });
    });
    gsap.from('.ops-console', {
      scale: 0.85, autoAlpha: 0, rotate: 8, duration: 0.9, ease: 'back.out(1.5)',
      scrollTrigger: { trigger: '.panel-kge', start: 'top 60%' }
    });
    gsap.from('.bubble', {
      scale: 0, autoAlpha: 0, duration: 0.7, stagger: 0.16, ease: 'back.out(2.2)',
      scrollTrigger: { trigger: '.panel-community', start: 'top 60%' }
    });
    $$('.onetoten .count-to').forEach(el => countUp(el, '.panel-classes', null));
    return () => {};
  });

  /* ——— about heading + stats ——— */
  gsap.to('.about-h .ch', {
    yPercent: 0, duration: 0.9, stagger: 0.02, ease: 'power4.out',
    scrollTrigger: { trigger: '.about-h', start: 'top 80%' }
  });
  $$('.stat strong span[data-count]').forEach(el => countUp(el, el.closest('.stat'), null));
  gsap.from('.stat', {
    yPercent: 40, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.stats', start: 'top 80%' }
  });

  /* ——— tilt ——— */
  if (fine) {
    $$('[data-tilt] .panel-visual > *').forEach(card => {
      const panel = card.closest('.panel');
      panel.addEventListener('pointermove', e => {
        const r = panel.getBoundingClientRect();
        gsap.to(card, {
          rotateY: ((e.clientX - r.left) / r.width - 0.5) * 14,
          rotateX: ((e.clientY - r.top) / r.height - 0.5) * -14,
          transformPerspective: 900, duration: 0.6
        });
      });
      panel.addEventListener('pointerleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.9, ease: 'elastic.out(1,.5)' }));
    });
    const id = $('.id-card');
    if (id) {
      addEventListener('pointermove', e => {
        const r = id.getBoundingClientRect();
        if (r.top > innerHeight || r.bottom < 0) return;
        gsap.to(id, {
          rotateY: ((e.clientX - innerWidth / 2) / innerWidth) * 26,
          rotateX: ((e.clientY - innerHeight / 2) / innerHeight) * -20,
          transformPerspective: 1100, duration: 0.8
        });
      }, { passive: true });
    }
  }
  gsap.to('.id-card', { y: -22, repeat: -1, yoyo: true, duration: 2.6, ease: 'sine.inOut' });

  /* ——— hyperframes: inline video loops ——— */
  $$('.hyperframe').forEach(hf => {
    const vid = $('video', hf);
    gsap.from(hf, {
      scale: 0.72, autoAlpha: 0, rotate: () => gsap.utils.random(-8, 8),
      duration: 1, ease: 'back.out(1.6)',
      scrollTrigger: { trigger: hf, start: 'top 88%' }
    });
    if (fine && vid) {
      hf.addEventListener('pointerenter', () => gsap.to(hf, { scale: 1.06, rotate: 0, duration: 0.5, ease: 'power3.out' }));
      hf.addEventListener('pointerleave', () => gsap.to(hf, { scale: 1, duration: 0.6, ease: 'power3.out' }));
    }
  });
  // hero reel follows a lazy orbit
  const reel = $('.hero-reel');
  if (reel) gsap.to(reel, { y: -16, rotate: 5, repeat: -1, yoyo: true, duration: 3.2, ease: 'sine.inOut' });

  /* ——— KGE ops console: live agent loop ——— */
  const opsAgents = $$('.ops-agent');
  const opsLog = $('.ops-log');
  if (opsAgents.length && opsLog) {
    const feed = [
      ['scanning 14 legal sources…', 'found 12 new rulings', 'queued 3 knowledge gaps'],
      ['structuring knowledge…', 'extracted 23 clauses', 'linked 41 relationships'],
      ['auditing claims…', '3 conflicting rulings detected', 'flagged 2 missing citations'],
      ['investigating conflicts…', 'resolved 2 of 3 conflicts', 're-queued 1 research task']
    ];
    const names = ['Researcher', 'Curator', 'Sentinel', 'Resolver'];
    let ai = 0, minute = 36;
    setInterval(() => {
      ai = (ai + 1) % 4;
      opsAgents.forEach((a, i) => a.classList.toggle('is-active', i === ai));
      const msg = feed[ai][Math.floor(Math.random() * feed[ai].length)];
      opsAgents[ai].querySelector('.ops-status').textContent = msg;
      minute = (minute + 1) % 60;
      const line = document.createElement('div');
      line.textContent = `14:${String(minute).padStart(2, '0')} ${names[ai]} — ${msg}`;
      opsLog.prepend(line);
      gsap.from(line, { yPercent: 70, autoAlpha: 0, duration: 0.5 });
      while (opsLog.children.length > 4) opsLog.lastChild.remove();
    }, 1700);
  }

  /* ——— Agent Arena: live debate loop ——— */
  const arena = $('.arena');
  if (arena) {
    const feedEl = $('.arena-feed', arena);
    const fill = $('.arena-fill', arena);
    const sA = $('.score-a', arena), sB = $('.score-b', arena);
    const roundEl = $('.arena-round', arena);
    const debate = [
      ['a', 'Video can’t see you’re stuck. A tutor adapts in seconds.', 57],
      ['b', 'Adaptivity without rigor is noise — lectures are vetted.', 51],
      ['a', 'Vetted, static, and skipped. Tutors check understanding every turn.', 59],
      ['b', 'And when the tutor hallucinates in a classroom?', 53],
      ['a', 'Ground every claim. Log every answer for the teacher.', 62],
      ['judge', 'JUDGE — PRO takes it 62–38: adaptivity plus grounded claims.', 62]
    ];
    let step = 0, typer = 0;
    feedEl.innerHTML = '';
    function speak() {
      if (step >= debate.length) {
        step = 0;
        gsap.to([...feedEl.children], {
          autoAlpha: 0, y: -16, stagger: 0.07, duration: 0.45,
          onComplete() { feedEl.innerHTML = ''; gsap.set(fill, { width: '50%' }); sA.textContent = 50; sB.textContent = 50; setTimeout(speak, 600); }
        });
        return;
      }
      const [side, text, score] = debate[step++];
      const b = document.createElement('div');
      b.className = 'a-bubble ' + (side === 'judge' ? 'judge' : side);
      b.innerHTML = `<b>${side === 'a' ? 'AGENT A · PRO' : side === 'b' ? 'AGENT B · CON' : '⚖ JUDGE'}</b><span></span>`;
      feedEl.appendChild(b);
      while (feedEl.children.length > 3) feedEl.firstChild.remove();
      gsap.from(b, { y: 20, autoAlpha: 0, duration: 0.4, ease: 'power3.out' });
      const span = b.querySelector('span');
      let i = 0;
      typer = setInterval(() => {
        span.textContent = text.slice(0, ++i);
        if (i >= text.length) {
          clearInterval(typer);
          gsap.to(fill, { width: score + '%', duration: 0.8, ease: 'power3.out' });
          sA.textContent = score; sB.textContent = 100 - score;
          roundEl.textContent = 'ROUND ' + Math.min(3, Math.ceil(step / 2)) + ' / 3';
          setTimeout(speak, 1000);
        }
      }, 26);
    }
    speak();
  }

  /* ——— contact letters ——— */
  $$('.contact-huge .ch').forEach(ch => {
    ch.addEventListener('pointerenter', () => {
      gsap.fromTo(ch, { y: 0 }, { y: -0.14 * ch.offsetHeight, duration: 0.3, ease: 'power3.out', yoyo: true, repeat: 1 });
    });
  });
  gsap.from('.contact-huge .line', {
    yPercent: 60, autoAlpha: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out',
    scrollTrigger: { trigger: '.contact', start: 'top 70%' }
  });

  /* ——— plain anchors through lenis ——— */
  $$('a[href^="#"]').forEach(a => {
    const href = a.getAttribute('href');
    if (href === '#work' || href === '#community') return; // handled above on desktop
    a.addEventListener('click', e => {
      const t = href === '#top' ? 0 : $(href);
      if (t === null) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: href === '#about' ? -40 : 0 });
    });
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
