(function() {
  'use strict';

  const Article = {
    headings: [],
    state: new Map(),
    links: new Map(),
    spyObserver: null,

    init() {
      const article = document.getElementById('docArticle');
      if (!article) return;

      this.prepareHeadingIds(article);
      this.buildToc();
      this.setupTocToggle();
      this.setupScrollSpy();
      this.setupReveals();
      this.setupVideoPlayback();
    },

    
    prepareHeadingIds(article) {
      const used = new Set();
      article.querySelectorAll('h2, h3').forEach((h, i) => {
        if (!h.id) {
          const base = (h.textContent || 'section')
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
            .replace(/^-+|-+$/g, '') || ('section-' + i);
          let id = base, n = 2;
          while (used.has(id) || document.getElementById(id)) id = base + '-' + n++;
          h.id = id;
        }
        used.add(h.id);
      });
      this.headings = Array.from(article.querySelectorAll('h2[id], h3[id]'));
    },

    
    buildToc() {
      const list = document.getElementById('docTocList');
      if (!list || !this.headings.length) return;

      const frag = document.createDocumentFragment();

      this.headings.forEach(h => {
        const isSub = h.tagName === 'H3';
        const li = document.createElement('li');
        li.className = 'doc-toc-item' + (isSub ? ' doc-toc-item--sub' : '');

        const a = document.createElement('a');
        a.className = 'doc-toc-link';
        a.href = '#' + h.id;

        if (!isSub) {
          const section = h.closest('.doc-section');
          const num = section ? section.querySelector('.doc-section-num') : null;
          if (num) {
            const span = document.createElement('span');
            span.className = 'toc-num';
            span.textContent = num.textContent.trim();
            a.appendChild(span);
          }
        }

        a.appendChild(document.createTextNode(h.textContent.trim()));
        li.appendChild(a);
        frag.appendChild(li);

        this.links.set(h.id, a);
        a.addEventListener('click', () => {
          this.setActive(h.id);
          this.closeMobileToc();
        });
      });

      list.appendChild(frag);
    },

    
    setupTocToggle() {
      const btn = document.querySelector('.doc-toc-toggle');
      const toc = document.getElementById('docToc');
      if (!btn || !toc) return;

      btn.addEventListener('click', () => {
        const open = toc.classList.toggle('doc-toc--open');
        btn.setAttribute('aria-expanded', String(open));
      });
    },

    closeMobileToc() {
      if (window.innerWidth >= 1024) return;
      const toc = document.getElementById('docToc');
      const btn = document.querySelector('.doc-toc-toggle');
      if (toc && toc.classList.contains('doc-toc--open')) {
        toc.classList.remove('doc-toc--open');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    },

    
    setupScrollSpy() {
      if (!('IntersectionObserver' in window) || !this.headings.length) return;

      const BAND_TOP = 0.10;    
      const BAND_BOTTOM = 0.55; 

      const resync = () => {
        const bandTop = window.innerHeight * BAND_TOP;
        const bandBottom = window.innerHeight * BAND_BOTTOM;
        let current = null;
        for (const h of this.headings) {
          const top = h.getBoundingClientRect().top;
          const pos = top < bandTop ? 'above' : (top <= bandBottom ? 'in' : 'below');
          this.state.set(h.id, pos);
          if (pos !== 'below') current = h.id;
        }
        this.setActive(current);
      };

      this.spyObserver = new IntersectionObserver(resync, {
        rootMargin: '-10% 0px -45% 0px',
        threshold: 0
      });

      this.headings.forEach(h => this.spyObserver.observe(h));
      resync();
    },

    setActive(id) {
      this.links.forEach((link, key) => {
        link.classList.toggle('is-active', key === id);
      });
    },

    
    setupReveals() {
      const items = document.querySelectorAll('.doc-reveal');
      if (!items.length) return;

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || !('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('is-visible'));
        return;
      }

      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

      items.forEach(el => io.observe(el));
    },

    
    setupVideoPlayback() {
      const videos = document.querySelectorAll('.figure-video');
      if (!videos.length || !('IntersectionObserver' in window)) return;

      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const v = entry.target;
          if (entry.isIntersecting) {
            if (v.paused) v.play().catch(() => {});
          } else if (!v.paused) {
            v.pause();
          }
        });
      }, { threshold: 0.25 });

      videos.forEach(v => io.observe(v));
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Article.init());
  } else {
    Article.init();
  }
})();
