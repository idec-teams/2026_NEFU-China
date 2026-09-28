(function() {
  'use strict';

  const App = {
    init() {
      this.setupRevealAnimations();
      this.setupCounterAnimations();
      this.setupProtocolAccordion();
      this.setupPageEntry();
      this.setupSnowEffect();
      this.setupBackToTop();
    },

    setupRevealAnimations() {
      if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    },

    setupCounterAnimations() {
      const counters = document.querySelectorAll('[data-counter]');
      if (!counters.length) return;

      const animateCounter = (element) => {
        const target = parseInt(element.getAttribute('data-counter'));
        const duration = 2000;
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(eased * target);

          element.textContent = current;

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          }
        };

        requestAnimationFrame(updateCounter);
      };

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.5 });

        counters.forEach(c => observer.observe(c));
      } else {
        counters.forEach(animateCounter);
      }
    },

    setupProtocolAccordion() {
      const items = document.querySelectorAll('.protocol-item');
      if (!items.length) return;

      items.forEach(item => {
        const btn = item.querySelector('.protocol-btn');
        if (!btn) return;

        btn.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');

          
          items.forEach(other => {
            if (other !== item) {
              other.classList.remove('open');
              const b = other.querySelector('.protocol-btn');
              if (b) b.setAttribute('aria-expanded', 'false');
            }
          });

          
          item.classList.toggle('open', !isOpen);
          btn.setAttribute('aria-expanded', String(!isOpen));
        });
      });
    },

    setupPageEntry() {
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.6s ease-out';
      requestAnimationFrame(() => {
        document.body.style.opacity = '1';
      });

      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        const target = document.querySelector(hash);
        if (target) {
          setTimeout(() => {
            const navHeight = document.getElementById('navbar')?.offsetHeight || 72;
            const rect = target.getBoundingClientRect();
            const top = rect.top + window.pageYOffset - navHeight + 1;
            window.scrollTo({ top, behavior: 'smooth' });
          }, 300);
        }
      }
    },

    setupBackToTop() {
      const path = window.location.pathname;
      const isHome = path.endsWith('/') || path.endsWith('index.html') || path === '';
      if (isHome) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'back-to-top';
      btn.setAttribute('aria-label', 'Back to top');
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
        '<path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>';

      let ticking = false;
      const update = () => {
        const y = window.pageYOffset || document.documentElement.scrollTop || 0;
        btn.classList.toggle('is-visible', y > 400);
        ticking = false;
      };

      btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      document.body.appendChild(btn);

      window.addEventListener('scroll', () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      }, { passive: true });
      update();
    },

    setupSnowEffect() {
      
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.id = 'snow-canvas';
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      let w = 0, h = 0, dpr = 1;
      const flakes = [];
      const rand = (min, max) => min + Math.random() * (max - min);

      function makeFlake(initial) {
        const r = rand(2, 5.5);
        return {
          x: rand(0, w),
          y: initial ? rand(0, h) : rand(-20, -5),
          r: r,
          vy: rand(0.2, 0.55) * (0.7 + r / 4),
          sway: rand(0.3, 1.1),
          swaySpeed: rand(0.005, 0.015),
          phase: rand(0, Math.PI * 2),
          rot: rand(0, Math.PI * 2),
          rotSpeed: rand(-0.004, 0.004),
          opacity: rand(0.5, 0.85)
        };
      }

      function drawSnowflake(ctx, x, y, r, opacity, rot) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.strokeStyle = 'rgba(202, 228, 255, ' + opacity.toFixed(3) + ')';
        ctx.lineWidth = Math.max(0.5, r * 0.16);
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(173, 208, 255, 0.6)';
        ctx.shadowBlur = r * 0.7;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          ctx.rotate(Math.PI / 3);
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -r);
          const bl = r * 0.32;
          const py = -r * 0.6;
          ctx.moveTo(0, py);
          ctx.lineTo(0.866 * bl, py - 0.5 * bl);
          ctx.moveTo(0, py);
          ctx.lineTo(-0.866 * bl, py - 0.5 * bl);
        }
        ctx.stroke();
        ctx.restore();
      }

      function resize() {
        dpr = window.devicePixelRatio || 1;
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const target = Math.min(150, Math.max(40, Math.round((w * h) / 13000)));
        if (flakes.length < target) {
          for (let i = flakes.length; i < target; i++) flakes.push(makeFlake(true));
        } else if (flakes.length > target) {
          flakes.length = target;
        }
      }

      let lastTime = performance.now();
      let rafId = null;

      function frame(now) {
        let dt = (now - lastTime) / 16.667;
        lastTime = now;
        if (!isFinite(dt) || dt <= 0) dt = 1;
        if (dt > 3) dt = 3;

        ctx.clearRect(0, 0, w, h);
        for (const f of flakes) {
          f.phase += f.swaySpeed * dt;
          f.rot += f.rotSpeed * dt;
          f.y += f.vy * dt;
          f.x += Math.sin(f.phase) * f.sway * dt;

          if (f.y - f.r > h) {
            f.y = rand(-20, -5);
            f.x = rand(0, w);
          }
          if (f.x < -10) f.x = w + 10;
          else if (f.x > w + 10) f.x = -10;

          drawSnowflake(ctx, f.x, f.y, f.r, f.opacity, f.rot);
        }
        rafId = requestAnimationFrame(frame);
      }

      resize();
      window.addEventListener('resize', resize);
      rafId = requestAnimationFrame(frame);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        } else if (!rafId) {
          lastTime = performance.now();
          rafId = requestAnimationFrame(frame);
        }
      });
    }
  };

  window.App = App;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
})();
