(function() {
  'use strict';

  var NODES = [0, 25, 50, 75, 100];
  var SEGMENT_MS = 800;
  var FINALE_HOLD_MS = 1000;
  var FADE_MS = 600;
  var LOOP_POINT = NODES.length * SEGMENT_MS;

  var Loader = {
    init: function() {
      var loader = document.getElementById('loader');
      if (!loader) return;

      this.loader = loader;
      this.dogs = Array.prototype.slice.call(loader.querySelectorAll('.loader-dog'));
      this.phase = -1;
      this.lastSwitch = -Infinity;
      this.start = performance.now();
      this.windowLoaded = document.readyState === 'complete';
      this.finished = false;

      document.body.style.overflow = 'hidden';

      if (!this.windowLoaded) {
        window.addEventListener('load', function() {
          this.windowLoaded = true;
          var elapsed = performance.now() - this.start;
          if (elapsed >= LOOP_POINT) {
            this.start = performance.now() - LOOP_POINT;
          }
        }.bind(this));
      }

      // Decouple the loader from slow assets (large images): DOM readiness is
      // enough for it to finish. 'load' and the timeout remain as backstops.
      var domReady = function() {
        setTimeout(function() {
          this.windowLoaded = true;
          var elapsed = performance.now() - this.start;
          if (elapsed >= LOOP_POINT) {
            this.start = performance.now() - LOOP_POINT;
          }
        }.bind(this), 200);
      }.bind(this);

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', domReady);
      } else {
        domReady();
      }

      this.setPhase(0);
      requestAnimationFrame(this.tick.bind(this));

      setTimeout(function() {
        this.windowLoaded = true;
        var elapsed = performance.now() - this.start;
        if (elapsed >= LOOP_POINT) {
          this.start = performance.now() - LOOP_POINT;
        }
      }.bind(this), 6000);
    },

    tick: function(now) {
      if (this.finished) return;

      var elapsed = now - this.start;
      var node = Math.floor(elapsed / SEGMENT_MS);
      if (node >= NODES.length) {
        node = NODES.length - 1;
      }
      this.updatePhase(NODES[node]);

      if (this.windowLoaded && elapsed >= LOOP_POINT) {
        this.finish();
        return;
      }

      requestAnimationFrame(this.tick.bind(this));
    },

    updatePhase: function(node) {
      if (node === this.phase) return;
      this.setPhase(node);
    },

    setPhase: function(node) {
      this.phase = node;
      this.lastSwitch = performance.now();
      for (var i = 0; i < this.dogs.length; i++) {
        var dog = this.dogs[i];
        if (parseInt(dog.getAttribute('data-phase'), 10) === node) {
          dog.classList.remove('leaving');
          dog.classList.add('active');
        } else if (dog.classList.contains('active')) {
          dog.classList.remove('active');
          dog.classList.add('leaving');
          setTimeout(function(d) {
            return function() { d.classList.remove('leaving'); };
          }(dog), 500);
        }
      }
    },

    finish: function() {
      if (this.finished) return;
      this.finished = true;

      this.setPhase(100);
      this.loader.classList.add('celebrate');

      var self = this;
      setTimeout(function() {
        self.loader.classList.add('completing');
        setTimeout(function() {
          self.loader.classList.add('hidden');
          document.body.style.overflow = '';
        }, FADE_MS);
      }, FINALE_HOLD_MS);
    }
  };

  window.Loader = Loader;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { Loader.init(); });
  } else {
    Loader.init();
  }
})();