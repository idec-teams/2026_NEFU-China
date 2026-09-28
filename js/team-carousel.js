

(function () {
  'use strict';

  function init() {
    var track = document.getElementById('teamCarouselTrack');
    if (!track) return;

    var scroller = track.parentElement; 
    var speed = 0.8;          
    var resumeDelay = 1600;   
    var paused = false;
    var dragging = false;
    var startX = 0;
    var startScroll = 0;
    var lastX = 0;
    var velocity = 0;
    var resumeTimer = null;

    var half = 0;             

    function measure() {
      half = track.scrollWidth / 2;
    }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);

    function pause() {
      paused = true;
      if (resumeTimer) clearTimeout(resumeTimer);
    }

    function scheduleResume() {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () { paused = false; }, resumeDelay);
    }

    function wrap(v) {
      if (half <= 0) return v;
      while (v < 0) v += half;
      while (v >= half) v -= half;
      return v;
    }

    
    function tick() {
      if (!paused && !dragging && half > 0) {
        scroller.scrollLeft = wrap(scroller.scrollLeft + speed);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    
    scroller.addEventListener('mouseenter', pause);
    scroller.addEventListener('mouseleave', scheduleResume);

    
    track.addEventListener('pointerdown', function (e) {
      dragging = true;
      paused = true;
      startX = lastX = e.clientX;
      startScroll = scroller.scrollLeft;
      velocity = 0;
      track.classList.add('dragging');
      track.setPointerCapture(e.pointerId);
    });

    track.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX;
      lastX = e.clientX;
      velocity = dx;
      scroller.scrollLeft = wrap(startScroll - (e.clientX - startX));
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('dragging');
      
      var glide = function () {
        if (Math.abs(velocity) < 0.5) { scheduleResume(); return; }
        velocity *= 0.94;
        scroller.scrollLeft = wrap(scroller.scrollLeft - velocity);
        requestAnimationFrame(glide);
      };
      requestAnimationFrame(glide);
    }

    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    
    scroller.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        pause();
        scroller.scrollLeft = wrap(scroller.scrollLeft + e.deltaX);
        scheduleResume();
      }
    }, { passive: false });

    
    scroller.addEventListener('touchstart', pause, { passive: true });
    scroller.addEventListener('touchend', scheduleResume);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
