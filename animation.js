/**
 * Quality Roots — Deal Alert Video Template
 * Animation Engine (GSAP)
 *
 * Concept: "THE SPOTLIGHT DROP"
 * Each product descends into a dramatic spotlight. Price reveal builds tension
 * through a cinematic sequence: original price slides in → red slash draws across it
 * → new price EXPLODES into frame → save badge spins in. Bold, streetwear-energy.
 *
 * Cycle: 1 product at a time (solo spotlight) × all products loop infinitely.
 * Total per cycle: ~10.5s
 */

// ── Register GSAP Plugins ──
gsap.registerPlugin(SplitText, DrawSVGPlugin, CustomEase);

// ── Config ──
const PRODUCTS_PER_CYCLE = 1;
const CYCLE_DURATION     = 10.5;  // seconds per product

// ── State ──
let PRODUCTS = [];
let currentBatch = 0;
let tickerStarted = false;
let particlesStarted = false;

// ─────────────────────────────────────────────────────────────
//  DATA LOADING
// ─────────────────────────────────────────────────────────────

async function loadProducts() {
  try {
    const res  = await fetch('./products.json', { cache: 'no-store' });
    const data = await res.json();
    PRODUCTS   = Array.isArray(data.products) ? data.products : [];
  } catch (err) {
    console.error('[QR Template] products.json failed to load:', err);
    PRODUCTS = [];
  }

  // One-time scene initialisation
  if (!tickerStarted)   { initTicker();    tickerStarted   = true; }
  if (!particlesStarted){ initParticles(); particlesStarted = true; }

  // Kick off the product cycle
  startCycle();
}

// ─────────────────────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────────────────────

function getBatch(batchIndex) {
  if (!PRODUCTS.length) return [];
  const start = (batchIndex * PRODUCTS_PER_CYCLE) % PRODUCTS.length;
  return Array.from({ length: PRODUCTS_PER_CYCLE }, (_, i) =>
    PRODUCTS[(start + i) % PRODUCTS.length]
  );
}

function calcSavePct(originalStr, discounted) {
  const orig = parseFloat(originalStr);
  if (!orig) return 0;
  return Math.round((1 - discounted / orig) * 100);
}

function fmtPrice(val) {
  const n = parseFloat(val);
  // Whole number → no decimals; otherwise 2 decimal places
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

// ─────────────────────────────────────────────────────────────
//  DOM RENDERING
// ─────────────────────────────────────────────────────────────

function renderBatch(products) {
  const container = document.getElementById('products-container');
  container.innerHTML = '';

  products.forEach((product) => {
    const savePct = calcSavePct(product.price, product.discounted_price);
    const thcVal  = product.lab_thc_value > 0 ? product.lab_thc_value : null;
    const thcUnit = product.lab_thc_unit || 'mg';

    const el = document.createElement('div');
    el.className = 'product-scene';

    el.innerHTML = `
      <!-- ── Left: Product Image ── -->
      <div class="product-image-area">
        <div class="spotlight-beam"></div>
        <div class="product-glow"></div>
        <img
          class="product-image"
          src="${product.image_url}"
          alt="${product.name}"
          crossorigin="anonymous"
        >
        <div class="product-shadow"></div>
      </div>

      <!-- ── Right: Product Info ── -->
      <div class="product-info">

        <div class="category-badge">${product.category || 'Cannabis'}</div>
        <div class="brand-line">${product.brand || ''}</div>
        <div class="product-title">${product.online_title || product.name}</div>

        <div class="info-divider"></div>

        <div class="price-and-badge">
          <div class="price-block">
            <!-- Original price with DrawSVG slash -->
            <div class="price-was-row">
              <span class="was-label">WAS</span>
              <div class="price-original-wrap">
                <span class="price-original">${fmtPrice(product.price)}</span>
                <svg class="slash-svg" viewBox="0 0 400 90" preserveAspectRatio="none">
                  <line class="slash-line" x1="8" y1="10" x2="392" y2="80"/>
                </svg>
              </div>
            </div>

            <!-- New price -->
            <div class="price-now-row">
              <span class="now-label">NOW ONLY</span>
              <span class="price-new">${fmtPrice(product.discounted_price)}</span>
            </div>
          </div>

          <!-- Save badge -->
          <div class="save-badge-wrap">
            <img
              class="save-burst-img"
              src="https://skoop-dev-code-agent.s3.us-east-1.amazonaws.com/n8n-continue%2Faigen-1773309444114%2Fassets%2Fdeal_burst-1773309687790.png"
              alt=""
            >
            <div class="save-badge-text">
              <div class="save-word">SAVE</div>
              <div class="save-pct-num">${savePct}%</div>
              <div class="save-off-word">OFF</div>
            </div>
          </div>
        </div>

        <!-- Strain / THC meta -->
        <div class="meta-row">
          ${product.strain_type ? `<div class="strain-tag">${product.strain_type}</div>` : ''}
          ${thcVal !== null ? `<div class="thc-tag">THC: ${thcVal}${thcUnit}</div>` : ''}
        </div>
      </div>
    `;

    container.appendChild(el);
  });
}

// ─────────────────────────────────────────────────────────────
//  TICKER (persistent, runs from first load)
// ─────────────────────────────────────────────────────────────

function initTicker() {
  const tickerEl = document.getElementById('ticker-inner');

  const segment = '\u00A0\u00A0\u00A0QUALITY ROOTS\u00A0\u00A0·\u00A0\u00A0DEAL ALERT\u00A0\u00A0·\u00A0\u00A0UP TO 50% OFF\u00A0\u00A0·\u00A0\u00A0SAVE BIG TODAY\u00A0\u00A0·\u00A0\u00A0';
  tickerEl.textContent = segment.repeat(10);

  // Small delay so scrollWidth is calculated after fonts load
  gsap.delayedCall(0.15, () => {
    const half = tickerEl.scrollWidth / 2;
    gsap.fromTo(
      tickerEl,
      { x: 0 },
      {
        x: -half,
        duration: 28,
        ease: 'none',
        repeat: -1
      }
    );
  });
}

// ─────────────────────────────────────────────────────────────
//  FLOATING PARTICLES (persistent)
// ─────────────────────────────────────────────────────────────

function initParticles() {
  const container = document.getElementById('particle-layer');

  for (let i = 0; i < 45; i++) {
    const p    = document.createElement('div');
    p.className = 'particle';
    const size  = 1.5 + Math.random() * 4;
    p.style.width  = size + 'px';
    p.style.height = size + 'px';
    container.appendChild(p);
    loopParticle(p);
  }
}

function loopParticle(p) {
  const startX = Math.random() * 1920;
  const startY = 400 + Math.random() * 680;

  gsap.set(p, { x: startX, y: startY, opacity: 0 });

  const tl = gsap.timeline({
    delay: Math.random() * 5,
    onComplete: () => loopParticle(p)
  });

  tl.to(p, { opacity: 0.15 + Math.random() * 0.4, duration: 0.6, ease: 'power1.in' })
    .to(p, {
      y: startY - (180 + Math.random() * 500),
      x: startX + (Math.random() - 0.5) * 160,
      duration: 4 + Math.random() * 5,
      ease: 'power1.out'
    }, 0)
    .to(p, { opacity: 0, duration: 1.2, ease: 'power1.in' }, '-=1.2');
}

// ─────────────────────────────────────────────────────────────
//  MAIN ANIMATION CYCLE
// ─────────────────────────────────────────────────────────────

function animateCycle(batchIndex) {
  const batch = getBatch(batchIndex);
  if (!batch.length) return;

  renderBatch(batch);

  // SplitText for product title
  const titleEl   = document.querySelector('.product-title');
  let   splitWords = null;
  if (titleEl) {
    try {
      const split  = new SplitText(titleEl, { type: 'words' });
      splitWords   = split.words;
    } catch (e) { /* SplitText graceful fallback */ }
  }

  // ──────────────────────────────────────
  //  Initial states  (all invisible / offstage)
  // ──────────────────────────────────────
  gsap.set('.product-image-area',  { opacity: 0, y: -20 });
  gsap.set('.spotlight-beam',      { scaleY: 0, opacity: 0, transformOrigin: 'top center' });
  gsap.set('.product-glow',        { opacity: 0, scale: 0.6, transformOrigin: 'center center' });
  gsap.set('.product-image',       { y: -280, scale: 0.85, opacity: 0 });
  gsap.set('.product-shadow',      { scaleX: 0, opacity: 0, transformOrigin: 'center center' });

  gsap.set('.category-badge',      { x: -150, opacity: 0 });
  gsap.set('.brand-line',          { x: -120, opacity: 0 });
  gsap.set('.info-divider',        { scaleX: 0, opacity: 0, transformOrigin: 'left center' });

  if (splitWords && splitWords.length) {
    gsap.set(splitWords, { y: 35, opacity: 0 });
  } else if (titleEl) {
    gsap.set(titleEl, { y: 35, opacity: 0 });
  }

  gsap.set('.price-was-row',       { x: -100, opacity: 0 });
  gsap.set('.slash-svg',           { opacity: 0 });
  gsap.set('.slash-line',          { drawSVG: '0%' });
  gsap.set('.price-now-row',       { scale: 0.55, opacity: 0, transformOrigin: 'left center' });
  gsap.set('.save-badge-wrap',     { scale: 0, rotation: -25, opacity: 0, transformOrigin: 'center center' });
  gsap.set('.meta-row',            { y: 22, opacity: 0 });
  gsap.set('#screen-flash',        { opacity: 0 });

  // ──────────────────────────────────────
  //  Master Timeline
  // ──────────────────────────────────────
  const tl = gsap.timeline({
    onComplete: () => animateCycle(batchIndex + 1)
  });

  // ── 0.0 – 0.35s : Entry flash burst ──
  tl.to('#screen-flash', {
    opacity: 0.18, duration: 0.07,
    yoyo: true, repeat: 3
  }, 0);

  // ── 0.10s : Spotlight beam descends ──
  tl.to('.spotlight-beam', {
    scaleY: 1, opacity: 1,
    duration: 0.55, ease: 'power3.out'
  }, 0.10);

  tl.to('.product-glow', {
    opacity: 1, scale: 1,
    duration: 0.7, ease: 'power2.out'
  }, 0.20);

  // ── 0.35s : Product image area fades in ──
  tl.to('.product-image-area', {
    opacity: 1, y: 0,
    duration: 0.3, ease: 'power2.out'
  }, 0.35);

  // ── 0.45s : Product image drops with elastic bounce ──
  tl.to('.product-image', {
    y: 0, scale: 1, opacity: 1,
    duration: 1.1, ease: 'elastic.out(1, 0.52)'
  }, 0.45);

  // Shadow lands after image
  tl.to('.product-shadow', {
    scaleX: 1, opacity: 0.6,
    duration: 0.45, ease: 'power2.out'
  }, 1.15);

  // ── 0.9s : Category badge crashes in ──
  tl.to('.category-badge', {
    x: 0, opacity: 1,
    duration: 0.55, ease: 'back.out(2.8)'
  }, 0.90);

  // ── 1.15s : Brand name slides in ──
  tl.to('.brand-line', {
    x: 0, opacity: 1,
    duration: 0.5, ease: 'back.out(2.2)'
  }, 1.15);

  // ── 1.40s : Product title words cascade in ──
  if (splitWords && splitWords.length) {
    tl.to(splitWords, {
      y: 0, opacity: 1,
      duration: 0.42,
      stagger: 0.065,
      ease: 'back.out(1.6)'
    }, 1.40);
  } else if (titleEl) {
    tl.to(titleEl, {
      y: 0, opacity: 1,
      duration: 0.5, ease: 'back.out(1.6)'
    }, 1.40);
  }

  // ── 2.15s : Divider line draws across ──
  tl.to('.info-divider', {
    scaleX: 1, opacity: 1,
    duration: 0.5, ease: 'power3.out'
  }, 2.15);

  // ── 2.35s : Original price slides in ──
  tl.to('.price-was-row', {
    x: 0, opacity: 1,
    duration: 0.55, ease: 'back.out(2.2)'
  }, 2.35);

  // ── 3.05s : Red slash DrawSVG across original price ──
  tl.to('.slash-svg',  { opacity: 1, duration: 0.05 }, 3.05);
  tl.to('.slash-line', { drawSVG: '100%', duration: 0.42, ease: 'power3.out' }, 3.10);

  // Small screen flash on slash completion
  tl.to('#screen-flash', { opacity: 0.07, duration: 0.05, yoyo: true, repeat: 1 }, 3.48);

  // ── 3.58s : New price EXPLODES into frame ──
  tl.to('.price-now-row', {
    scale: 1, opacity: 1,
    duration: 0.75, ease: 'elastic.out(1.1, 0.42)'
  }, 3.58);

  // ── 4.45s : Save badge spins in ──
  tl.to('.save-badge-wrap', {
    scale: 1, rotation: 0, opacity: 1,
    duration: 0.85, ease: 'elastic.out(1.2, 0.42)'
  }, 4.45);

  // ── 5.05s : Meta row slides up ──
  tl.to('.meta-row', {
    y: 0, opacity: 1,
    duration: 0.45, ease: 'back.out(2)'
  }, 5.05);

  // ──────────────────────────────────────
  //  5.3s → 8.4s : LIVING MOMENT
  //  gentle breathing, pulsing, wobbling
  // ──────────────────────────────────────

  // Product image floats up and down
  tl.to('.product-image', {
    y: -22, duration: 2.0,
    yoyo: true, repeat: 1,
    ease: 'sine.inOut'
  }, 5.3);

  // Shadow breathes with the float
  tl.to('.product-shadow', {
    scaleX: 0.82, opacity: 0.32,
    duration: 2.0, yoyo: true, repeat: 1,
    ease: 'sine.inOut'
  }, 5.3);

  // Glow pulses gently
  tl.to('.product-glow', {
    opacity: 0.65, scale: 1.12,
    duration: 1.6, yoyo: true, repeat: 1,
    ease: 'sine.inOut'
  }, 5.4);

  // Price new pulses (draws attention to the deal)
  tl.to('.price-new', {
    textShadow: '0 0 120px rgba(123,201,64,0.95), 0 0 50px rgba(123,201,64,0.6), 5px 5px 0 rgba(0,0,0,0.7)',
    duration: 1.2, yoyo: true, repeat: 1,
    ease: 'sine.inOut'
  }, 5.5);

  // Save badge wobbles
  tl.to('.save-badge-wrap', {
    rotation: 9, duration: 0.65,
    yoyo: true, repeat: 5,
    ease: 'sine.inOut'
  }, 5.5);

  // Spotlight beam pulses width slightly
  tl.to('.spotlight-beam', {
    opacity: 0.85, duration: 1.5,
    yoyo: true, repeat: 1,
    ease: 'sine.inOut'
  }, 5.8);

  // ──────────────────────────────────────
  //  8.6s → 10.3s : EXIT
  // ──────────────────────────────────────

  // Pre-exit flash
  tl.to('#screen-flash', {
    opacity: 0.12, duration: 0.07,
    yoyo: true, repeat: 1
  }, 8.6);

  // Image sweeps left
  tl.to('.product-image-area', {
    x: -950, opacity: 0,
    duration: 0.72, ease: 'power3.in'
  }, 8.72);

  // Info sweeps right
  tl.to('.product-info', {
    x: 1000, opacity: 0,
    duration: 0.72, ease: 'power3.in'
  }, 8.72);

  // Spotlight collapses
  tl.to(['.spotlight-beam', '.product-glow'], {
    opacity: 0, duration: 0.45, ease: 'power2.in'
  }, 8.72);

  // Exit flash
  tl.to('#screen-flash', {
    opacity: 0.2, duration: 0.08,
    yoyo: true, repeat: 2
  }, 9.35);

  // Buffer gap before next cycle begins
  tl.to({}, { duration: 0.45 });

  return tl;
}

// ─────────────────────────────────────────────────────────────
//  CYCLE ENTRY
// ─────────────────────────────────────────────────────────────

function startCycle() {
  animateCycle(0);
}

// ─────────────────────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', loadProducts);
