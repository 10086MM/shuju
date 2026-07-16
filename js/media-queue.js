/* Sequential image loader: one request at a time, viewport-aware. */
(function (global) {
  var MAX_CONCURRENT = 1;
  var GAP_MS = 48;
  var queue = [];
  var active = 0;
  var observer = null;

  function pump() {
    while (active < MAX_CONCURRENT && queue.length) {
      var job = queue.shift();
      active += 1;
      job(function () {
        active -= 1;
        global.setTimeout(pump, GAP_MS);
      });
    }
  }

  function enqueue(run, priority) {
    if (priority) queue.unshift(run);
    else queue.push(run);
    pump();
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

  function ensureObserver() {
    if (observer || typeof IntersectionObserver === 'undefined') return observer;
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var img = entry.target;
        observer.unobserve(img);
        if (typeof img._mediaArm === 'function') {
          var arm = img._mediaArm;
          img._mediaArm = null;
          arm();
        }
      });
    }, { rootMargin: '180px 0px', threshold: 0.01 });
    return observer;
  }

  /**
   * @param {HTMLImageElement} img
   * @param {function(done:Function):void} startLoad - call done() when load/error settles
   * @param {{immediate?:boolean,priority?:boolean}} [opts]
   */
  function schedule(img, startLoad, opts) {
    opts = opts || {};
    if (!img || typeof startLoad !== 'function') return;
    if (img.dataset.mediaQueued === '1') return;
    img.dataset.mediaQueued = '1';
    markPending(img);

    function arm() {
      enqueue(function (done) {
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
      }, !!opts.priority);
    }

    if (opts.immediate || opts.priority) {
      arm();
      return;
    }

    var obs = ensureObserver();
    if (!obs) {
      arm();
      return;
    }

    img._mediaArm = arm;
    obs.observe(img);
  }

  /**
   * Assign a concrete URL through the queue.
   * @param {HTMLImageElement} img
   * @param {string} src
   * @param {{immediate?:boolean,priority?:boolean}} [opts]
   */
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

  /**
   * Hydrate imgs that use data-src (or still have src under .js-sequential).
   * @param {ParentNode} [root]
   */
  function hydrate(root) {
    root = root || document;
    var nodes = root.querySelectorAll('img[data-src], img.js-sequential[src]');
    Array.prototype.forEach.call(nodes, function (img, index) {
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
        priority: img.dataset.mediaPriority === '1' || index === 0 && img.dataset.mediaImmediate === '1'
      });
    });
  }

  global.MediaLoadQueue = {
    schedule: schedule,
    loadSrc: loadSrc,
    hydrate: hydrate
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      hydrate(document);
    });
  } else {
    hydrate(document);
  }
})(window);
