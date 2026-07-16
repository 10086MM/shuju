/* Module-first image loader for static hosting (GitHub Pages).
 * Images stay idle until their module enters view; modules load one by one. */
(function (global) {
  var MODULE_SELECTOR = [
    '[data-media-module]',
    '.pattern-showcase',
    '.age-outfit',
    '.cloth-section',
    '.act-media-grid',
    '.ring-ritual',
    '.figure-block.act-media',
    '.embed-pane',
    '.gate',
    '.timeline',
    '.taboo .gates'
  ].join(', ');

  var GAP_MS = 40;
  var states = [];
  var moduleQueue = [];
  var currentState = null;
  var moduleObserver = null;

  function findModule(el) {
    if (!el || !el.closest) return document.body;
    return el.closest(MODULE_SELECTOR) || el.closest('.story-panel') || document.body;
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
      observed: false
    };
    states.push(state);
    return state;
  }

  function syncSlot(img, pending) {
    var slot = img.closest && img.closest(
      '.pattern-bento__item, .pattern-coverflow__card, .pattern-spotlight__thumb, .act-media-grid > img, .fcard, .content-card'
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

  function ensureModuleObserver() {
    if (moduleObserver || typeof IntersectionObserver === 'undefined') return moduleObserver;
    moduleObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        unlockModule(entry.target);
        moduleObserver.unobserve(entry.target);
      });
    }, { rootMargin: '220px 0px', threshold: 0.08 });
    return moduleObserver;
  }

  function observeModule(moduleEl) {
    var state = getState(moduleEl);
    if (state.observed) return;
    state.observed = true;
    moduleEl.classList.add('media-module');

    var obs = ensureModuleObserver();
    if (!obs) {
      unlockModule(moduleEl);
      return;
    }

    /* already on screen (e.g. first chapter) */
    var rect = moduleEl.getBoundingClientRect();
    var vh = global.innerHeight || document.documentElement.clientHeight;
    if (rect.top < vh + 220 && rect.bottom > -40) {
      unlockModule(moduleEl);
      return;
    }
    obs.observe(moduleEl);
  }

  function unlockModule(moduleEl) {
    var state = getState(moduleEl);
    if (state.unlocked) {
      pumpModules();
      return;
    }
    state.unlocked = true;
    moduleEl.classList.add('media-module-unlocked');
    if (moduleQueue.indexOf(state) === -1) moduleQueue.push(state);
    pumpModules();
  }

  function runModuleJobs(state, onDone) {
    function next() {
      if (!state.jobs.length) {
        onDone();
        return;
      }
      var job = state.jobs.shift();
      job(function () {
        global.setTimeout(next, GAP_MS);
      });
    }
    next();
  }

  function pumpModules() {
    if (currentState) return;
    while (moduleQueue.length) {
      var state = moduleQueue.shift();
      if (!state.jobs.length) {
        state.el.classList.add('media-module-ready');
        continue;
      }
      currentState = state;
      state.running = true;
      state.el.classList.add('media-module-loading');
      runModuleJobs(state, function () {
        state.running = false;
        state.el.classList.remove('media-module-loading');
        state.el.classList.add('media-module-ready');
        currentState = null;
        /* if new jobs arrived while running, re-queue */
        if (state.jobs.length && moduleQueue.indexOf(state) === -1) {
          moduleQueue.unshift(state);
        }
        pumpModules();
      });
      return;
    }
  }

  /**
   * @param {HTMLImageElement} img
   * @param {function(done:Function):void} startLoad
   * @param {{immediate?:boolean,priority?:boolean,module?:Element}} [opts]
   */
  function schedule(img, startLoad, opts) {
    opts = opts || {};
    if (!img || typeof startLoad !== 'function') return;
    if (img.dataset.mediaQueued === '1') return;
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

    if (opts.immediate || opts.priority) {
      unlockModule(moduleEl);
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
        priority: img.dataset.mediaPriority === '1'
      });
    });
  }

  /** Re-scan modules after dynamic galleries are built. */
  function refresh(root) {
    hydrate(root || document);
    var modules = (root || document).querySelectorAll(MODULE_SELECTOR);
    Array.prototype.forEach.call(modules, function (el) {
      if (el.querySelector('img.media-pending, img[data-src]')) observeModule(el);
    });
  }

  global.MediaLoadQueue = {
    schedule: schedule,
    loadSrc: loadSrc,
    hydrate: hydrate,
    refresh: refresh,
    unlock: unlockModule
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      hydrate(document);
    });
  } else {
    hydrate(document);
  }
})(window);
