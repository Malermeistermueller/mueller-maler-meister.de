/* Malermeister Müller — Bewegung (Fassung 4 „Der Anstrich").
   Alles additiv: ohne JavaScript ist jede Seite vollständig lesbar. */
(() => {
  const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const kopf = document.querySelector('.kopf');
  const walze = document.querySelector('.walze b');

  /* ── Kopf: fest ab 40 px, weg beim Runterscrollen, zurück beim Hoch ─── */
  let letzte = 0;
  const beiScroll = () => {
    const y = scrollY;
    if (kopf) {
      kopf.classList.toggle('fest', y > 40);
      kopf.classList.toggle('weg', y > 520 && y > letzte && !document.querySelector('.nav.offen'));
    }
    // Die Walze oben: der Farbstrich füllt sich mit dem Scroll
    if (walze) {
      const h = document.documentElement.scrollHeight - innerHeight;
      walze.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h) : 0})`;
    }
    letzte = y;
  };
  addEventListener('scroll', beiScroll, { passive: true });
  beiScroll();

  /* ── Mobilmenü ────────────────────────────────────────────────────────── */
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const offen = nav.classList.toggle('offen');
      burger.setAttribute('aria-expanded', offen ? 'true' : 'false');
      document.documentElement.classList.toggle('menu-offen', offen);
    });
  }

  /* ── Reveal ───────────────────────────────────────────────────────────── */
  const aufs = document.querySelectorAll('.auf');
  /* 🔴 Nach dem Einblenden die Reveal-Klassen abnehmen (Noah, 02.10.2026: „bei dem In-Detail-Teil
     hängt die Animation überall"). Sonst trägt die Karte die Reveal-Verzögerung (bis 0,3 s) auch
     beim Drübergehen — die Bewegung kommt zu spät und wirkt hängend. `da` bleibt (Achse, Wischer, Karte). */
  const zeigen = (el) => {
    if (el.classList.contains('da')) return;
    el.classList.add('da');
    setTimeout(() => el.classList.remove('auf', 'v2', 'v3', 'v4'), 1500);
  };
  if (!ruhig && 'IntersectionObserver' in window) {
    const beo = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { zeigen(e.target); beo.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    aufs.forEach((el) => beo.observe(el));
    setTimeout(() => aufs.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight) zeigen(el); }), 3000);   // Sicherheitsnetz
  } else {
    aufs.forEach((el) => el.classList.add('da'));
  }
  // Einzelstücke mit eigener Einblende-Bewegung (Wischer), die selbst kein .auf tragen
  document.querySelectorAll('.wisch:not(.auf)').forEach((el) => el.classList.add('da'));

  /* ── Hero: der Farbstrich zieht beim Laden auf ────────────────────────── */
  requestAnimationFrame(() => document.querySelectorAll('.held').forEach((h) => h.classList.add('da')));

  /* ── Scroll-Scrub: `--p` 0…1, während das Element durchs Bild wandert ─── */
  const scrubs = [...document.querySelectorAll('[data-scrub]')];
  if (!ruhig && scrubs.length) {
    let lauft = false;
    const rechnen = () => {
      lauft = false;
      const fh = innerHeight;
      scrubs.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > fh + 100) return;
        // 0 = Oberkante erreicht den unteren Bildrand · 1 = Element steht im oberen Drittel
        if (el.classList.contains('fuellung')) {
          // 🔴 Skill scroll-text (Noah, 22.09.2026): das TEXTELEMENT wird gemessen, die
          // Füllung läuft durch die Bildmitte — Start bei 78 % der Fensterhöhe, voll bei 32 %,
          // halb gefüllt = zentriert.
          const p = Math.min(1, Math.max(0, (fh * 0.78 - r.top) / (fh * 0.46)));
          el.style.setProperty('--p', p.toFixed(3));
          const w = el.querySelectorAll('.w'); const n = w.length;
          w.forEach((s, i) => s.classList.toggle('an', (i + 1) / n <= p + 0.02)); // Noah, 22.09.2026 abends: Effekt klar sichtbar, läuft in beide Richtungen
          return;
        }
        const p = Math.min(1, Math.max(0, (fh * 0.92 - r.top) / (fh * 0.62)));
        el.style.setProperty('--p', p.toFixed(3));
      });
    };
    const anstossen = () => { if (!lauft) { lauft = true; requestAnimationFrame(rechnen); } };
    addEventListener('scroll', anstossen, { passive: true });
    addEventListener('resize', anstossen);
    rechnen();
  } else {
    scrubs.forEach((el) => { el.style.setProperty('--p', '1'); el.querySelectorAll('.w').forEach((s) => s.classList.add('an')); });
  }

  /* ── Kennzahlen zählen hoch, wenn sie ins Bild kommen ─────────────────── */
  const kpis = [...document.querySelectorAll('.kpi b[data-zahl]')];
  if (!ruhig && kpis.length && 'IntersectionObserver' in window) {
    const zaehl = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target, ziel = el.dataset.zahl, num = parseInt(ziel, 10);
        zaehl.unobserve(el);
        if (isNaN(num)) return;
        const start = performance.now(), dauer = num > 100 ? 1400 : 900;
        const tick = (t) => {
          const p = Math.min(1, (t - start) / dauer), e2 = 1 - Math.pow(1 - p, 3);
          el.textContent = ziel.replace(String(num), String(Math.round(num * e2)));
          if (p < 1) requestAnimationFrame(tick); else el.textContent = ziel;
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    kpis.forEach((el) => zaehl.observe(el));
  }

  /* ── Kontaktformular ──────────────────────────────────────────────────────
     Solange kein Formular-Endpunkt eingerichtet ist (FORMULAR_ZIEL in build.py),
     trägt das Formular `data-mailto` und öffnet das E-Mail-Programm mit der
     fertigen Nachricht. 🔴 Der Knopf darf nie scheinbar senden und nichts tun —
     eine verlorene Anfrage merkt der Betrieb erst, wenn der Kunde woanders ist. */
  const pruefen = (f) => {
    let gut = true;
    f.querySelectorAll('[required]').forEach((el) => {
      const ok = el.checkValidity();
      el.closest('.feld')?.classList.toggle('fehler', !ok);
      if (!ok && gut) { el.focus(); gut = false; }
    });
    return gut;
  };
  document.querySelectorAll('form.formular').forEach((f) => f.addEventListener('input', (e) => {
    const feld = e.target.closest('.feld'); if (feld && e.target.checkValidity()) feld.classList.remove('fehler');
  }));
  const form = document.querySelector('form[data-mailto]');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!pruefen(form)) return;
    const v = (n) => (form.elements[n] && form.elements[n].value !== undefined ? form.elements[n].value.trim() : '');
    const themen = [...form.querySelectorAll('input[name="thema"]:checked')].map((c) => c.value).join(', ');
    const text = [
      themen ? 'Es geht um: ' + themen : '',
      'Name: ' + v('name'),
      v('telefon') ? 'Telefon: ' + v('telefon') : '',
      'E-Mail: ' + v('mail'),
      v('ort') ? 'Ort des Objekts: ' + v('ort') : '',
      '',
      v('nachricht'),
    ].filter((z, i) => z || i === 5).join('\n');
    location.href = 'mailto:' + form.dataset.mailto
      + '?subject=' + encodeURIComponent('Anfrage über die Website')
      + '&body=' + encodeURIComponent(text);
  });

  const formPost = document.querySelector('form.formular:not([data-mailto])');
  if (formPost) formPost.addEventListener('submit', (e) => { if (!pruefen(formPost)) e.preventDefault(); });

  /* ── Referenzen: Filter oben, ein Klick zeigt nur diesen Bereich ─────────
     (Noah, 02.10.2026: „nicht, dass man runter scrollt, sondern einfach, dass man oben das super simpel hat"). */
  const knoepfe = [...document.querySelectorAll('.filter-knopf')];
  const refs = [...document.querySelectorAll('.ref')];
  const filtern = (k, still) => {
    knoepfe.forEach((b) => b.setAttribute('aria-pressed', b.dataset.filter === k ? 'true' : 'false'));
    let n = 0;
    refs.forEach((r) => {
      const an = k === 'alle' || r.dataset.kat === k;
      r.classList.toggle('weg', !an);
      r.classList.remove('rein');
      if (an && !still && !ruhig) { r.style.setProperty('--i', Math.min(n, 14)); void r.offsetWidth; r.classList.add('rein'); }
      if (an) n++;
    });
    if (!still) history.replaceState(null, '', k === 'alle' ? location.pathname : '#' + k);
  };
  /* Ausgerichtete Reihen: jedes Bild einer Reihe gleich hoch, nichts beschnitten. 🔴 Eine letzte
     Reihe mit EINEM Bild sieht aus wie ein Fehler (Regel 25.09.2026) — sie wird in die Reihe davor gezogen. */
  const raster = document.querySelector('.ref-raster');
  const ausrichten = () => {
    if (!raster) return;
    const W = raster.clientWidth, g = parseFloat(getComputedStyle(raster).columnGap) || 16;
    // 🔴 Handy: ruhiges Zweier-Raster (gleich große Vorschau, ganzes Bild in der Großansicht) — ausgerichtete
    // Reihen machten Hochformate 88 px schmal und die Unterschrift fünfzeilig (Handy-Prüfung 02.10.2026).
    const handy = W < 700;
    raster.classList.toggle('handy', handy);
    if (handy) { refs.forEach((r) => { r.style.width = ''; }); raster.classList.remove('gerechnet'); return; }
    const ziel = 270;
    const sicht = refs.filter((r) => !r.classList.contains('weg'));
    const reihen = []; let lauf = [], summe = 0;
    sicht.forEach((r) => {
      const v = parseFloat(r.style.getPropertyValue('--verh')) || 1.33;
      lauf.push([r, v]); summe += v;
      if (summe * ziel + g * (lauf.length - 1) >= W) { reihen.push([lauf, summe, true]); lauf = []; summe = 0; }
    });
    if (lauf.length) {
      if (lauf.length === 1 && reihen.length) { const vor = reihen[reihen.length - 1]; vor[0].push(...lauf); vor[1] += summe; }
      else reihen.push([lauf, summe, false]);
    }
    reihen.forEach(([reihe, sum, voll]) => {
      const platz = W - g * (reihe.length - 1);
      // Volle Reihe: genau auf Breite. Letzte Reihe: darf bis 35 % höher werden, um zu füllen — sonst steht sie mittig.
      const h = voll ? platz / sum : Math.min(platz / sum, ziel * 1.35);
      reihe.forEach(([r, v]) => { r.style.width = Math.floor(v * h) + 'px'; });
    });
    raster.classList.add('gerechnet');
  };
  if (raster) { ausrichten(); new ResizeObserver(() => ausrichten()).observe(raster); }

  if (knoepfe.length) {
    knoepfe.forEach((b) => b.addEventListener('click', () => { filtern(b.dataset.filter); ausrichten(); }));
    const start = location.hash.slice(1);
    if (knoepfe.some((b) => b.dataset.filter === start)) { filtern(start, true); ausrichten(); }
  }

  /* ── Großansicht: jedes Referenz- und Galeriebild mit einem Klick groß ── */
  const pfeil = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12h15M13.5 6l6 6-6 6"/></svg>';
  const plus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5.5v13M5.5 12h13"/></svg>';
  const quellen = [...document.querySelectorAll('.ref-knopf img, .ref img.ref-mehr, .galerie figure > img')];
  if (quellen.length) {
    const box = document.createElement('div');
    box.className = 'grossbild'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Bild groß ansehen');
    box.innerHTML = '<button class="zurueck" aria-label="Vorheriges Bild">' + pfeil + '</button><figure><img alt=""><figcaption></figcaption></figure>'
      + '<button class="vor" aria-label="Nächstes Bild">' + pfeil + '</button><button class="zu" aria-label="Schließen">' + plus + '</button><span class="zaehler"></span>';
    document.body.appendChild(box);
    const gImg = box.querySelector('img'), gText = box.querySelector('figcaption'), gZahl = box.querySelector('.zaehler');
    let liste = [], pos = 0, vorher = null;
    // Ein Projekt = eine Kachel; seine weiteren Fotos sind versteckt und gehören trotzdem in die Großansicht.
    const sichtbar = () => quellen.filter((i) => { const f = i.closest('.ref'); return f ? !f.classList.contains('weg') : i.offsetParent !== null; });
    const zeige = () => {
      const q = liste[pos];
      gImg.removeAttribute('srcset');
      if (q.srcset) { gImg.srcset = q.srcset; gImg.sizes = '100vw'; }
      gImg.src = q.currentSrc || q.src; gImg.alt = q.alt;
      const cap = q.closest('figure')?.querySelector('figcaption');
      gText.innerHTML = cap ? cap.innerHTML : '';
      gZahl.textContent = (pos + 1) + ' / ' + liste.length;
    };
    const auf = (img) => {
      liste = sichtbar(); pos = Math.max(0, liste.indexOf(img)); vorher = document.activeElement;
      zeige(); box.classList.add('offen'); document.documentElement.classList.add('menu-offen'); box.querySelector('.zu').focus();
    };
    const zu = () => { box.classList.remove('offen'); document.documentElement.classList.remove('menu-offen'); vorher?.focus(); };
    const schritt = (d) => { pos = (pos + d + liste.length) % liste.length; zeige(); };
    quellen.filter((img) => !img.classList.contains('ref-mehr')).forEach((img) => (img.closest('.ref-knopf') || img).addEventListener('click', () => auf(img)));
    box.querySelector('.vor').addEventListener('click', () => schritt(1));
    box.querySelector('.zurueck').addEventListener('click', () => schritt(-1));
    box.querySelector('.zu').addEventListener('click', zu);
    box.addEventListener('click', (e) => { if (e.target === box || e.target.tagName === 'FIGURE') zu(); });
    addEventListener('keydown', (e) => {
      if (!box.classList.contains('offen')) return;
      if (e.key === 'Escape') zu(); else if (e.key === 'ArrowRight') schritt(1); else if (e.key === 'ArrowLeft') schritt(-1);
    });
    let x0 = null;
    box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) schritt(dx < 0 ? 1 : -1); x0 = null; });
  }
})();
