(function() {
  'use strict';

  const DOT_COLORS = [
    [143, 169, 74],
    [168, 194, 94],
    [195, 217, 126]
  ];
  const LINE_COLOR = [163, 187, 102];

  class ParticleSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.mouse = { x: null, y: null };
      this.dpr = 1;
      this.w = 0;
      this.h = 0;
      this.rafId = null;
      this.lastTime = 0;
      this.config = {
        densityArea: 26000,
        minCount: 24,
        maxCount: 110,
        baseSpeed: 0.45,
        maxDistance: 150,
        mouseInfluence: 130,
        mouseForce: 0.5
      };
    }

    init() {
      this.resize();
      this.createParticles();
      this.bindEvents();
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame((t) => this.animate(t));
    }

    resize() {
      this.dpr = window.devicePixelRatio || 1;
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);
      this.canvas.style.width = this.w + 'px';
      this.canvas.style.height = this.h + 'px';
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const count = Math.round((this.w * this.h) / this.config.densityArea);
      this.targetCount = Math.max(this.config.minCount, Math.min(this.config.maxCount, count));
      const minDim = Math.min(this.w, this.h);
      this.config.maxDistance = Math.max(100, Math.min(170, minDim / 4));
    }

    spawn() {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.config.baseSpeed * (0.6 + Math.random() * 0.8);
      return {
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 1.8,
        baseOpacity: 0.25 + Math.random() * 0.35,
        opacity: 0.4,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
        wanderPhase: Math.random() * Math.PI * 2,
        wanderSpeed: 0.005 + Math.random() * 0.008,
        wanderStrength: 0.12 + Math.random() * 0.18,
        color: DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)]
      };
    }

    createParticles() {
      this.particles = [];
      for (let i = 0; i < this.targetCount; i++) {
        this.particles.push(this.spawn());
      }
    }

    bindEvents() {
      this.resizeHandler = () => {
        const oldCount = this.targetCount;
        this.resize();
        if (this.targetCount > oldCount) {
          for (let i = oldCount; i < this.targetCount; i++) {
            this.particles.push(this.spawn());
          }
        } else if (this.targetCount < this.particles.length) {
          this.particles.length = this.targetCount;
        }
        for (const p of this.particles) {
          p.x = Math.min(p.x, this.w);
          p.y = Math.min(p.y, this.h);
        }
      };

      this.mouseHandler = (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      };

      this.mouseLeaveHandler = () => {
        this.mouse.x = null;
        this.mouse.y = null;
      };

      window.addEventListener('resize', this.resizeHandler);
      window.addEventListener('mousemove', this.mouseHandler);
      window.addEventListener('mouseleave', this.mouseLeaveHandler);
    }

    update(dt) {
      const w = this.w;
      const h = this.h;

      for (const p of this.particles) {
        p.wanderPhase += p.wanderSpeed * dt;
        const wobble = Math.sin(p.wanderPhase) * p.wanderStrength;
        const len = Math.hypot(p.vx, p.vy) || 0.001;
        const nx = -p.vy / len;
        const ny = p.vx / len;

        p.x += (p.vx + nx * wobble) * dt;
        p.y += (p.vy + ny * wobble) * dt;

        if (this.mouse.x !== null) {
          const dx = p.x - this.mouse.x;
          const dy = p.y - this.mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < this.config.mouseInfluence && dist > 0.001) {
            const force = (1 - dist / this.config.mouseInfluence) * this.config.mouseForce * dt;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        const speed = Math.hypot(p.vx, p.vy) || 0.001;
        const corrected = speed + (this.config.baseSpeed - speed) * 0.02 * dt;
        p.vx = (p.vx / speed) * corrected;
        p.vy = (p.vy / speed) * corrected;

        if (p.x < -20) p.x += w + 40;
        if (p.x > w + 20) p.x -= w + 40;
        if (p.y < -20) p.y += h + 40;
        if (p.y > h + 20) p.y -= h + 40;

        p.pulse += p.pulseSpeed * dt;
        p.opacity = p.baseOpacity + Math.sin(p.pulse) * 0.12;
      }
    }

    draw() {
      const ctx = this.ctx;
      const maxD = this.config.maxDistance;
      const [lr, lg, lb] = LINE_COLOR;

      ctx.clearRect(0, 0, this.w, this.h);

      for (let i = 0; i < this.particles.length; i++) {
        const p1 = this.particles[i];
        for (let j = i + 1; j < this.particles.length; j++) {
          const p2 = this.particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxD * maxD) {
            const opacity = (1 - Math.sqrt(d2) / maxD) * 0.16;
            ctx.strokeStyle = 'rgba(' + lr + ',' + lg + ',' + lb + ',' + opacity.toFixed(3) + ')';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      for (const p of this.particles) {
        const [r, g, b] = p.color;
        const o = Math.max(0.05, p.opacity).toFixed(3);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + o + ')';
        ctx.fill();

        if (p.size > 2.2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (p.opacity * 0.12).toFixed(3) + ')';
          ctx.fill();
        }
      }
    }

    animate(now) {
      let dt = (now - this.lastTime) / 16.667;
      this.lastTime = now;
      if (!isFinite(dt) || dt <= 0) dt = 1;
      if (dt > 3) dt = 3;

      this.update(dt);
      this.draw();
      this.rafId = requestAnimationFrame((t) => this.animate(t));
    }

    pause() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    resume() {
      if (!this.rafId) {
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame((t) => this.animate(t));
      }
    }

    destroy() {
      this.pause();
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('mousemove', this.mouseHandler);
      window.removeEventListener('mouseleave', this.mouseLeaveHandler);
    }
  }

  function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none';
      return;
    }

    const system = new ParticleSystem(canvas);
    system.init();
    window.__particleSystem = system;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initParticles, 500);
    });
  } else {
    setTimeout(initParticles, 500);
  }

  document.addEventListener('visibilitychange', () => {
    const s = window.__particleSystem;
    if (!s) return;
    if (document.hidden) {
      s.pause();
    } else {
      s.resume();
    }
  });

})();
