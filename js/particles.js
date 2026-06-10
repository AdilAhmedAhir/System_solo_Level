/* ── particles.js — Mana / Shadow Energy Background ────────────────── */
window.Particles = (() => {
  let canvas, ctx, particles = [], raf = 0, W = 0, H = 0;
  const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4'];
  const GLOW_CHANCE = 0.2;

  function rand(a, b) { return Math.random() * (b - a) + a; }

  function spawn() {
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 40 : 70;
    particles.length = 0;
    for (let i = 0; i < count; i++) {
      particles.push(makeParticle(rand(0, H)));
    }
  }

  function makeParticle(yStart) {
    const glow = Math.random() < GLOW_CHANCE;
    return {
      x: rand(0, W),
      y: yStart,
      r: rand(1, 3),
      speed: rand(0.2, 0.8),
      opacity: rand(0.1, 0.5),
      color: COLORS[(Math.random() * 3) | 0],
      drift: rand(0, Math.PI * 2),
      driftSpeed: rand(0.003, 0.01),
      driftAmp: rand(15, 40),
      glow,
      glowRadius: glow ? rand(6, 14) : 0,
      baseX: rand(0, W),
    };
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      /* update */
      p.y -= p.speed;
      p.drift += p.driftSpeed;
      p.x = p.baseX + Math.sin(p.drift) * p.driftAmp;

      /* respawn at bottom */
      if (p.y + p.r < 0) {
        const np = makeParticle(H + rand(0, 20));
        particles[i] = np;
        continue;
      }

      /* draw */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;

      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.glowRadius;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
    raf = requestAnimationFrame(draw);
  }

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none';

    ctx = canvas.getContext('2d', { willReadFrequently: false });

    resize();
    spawn();
    draw();

    window.addEventListener('resize', () => {
      resize();
      spawn();
    });
  }

  return { init };
})();
