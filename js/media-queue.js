/* Focus-first module loader for GitHub Pages.
 * The module you are looking at / scrolling jumps the queue;
 * urgent() bypasses the queue for modal / hero. */
(function (global) {
  var MODULE_SELECTOR = [
    '[data-media-module]',
    '.pattern-showcase',
    '.age-outfit',
    '.act-media-grid',
    '.ring-ritual',
    '.figure-block.act-media',
    '.embed-pane',
    '.gate',
    '.timeline'
  ].join(', ');

  var MAX_CONCURRENT = 4; /* 同屏模块内并行，避免一张一张拖慢 */
  var GAP_MS = 0;
  var states = [];
  var moduleQueue = [];
  var currentState = null;
  var preferredState = null;
  var moduleObserver = null;
  var scrollBound = false;
  var scrollRaf = 0;
  var activeJobs = 0;

  function findModule(el) {
    if (!el || !el.closest) return document.body;
    return el.closest(MODULE_SELECTOR) || el.closest('.cloth-section') || el.closest('.story-panel') || document.body;
  }

  function getState(moduleEl) {
    for (var i = 0; i < states.length; i++) {
      if (states[i].el === moduleEl) return states[i];
    }
    var state = {
      el: moduleEl,
      jobs: [],
      unlocked: false,
      running: false,
      observed: false,
      preempt: false
    };
    states.push(state);
    return state;
  }

  function syncSlot(img, pending) {
    var slot = img.closest && img.closest(
      '.pattern-bento__item, .pattern-coverflow__card, .pattern-spotlight__thumb, .fcard, .content-card'
    );
    if (!slot) return;
    if (slot.tagName === 'IMG') slot = slot.parentElement;
    if (!slot) return;
    slot.classList.toggle('media-slot-pending', pending);
  }

  function markPending(img) {
    img.classList.add('media-pending');
    img.classList.remove('media-loaded');
    img.decoding = 'async';
    syncSlot(img, true);
  }

  function markLoaded(img) {
    img.classList.remove('media-pending');
    img.classList.add('media-loaded');
    syncSlot(img, false);
  }

  function bindScrollFocus() {
    if (scrollBound) return;
    scrollBound = true;
    function onScroll() {
      if (scrollRaf) return;
      scrollRaf = global.requestAnimationFrame(function () {
        scrollRaf = 0;
        updateFocusFromViewport();
      });
    }
    global.addEventListener('scroll', onScroll, { passive: true, capture: true });
    document.querySelectorAll('.story-panel__scroll').forEach(function (el) {
      el.addEventListener('scroll', onScroll, { passive: true });
    });
  }

  function visibleScore(el) {
    var r = el.getBoundingClientRect();
    var vh = global.innerHeight || document.documentElement.clientHeight;
    var vw = global.innerWidth || document.documentElement.clientWidth;
    if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) return 0;
    var visibleH = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    var visibleW = Math.min(r.right, vw) - Math.max(r.left, 0);
    return Math.max(0, visibleH) * Math.max(0, visibleW);
  }

  function updateFocusFromViewport() {
    var best = null;
    var bestScore = 0;
    for (var i = 0; i < states.length; i++) {
      var state = states[i];
      if (!state.jobs.length && !state.running) continue;
      var score = visibleScore(state.el);
      if (score > bestScore) {
        bestScore = score;
        best = state;
      }
    }
    if (best && bestScore > 80) {
      boostModule(best.el);
    }
  }

  function ensureModuleObserver() {
    if (moduleObserver || typeof IntersectionObserver === 'undefined') return moduleObserver;
    moduleObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        boostModule(entry.target);
      });
    }, { rootMargin: '320px 0px', threshold: [0.01, 0.15, 0.4] });
    return moduleObserver;
  }

  function observeModule(moduleEl) {
    var state = getState(moduleEl);
    if (!state.observed) {
      state.observed = true;
      moduleEl.classList.add('media-module');
      bindScrollFocus();
      var obs = ensureModuleObserver();
      if (obs) obs.observe(moduleEl);
    }
    if (visibleScore(moduleEl) > 80) {
      boostModule(moduleEl);
    }
  }

  function boostModule(moduleEl) {
    var state = getState(moduleEl);
    state.unlocked = true;
    moduleEl.classList.add('media-module-unlocked');
    preferredState = state;

    var idx = moduleQueue.indexOf(state);
    if (idx !== -1) moduleQueue.splice(idx, 1);
    moduleQueue.unshift(state);

    if (currentState && currentState !== state) {
      currentState.preempt = true;
    }
    pumpModules();
  }

  function runModuleJobs(state, onDone) {
    var finished = false;
    var inFlight = 0;

    function finish(preempted) {
      if (finished) return;
      finished = true;
      onDone(!!preempted);
    }

    function pump() {
      if (finished) return;
      if (state.preempt) {
        state.preempt = false;
        if (inFlight === 0) finish(true);
        return;
      }
      if (!state.jobs.length && inFlight === 0) {
        finish(false);
        return;
      }
      while (!state.preempt && state.jobs.length && inFlight < MAX_CONCURRENT) {
        (function () {
          var job = state.jobs.shift();
          inFlight += 1;
          activeJobs += 1;
          job(function () {
            inFlight -= 1;
            activeJobs -= 1;
            if (GAP_MS > 0) global.setTimeout(pump, GAP_MS);
            else pump();
          });
        })();
      }
      if (state.preempt && inFlight === 0) {
        state.preempt = false;
        finish(true);
      }
    }
    pump();
  }

  function pumpModules() {
    if (currentState) return;

    if (preferredState && preferredState.jobs.length) {
      var pidx = moduleQueue.indexOf(preferredState);
      if (pidx > 0) {
        moduleQueue.splice(pidx, 1);
        moduleQueue.unshift(preferredState);
      } else if (pidx === -1) {
        moduleQueue.unshift(preferredState);
      }
    }

    while (moduleQueue.length) {
      var state = moduleQueue.shift();
      if (!state.unlocked) continue;
      if (!state.jobs.length) {
        state.el.classList.add('media-module-ready');
        continue;
      }
      currentState = state;
      state.running = true;
      state.el.classList.add('media-module-loading');
      runModuleJobs(state, function (preempted) {
        state.running = false;
        state.el.classList.remove('media-module-loading');
        if (!state.jobs.length) state.el.classList.add('media-module-ready');
        currentState = null;
        if (state.jobs.length && moduleQueue.indexOf(state) === -1) {
          if (preempted) moduleQueue.push(state);
          else moduleQueue.unshift(state);
        }
        pumpModules();
      });
      return;
    }
  }

  function schedule(img, startLoad, opts) {
    opts = opts || {};
    if (!img || typeof startLoad !== 'function') return;
    if (img.dataset.mediaQueued === '1' && !opts.force) return;
    img.dataset.mediaQueued = '1';
    markPending(img);

    var moduleEl = opts.module || findModule(img);
    var state = getState(moduleEl);

    var job = function (done) {
      var settled = false;
      function finish() {
        if (settled) return;
        settled = true;
        markLoaded(img);
        done();
      }
      try {
        startLoad(finish);
      } catch (err) {
        finish();
      }
    };

    if (opts.priority) state.jobs.unshift(job);
    else state.jobs.push(job);

    observeModule(moduleEl);

    if (opts.immediate || opts.priority || opts.boost) {
      boostModule(moduleEl);
    }
  }

  function loadSrc(img, src, opts) {
    if (!img || !src) return;
    schedule(img, function (done) {
      var finished = false;
      function onDone() {
        if (finished) return;
        finished = true;
        img.removeEventListener('load', onDone);
        img.removeEventListener('error', onDone);
        done();
      }
      img.addEventListener('load', onDone);
      img.addEventListener('error', onDone);
      img.src = src;
      if (img.complete && img.naturalWidth > 0) onDone();
    }, opts);
  }

  /** Bypass queue — used for modal / user-clicked image. */
  function urgent(img, src) {
    if (!img || !src) return;
    img.dataset.mediaQueued = '1';
    markPending(img);
    var finished = false;
    function onDone() {
      if (finished) return;
      finished = true;
      img.removeEventListener('load', onDone);
      img.removeEventListener('error', onDone);
      markLoaded(img);
    }
    img.addEventListener('load', onDone);
    img.addEventListener('error', onDone);
    img.src = src;
    if (img.complete && img.naturalWidth > 0) onDone();

    var moduleEl = findModule(img);
    if (moduleEl && moduleEl !== document.body) boostModule(moduleEl);
  }

  function prioritizeImage(img) {
    if (!img) return;
    var moduleEl = findModule(img);
    boostModule(moduleEl);
    /* move this img's pending job to front if still pending */
    var state = getState(moduleEl);
    /* can't easily reorder anonymous jobs; boost module is enough.
       If not yet started, force urgent load from data-src/src: */
    if (!img.src && img.getAttribute('data-src')) {
      urgent(img, img.getAttribute('data-src'));
    } else if (img.classList.contains('media-pending') && img.getAttribute('data-src')) {
      urgent(img, img.getAttribute('data-src'));
    }
  }

  function hydrate(root) {
    root = root || document;
    var nodes = root.querySelectorAll('img[data-src], img.js-sequential[src]');
    Array.prototype.forEach.call(nodes, function (img) {
      if (img.dataset.mediaQueued === '1') return;
      if (img.closest && img.closest('.pattern-info-modal')) return;

      var src = img.getAttribute('data-src') || img.getAttribute('src');
      if (!src) return;

      if (img.hasAttribute('src') && img.getAttribute('data-src')) {
        img.removeAttribute('src');
      } else if (img.classList.contains('js-sequential') && img.getAttribute('src')) {
        img.setAttribute('data-src', src);
        img.removeAttribute('src');
      } else if (img.getAttribute('data-src')) {
        img.removeAttribute('src');
      }

      loadSrc(img, src, {
        immediate: img.dataset.mediaImmediate === '1',
        priority: img.dataset.mediaPriority === '1',
        boost: img.dataset.mediaImmediate === '1'
      });
    });
  }

  function refresh(root) {
    hydrate(root || document);
    var modules = (root || document).querySelectorAll(MODULE_SELECTOR);
    Array.prototype.forEach.call(modules, function (el) {
      if (el.querySelector('img.media-pending, img[data-src], img.media-loaded')) {
        observeModule(el);
      }
    });
    updateFocusFromViewport();
  }

  global.MediaLoadQueue = {
    schedule: schedule,
    loadSrc: loadSrc,
    hydrate: hydrate,
    refresh: refresh,
    unlock: boostModule,
    boost: boostModule,
    urgent: urgent,
    prioritizeImage: prioritizeImage
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      hydrate(document);
      bindScrollFocus();
    });
  } else {
    hydrate(document);
    bindScrollFocus();
  }
})(window);
