const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const revealItems = document.querySelectorAll(".reveal");

if (navToggle && header) {
  navToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (!header || !navToggle) return;
    header.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((item) => observer.observe(item));

// 3D tilt interactif sur la photo
const photoWrap = document.querySelector(".hero-photo-wrap");
const heroPhoto = document.querySelector(".hero-photo");

if (photoWrap && heroPhoto) {
  let raf = null;
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  document.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5);
    const y = (e.clientY / window.innerHeight - 0.5);
    targetX = x * 18;
    targetY = -y * 12;

    if (!raf) {
      raf = requestAnimationFrame(animateTilt);
    }
  });

  function animateTilt() {
    currentX += (targetX - currentX) * 0.1;
    currentY += (targetY - currentY) * 0.1;

    photoWrap.style.transform = `perspective(900px) rotateY(${currentX}deg) rotateX(${currentY}deg)`;
    heroPhoto.style.filter = `drop-shadow(${-currentX * 2}px ${-currentY * 3}px 60px rgba(192, 60, 100, 0.65))`;

    if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
      raf = requestAnimationFrame(animateTilt);
    } else {
      raf = null;
    }
  }

  document.addEventListener("mouseleave", () => {
    targetX = 0;
    targetY = 0;
    if (!raf) raf = requestAnimationFrame(animateTilt);
  });
}

// ─────────────────────────────────────────────────────────
// PHYSICS SKILLS — moteur custom, aucune dépendance externe
// ─────────────────────────────────────────────────────────
function initPhysicsSkills() {
  const canvas = document.getElementById("skills-canvas");
  if (!canvas) return;

  const SKILLS = [
    "Evenementiel", "Scenographie", "Production", "Coordination",
    "Communication", "Experience terrain", "Logistique", "Gestion de projet",
    "Relation client", "Animation d'equipe", "Negociation", "Creativite",
    "Rigueur", "Organisation", "Suivi budget", "Prestataires",
  ];

  const COLORS = [
    { fill: "rgba(208,144,160,0.25)", stroke: "rgba(208,144,160,1)"   },
    { fill: "rgba(112,48, 64, 0.9)",  stroke: "rgba(208,144,160,0.8)" },
    { fill: "rgba(192,144,160,0.2)",  stroke: "rgba(192,144,160,1)"   },
    { fill: "rgba(96, 48, 64, 0.95)", stroke: "rgba(208,144,160,0.7)" },
  ];

  const DPR   = Math.min(window.devicePixelRatio || 1, 2);
  const W     = Math.max(canvas.parentElement.offsetWidth, 300);
  const H     = 460;
  const FS    = 16;    // font-size CSS px — plus grand
  const PH    = 54;    // pill height px — plus grand
  const PAD   = 34;    // horizontal padding per side
  const GY    = +0.38; // gravité vers le bas
  const DRAG  = 0.985; // friction air
  const REST  = 0.32;  // rebond
  const MAX_A = Math.PI / 12; // ±15°
  const FLOOR = H - 2; // sol effectif (2px de marge pour éviter le découpage)

  canvas.width        = W * DPR;
  canvas.height       = H * DPR;
  canvas.style.width  = W + "px";
  canvas.style.height = H + "px";
  canvas.parentElement.style.height = H + "px";

  const ctx = canvas.getContext("2d");
  // Police déjà chargée (on est appelé via document.fonts.ready)
  ctx.font = `800 ${FS * DPR}px Figtree, sans-serif`;

  // Création des pilules — spawn depuis le haut (hors canvas)
  function makePills() {
    return SKILLS.map((text, i) => {
      const tw = ctx.measureText(text.toUpperCase()).width / DPR;
      const pw = tw + PAD * 2;
      return {
        x: pw / 2 + 12 + Math.random() * Math.max(1, W - pw - 24),
        y: -PH / 2 - i * 56,   // au-dessus du canvas, décalées pour tomber en cascade
        w: pw, h: PH,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 2,
        angle: (Math.random() - 0.5) * 0.3,
        va: (Math.random() - 0.5) * 0.04,
        text,
        color: COLORS[i % COLORS.length],
      };
    });
  }

  const pills = makePills();
  let dragging = null;

  // ── Pas de physique ─────────────────────────────────────
  function step() {
    for (const p of pills) {
      if (p === dragging) continue;

      p.vy += GY;
      p.vx *= DRAG;
      p.vy *= DRAG;
      p.x  += p.vx;
      p.y  += p.vy;
      p.va *= 0.90;
      p.angle += p.va;

      // Angle ±15°
      if (p.angle >  MAX_A) { p.angle =  MAX_A; p.va = -p.va * 0.3; }
      if (p.angle < -MAX_A) { p.angle = -MAX_A; p.va = -p.va * 0.3; }

      // Murs gauche / droite
      const hw = p.w / 2, hh = p.h / 2;
      if (p.x - hw < 0)  { p.x = hw;     p.vx =  Math.abs(p.vx) * REST; p.va += 0.02; }
      if (p.x + hw > W)  { p.x = W - hw; p.vx = -Math.abs(p.vx) * REST; p.va -= 0.02; }
      // Sol (bas) — rebond avec friction, stoppe les micro-rebonds
      if (p.y + hh > FLOOR) {
        p.y  = FLOOR - hh;
        p.vy = -Math.abs(p.vy) * REST;
        p.vx *= 0.82;
        p.va *= 0.6;
        if (Math.abs(p.vy) < 0.6) p.vy = 0; // stoppe le jitter
      }
      // Plafond — laisse entrer depuis le haut
      if (p.y - hh < 0 && p.vy < 0) { p.vy = 0; }
    }

    // Collisions pilule ↔ pilule (3 passes pour stabilité)
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < pills.length; i++) {
        for (let j = i + 1; j < pills.length; j++) {
          const a = pills[i], b = pills[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const mxX = (a.w + b.w) / 2 + 2;
          const mxY = (a.h + b.h) / 2 + 2;
          if (Math.abs(dx) >= mxX || Math.abs(dy) >= mxY) continue;

          const ovX = mxX - Math.abs(dx), ovY = mxY - Math.abs(dy);
          if (ovX < ovY) {
            const push = ovX / 2 + 0.5, sx = Math.sign(dx) || 1;
            if (a !== dragging) { a.x -= sx * push; a.vx -= sx * ovX * 0.15; }
            if (b !== dragging) { b.x += sx * push; b.vx += sx * ovX * 0.15; }
          } else {
            const push = ovY / 2 + 0.5, sy = Math.sign(dy) || 1;
            if (a !== dragging) { a.y -= sy * push; a.vy -= sy * ovY * 0.15; }
            if (b !== dragging) { b.y += sy * push; b.vy += sy * ovY * 0.15; }
          }
        }
      }
    }
  }

  // ── Dessin ──────────────────────────────────────────────
  function drawRoundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,      y + h, x,        y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x,      y,     x + r,    y,         r);
    ctx.closePath();
  }

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const p of pills) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      drawRoundRect(-p.w / 2, -p.h / 2, p.w, p.h, p.h / 2);
      ctx.fillStyle   = p.color.fill;   ctx.fill();
      ctx.strokeStyle = p.color.stroke; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font         = `800 ${FS}px Figtree, sans-serif`;
      ctx.fillStyle    = "#fff";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.text.toUpperCase(), 0, 0);
      ctx.restore();
    }
  }

  // Repositionne les pilules au-dessus du canvas (pas de pré-simulation)
  function reset() {
    pills.forEach((p, i) => {
      p.x     = p.w / 2 + 12 + Math.random() * Math.max(1, W - p.w - 24);
      p.y     = -PH / 2 - i * 56;
      p.vx    = (Math.random() - 0.5) * 3;
      p.vy    = Math.random() * 1.5;
      p.angle = (Math.random() - 0.5) * 0.3;
      p.va    = (Math.random() - 0.5) * 0.04;
    });
  }

  // ── Drag souris ─────────────────────────────────────────
  let dragOffX = 0, dragOffY = 0;

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * (W / rect.width),
      y: (src.clientY - rect.top)  * (H / rect.height),
    };
  }

  function hitTest(px, py) {
    for (let i = pills.length - 1; i >= 0; i--) {
      const p   = pills[i];
      const cos = Math.cos(-p.angle), sin = Math.sin(-p.angle);
      const dx  = px - p.x, dy = py - p.y;
      const lx  = dx * cos - dy * sin;
      const ly  = dx * sin + dy * cos;
      if (Math.abs(lx) < p.w / 2 + 4 && Math.abs(ly) < p.h / 2 + 4) return p;
    }
    return null;
  }

  canvas.addEventListener("mousedown", e => {
    const pos = canvasPos(e);
    dragging  = hitTest(pos.x, pos.y);
    if (dragging) { dragOffX = pos.x - dragging.x; dragOffY = pos.y - dragging.y; }
  });
  document.addEventListener("mousemove", e => {
    if (!dragging) return;
    const pos   = canvasPos(e);
    const nx    = pos.x - dragOffX, ny = pos.y - dragOffY;
    dragging.vx = nx - dragging.x;
    dragging.vy = ny - dragging.y;
    dragging.x  = nx;
    dragging.y  = ny;
  });
  document.addEventListener("mouseup", () => { dragging = null; });
  canvas.addEventListener("wheel", e => e.stopPropagation(), { passive: true });

  // ── Boucle d'animation — démarre/s'arrête selon visibilité ──
  let rafId = null;

  function startLoop() {
    if (rafId) return; // déjà en route
    function loop() {
      step();
      draw();
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  // Premier dessin (pilules au-dessus, canvas vide)
  draw();

  // Démarrer l'animation dès que la section entre dans le viewport
  // et la relancer à chaque re-scroll
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        reset();   // replace les pilules en haut
        startLoop(); // démarre / continue la boucle
      } else {
        stopLoop(); // pause quand hors écran (perf)
      }
    });
  }, { threshold: 0.05 }).observe(canvas.parentElement);
}

// On attend que la police Figtree soit chargée avant de mesurer les textes
document.fonts.ready.then(initPhysicsSkills);

// Cursor glow
const glow = document.createElement("div");
glow.className = "cursor-glow";
document.body.appendChild(glow);

let glowX = -9999, glowY = -9999;
let curTargetX = -9999, curTargetY = -9999;
let glowRaf = null;

document.addEventListener("mousemove", (e) => {
  curTargetX = e.clientX - 160;
  curTargetY = e.clientY - 160;
  if (!glowRaf) glowRaf = requestAnimationFrame(animateGlow);
});

function animateGlow() {
  glowX += (curTargetX - glowX) * 0.14;
  glowY += (curTargetY - glowY) * 0.14;
  glow.style.transform = `translate(${glowX}px, ${glowY}px)`;
  if (Math.abs(curTargetX - glowX) > 0.3 || Math.abs(curTargetY - glowY) > 0.3) {
    glowRaf = requestAnimationFrame(animateGlow);
  } else {
    glowRaf = null;
  }
}

// ─────────────────────────────────────────────────────────
// LIGHTBOX — affichage plein écran au clic sur une photo
// ─────────────────────────────────────────────────────────
(function initLightbox() {
  // Sélecteurs des photos cliquables sur les pages projet
  const SELECTORS = [
    '.expo-gallery img',
    '.sauvegarde-gallery img',
    '.parrainight-photo img',
    '.projet-single-img img',
    '.popup-gallery img',
  ].join(', ');

  const photos = document.querySelectorAll(SELECTORS);
  if (!photos.length) return;

  // Création de l'overlay
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Image agrandie');

  const lbImg = document.createElement('img');
  const lbClose = document.createElement('button');
  lbClose.className = 'lightbox-close';
  lbClose.setAttribute('aria-label', 'Fermer');
  lbClose.textContent = '×';

  lb.appendChild(lbImg);
  lb.appendChild(lbClose);
  document.body.appendChild(lb);

  function open(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    lb.classList.add('lightbox--open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('lightbox--open');
    document.body.style.overflow = '';
  }

  // Clic sur une photo
  photos.forEach(img => {
    img.addEventListener('click', () => open(img.src, img.alt));
  });

  // Fermeture : bouton ×, clic sur le fond, touche Échap
  lbClose.addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

