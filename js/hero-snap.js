
(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  var content = document.querySelector('.content-bg');
  if (!hero || !content) return; 

  
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  
  var STATE = { HERO: 'hero', SNAPPING: 'snapping', CONTENT: 'content' };
  var state = STATE.HERO;

  var accum = 0;                 
  var gestureTimer = null;
  var GESTURE_END_MS = 160;      
  var WHEEL_TRIGGER = 30;        
  var TOUCH_TRIGGER = 60;        

  var contentTopY = 0;           
  var snapTarget = 0;            
  var snapNextState = STATE.CONTENT;
  var snapDoneTimer = null;
  var rafId = null;              
  var snapToken = 0;             
  var heroTextEls = [];          

  
  var DAMP_FACTOR = 0.06;        

  function computeContentTop() {
    var rect = content.getBoundingClientRect();
    contentTopY = rect.top + window.pageYOffset;
  }

  
  
  
  function syncStateToScroll() {
    if (state === STATE.SNAPPING) return;
    computeContentTop();
    if (window.pageYOffset < contentTopY - 8) {
      state = STATE.HERO;
    } else if (window.pageYOffset > contentTopY + 8) {
      state = STATE.CONTENT;
    }
  }

  
  
  
  function applyHeroTransition(t) {
    var e = t < 0 ? 0 : (t > 1 ? 1 : t);
    var opacity = 1 - e;
    var blur = e * 8;
    for (var i = 0; i < heroTextEls.length; i++) {
      var item = heroTextEls[i];
      var ty = e * -90 * item.depth;     
      var scale = 1 - e * 0.05;
      var b = blur * item.depth;
      if (b > 12) b = 12;
      var filter = 'blur(' + b.toFixed(2) + 'px)';
      item.el.style.opacity = opacity.toFixed(3);
      item.el.style.transform = 'translate3d(0,' + ty.toFixed(2) + 'px,0) scale(' + scale.toFixed(4) + ')';
      item.el.style.filter = filter;
      item.el.style.webkitFilter = filter;
    }
  }

  
  
  
  
  
  function beginSnap(targetY, nextState) {
    state = STATE.SNAPPING;
    snapTarget = targetY;
    snapNextState = nextState;
    accum = 0;
    clearTimeout(gestureTimer);

    document.documentElement.style.scrollBehavior = 'auto';

    var token = ++snapToken;
    var pos = window.pageYOffset;

    
    
    for (var i = 0; i < heroTextEls.length; i++) {
      heroTextEls[i].el.style.transition = 'none';
      heroTextEls[i].el.style.willChange = 'transform, opacity, filter';
    }

    function step() {
      if (token !== snapToken) return; 
      pos += (targetY - pos) * DAMP_FACTOR;
      applyHeroTransition(contentTopY > 0 ? pos / contentTopY : 0);
      if (Math.abs(targetY - pos) < 0.5) {
        applyHeroTransition(contentTopY > 0 ? targetY / contentTopY : 0);
        window.scrollTo(0, targetY); 
        finishSnap();
        return;
      }
      window.scrollTo(0, pos);
      rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);

    
    clearTimeout(snapDoneTimer);
    snapDoneTimer = setTimeout(function () {
      if (token === snapToken) finishSnap();
    }, 3000);
  }

  function finishSnap() {
    clearTimeout(snapDoneTimer);
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    document.documentElement.style.scrollBehavior = ''; 
    window.scrollTo(0, snapTarget); 
    state = snapNextState;
  }

  function atContentTop() {
    return window.pageYOffset <= contentTopY + 6;
  }

  function scheduleGestureEnd() {
    clearTimeout(gestureTimer);
    gestureTimer = setTimeout(function () { accum = 0; }, GESTURE_END_MS);
  }

  
  function onWheel(e) {
    if (e.ctrlKey) return; 

    if (state === STATE.HERO) {
      if (e.deltaY > 0) {
        
        e.preventDefault();
        accum += e.deltaY;
        scheduleGestureEnd();
        if (accum >= WHEEL_TRIGGER) {
          computeContentTop();
          beginSnap(contentTopY, STATE.CONTENT);
        }
      } else if (e.deltaY < 0) {
        
        accum = 0;
      }
      return;
    }

    if (state === STATE.SNAPPING) {
      
      e.preventDefault();
      return;
    }

    if (state === STATE.CONTENT) {
      
      if (e.deltaY < 0 && atContentTop()) {
        e.preventDefault();
        accum += -e.deltaY;
        scheduleGestureEnd();
        if (accum >= WHEEL_TRIGGER) {
          beginSnap(0, STATE.HERO);
        }
      }
      
    }
  }

  
  function isInteractive(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toUpperCase();
    return tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' ||
           tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function onKeyDown(e) {
    if (e.ctrlKey || e.metaKey) return; 
    if (isInteractive(e.target)) return; 

    if (state === STATE.HERO) {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        computeContentTop();
        beginSnap(contentTopY, STATE.CONTENT);
      }
      return;
    }

    if (state === STATE.SNAPPING) {
      e.preventDefault();
      return;
    }

    if (state === STATE.CONTENT) {
      
      if ((e.key === 'ArrowUp' || e.key === 'PageUp') && atContentTop()) {
        e.preventDefault();
        beginSnap(0, STATE.HERO);
      }
    }
  }

  
  var touchStartY = null;

  function onTouchStart(e) {
    touchStartY = (state === STATE.HERO && e.touches.length === 1)
      ? e.touches[0].clientY
      : null;
  }

  function onTouchMove(e) {
    if (touchStartY === null || e.touches.length !== 1) return;

    if (state === STATE.HERO) {
      var dy = touchStartY - e.touches[0].clientY; 
      if (dy > 0) {
        e.preventDefault(); 
        if (dy >= TOUCH_TRIGGER) {
          touchStartY = null;
          computeContentTop();
          beginSnap(contentTopY, STATE.CONTENT);
        }
      }
      return;
    }

    if (state === STATE.SNAPPING) {
      e.preventDefault();
      return;
    }

    if (state === STATE.CONTENT && atContentTop()) {
      var dyUp = e.touches[0].clientY - touchStartY; 
      if (dyUp > 0) {
        e.preventDefault();
        if (dyUp >= TOUCH_TRIGGER) {
          touchStartY = null;
          beginSnap(0, STATE.HERO);
        }
      }
    }
  }

  function onTouchEnd() { touchStartY = null; }

  
  function onScroll() {
    if (state === STATE.SNAPPING) return; 
    
    if (window.pageYOffset < contentTopY - 8) {
      if (state !== STATE.HERO) state = STATE.HERO;
    } else if (window.pageYOffset > contentTopY + 8) {
      if (state !== STATE.CONTENT) state = STATE.CONTENT;
    }
  }

  
  function init() {
    computeContentTop();
    syncStateToScroll();

    
    var ht = hero.querySelector('.hero-title');
    var hd = hero.querySelector('.hero-desc');
    var hh = hero.querySelector('.hero-scroll-hint');
    if (ht) heroTextEls.push({ el: ht, depth: 1.0 });
    if (hd) heroTextEls.push({ el: hd, depth: 1.2 });
    if (hh) heroTextEls.push({ el: hh, depth: 1.5 });

    
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('touchcancel', onTouchEnd, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });

    
    window.addEventListener('load', function () { computeContentTop(); syncStateToScroll(); });
    window.addEventListener('resize', function () { computeContentTop(); });

    
    var hint = document.querySelector('.hero-scroll-hint');
    if (hint) {
      hint.style.cursor = 'pointer';
      hint.addEventListener('click', function () {
        if (state === STATE.HERO) {
          computeContentTop();
          beginSnap(contentTopY, STATE.CONTENT);
        }
      });
    }

    
    setTimeout(syncStateToScroll, 450);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
