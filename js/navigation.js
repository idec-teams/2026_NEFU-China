(function() {
  'use strict';

  const Navigation = {
    init() {
      const navbar = document.getElementById('navbar');
      if (!navbar) return;

      this.navbar = navbar;
      this.navLinks = document.querySelectorAll('.nav-link-item.has-dropdown');
      this.navDropdowns = document.querySelectorAll('.nav-dropdown');
      this.mobileNav = document.getElementById('mobileNav');
      this.navToggle = document.getElementById('navToggle');
      this.scrollIndicator = document.querySelector('.nav-scroll-indicator');

      this.setupScrollHandler();
      this.setupDropdownHandlers();
      this.setupMobileNav();
      this.setupMobileSections();
      this.setupClickOutside();
      this.setupScrollIndicator();
      this.setupAnchorOffset();
      this.setActiveNav();
    },

    setupScrollHandler() {
      let lastScroll = 0;
      let ticking = false;

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 20) {
              this.navbar.classList.add('scrolled');
            } else {
              this.navbar.classList.remove('scrolled');
            }

            if (currentScroll > lastScroll && currentScroll > 200) {
              this.navbar.style.top = '8px';
            } else if (currentScroll < lastScroll && currentScroll > 100) {
              this.navbar.style.top = '16px';
            }

            lastScroll = currentScroll;
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    },

    toggleDropdown(item) {
      const link = item.querySelector('.nav-link');
      const isOpen = item.classList.contains('open');
      this.closeAllDropdowns();

      if (!isOpen) {
        item.classList.add('open');
        this.navbar.classList.add('expanded');
        if (link) link.setAttribute('aria-expanded', 'true');
      }
    },

    setupDropdownHandlers() {
      this.navLinks.forEach(item => {
        const link = item.querySelector('.nav-link');
        const dropdown = item.querySelector('.nav-dropdown');

        if (!link || !dropdown) return;

        link.setAttribute('aria-expanded', 'false');
        link.setAttribute('aria-haspopup', 'true');

        
        
        link.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleDropdown(item);
        });

        
        link.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            this.toggleDropdown(item);
          }
        });

        link.addEventListener('mouseenter', () => {
          if (window.innerWidth > 1024) {
            link.style.transform = 'scale(1.02)';
          }
        });

        link.addEventListener('mouseleave', () => {
          link.style.transform = '';
        });
      });
    },

    setupMobileNav() {
      if (!this.navToggle || !this.mobileNav) return;

      this.navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = this.mobileNav.classList.contains('open');

        if (isOpen) {
          this.closeMobileNav();
        } else {
          this.openMobileNav();
        }
      });

      const mobileLinks = this.mobileNav.querySelectorAll('.mobile-nav-link');
      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          this.closeMobileNav();
        });
      });
    },

    setupMobileSections() {
      if (!this.mobileNav) return;

      const sections = this.mobileNav.querySelectorAll('.mobile-nav-section');
      const heads = this.mobileNav.querySelectorAll('.mobile-nav-head');

      heads.forEach(head => {
        head.addEventListener('click', (e) => {
          e.stopPropagation();
          const section = head.closest('.mobile-nav-section');
          if (!section) return;

          const isOpen = section.classList.contains('open');

          
          sections.forEach(s => {
            s.classList.remove('open');
            const h = s.querySelector('.mobile-nav-head');
            if (h) h.setAttribute('aria-expanded', 'false');
          });

          if (!isOpen) {
            section.classList.add('open');
            head.setAttribute('aria-expanded', 'true');
          }
        });
      });
    },

    openMobileNav() {
      this.mobileNav.classList.add('open');
      this.navbar.classList.add('expanded');
      document.body.style.overflow = 'hidden';
    },

    closeMobileNav() {
      this.mobileNav.classList.remove('open');
      this.navbar.classList.remove('expanded');
      document.body.style.overflow = '';
    },

    closeAllDropdowns() {
      this.navLinks.forEach(i => {
        i.classList.remove('open');
        const l = i.querySelector('.nav-link');
        if (l) l.setAttribute('aria-expanded', 'false');
      });
      this.navbar.classList.remove('expanded');
    },

    setupClickOutside() {
      document.addEventListener('click', (e) => {
        if (!this.navbar.contains(e.target)) {
          this.closeAllDropdowns();
        }
      });
    },

    setupScrollIndicator() {
      if (!this.scrollIndicator) return;

      window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        const clamped = Math.min(100, Math.max(0, progress)) / 100;
        this.scrollIndicator.style.transform = 'scaleX(' + clamped + ')';
      }, { passive: true });
    },

    setupAnchorOffset() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href').substring(1);
          const target = document.getElementById(targetId);
          if (target) {
            e.preventDefault();
            const navHeight = this.navbar.offsetHeight || 72;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight + 1;
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
          }
        });
      });
    },

    setActiveNav() {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const file = (parts.pop() || 'index.html').toLowerCase();
      const dir = (parts.pop() || '').toLowerCase();
      const key = dir ? dir + '/' + file : file;
      const map = {
        'index.html': 'home',
        'team/member.html': 'team',
        'project/background.html': 'project', 'project/design.html': 'project', 'project/results.html': 'project',
        'project/hardware.html': 'project',
        'document/notebook.html': 'document', 'document/safety.html': 'document', 'document/protocol.html': 'document'
      };
      const section = map[key] || (map[file] ? map[file] : 'home');

      const desktopItem = this.navbar.querySelector('.nav-link-item[data-nav="' + section + '"]');
      if (desktopItem) desktopItem.querySelector('.nav-link').classList.add('active');

      if (this.mobileNav) {
        const mobileSection = this.mobileNav.querySelector('.mobile-nav-section[data-section="' + section + '"]');
        if (mobileSection) {
          mobileSection.classList.add('active', 'open');
          const head = mobileSection.querySelector('.mobile-nav-head');
          if (head) head.setAttribute('aria-expanded', 'true');
        }
      }
    }
  };

  window.Navigation = Navigation;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Navigation.init());
  } else {
    Navigation.init();
  }
})();
