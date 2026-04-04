/* =============================================
   ZLATAR STARS — Master Script
   Unified animation & interaction system
   ============================================= */

// ─── HERO VIDEO ───────────────────────────────
const heroVideo = document.getElementById('heroVideo');
if (heroVideo) {
  heroVideo.addEventListener('loadeddata', () => {
    heroVideo.play().catch(() => {
      document.addEventListener('click', () => heroVideo.play(), { once: true });
    });
  });
}

// ─── HERO REVEAL (stagger on load) ────────────
window.addEventListener('DOMContentLoaded', () => {
  const heroEls = [
    { id: 'heroTitle',    delay: 400 },
    { id: 'heroSubtitle', delay: 800 },
    { id: 'heroTagline',  delay: 1100 },
    { id: 'scrollIndicator', delay: 1600 },
  ];
  heroEls.forEach(({ id, delay }) => {
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.classList.add('revealed'), delay);
  });

  // Carousel
  initCarousel();

  // Price calc defaults
  const today = new Date().toISOString().split('T')[0];
  const ci = document.getElementById('checkIn');
  const co = document.getElementById('checkOut');
  if (ci) {
    ci.setAttribute('min', today);
    ci.value = today;
  }
  if (co) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    co.setAttribute('min', today);
    co.value = tomorrow.toISOString().split('T')[0];
  }
  updatePriceCalculation();
});

// ─── SCROLL REVEAL (Intersection Observer) ────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const delay = parseInt(el.dataset.revealDelay || 0);
    setTimeout(() => el.classList.add('revealed'), delay);
    revealObserver.unobserve(el);
  });
}, {
  threshold: 0.08,
  rootMargin: '0px 0px -80px 0px'
});

// Everything that animates on scroll
const scrollRevealSelectors = [
  '.section-title',
  '.section-subtitle',
  '.loc-title',
  '.loc-intro',
  '.loc-stat',
  '.form-title',
  '.form-subtitle',
  '.form-group',
  '.price-row',
  '.form-actions',
  '.reservation-title .title-line',
  '.reservation-subtitle',
];

function observeAll() {
  scrollRevealSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.remove('revealed');
      revealObserver.observe(el);
    });
  });
  // Amenity cards use translateX reveal (handled by CSS class)
  document.querySelectorAll('.loc-amenity-card').forEach(el => {
    el.classList.remove('revealed');
    revealObserver.observe(el);
  });
}
observeAll();

// ─── NAVBAR ──────────────────────────────────
const navbar = document.getElementById('navbar');
if (navbar) {
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 60);
    navbar.classList.toggle('hidden', y > lastY + 5 && y > 200);
    navbar.classList.toggle('visible', y < lastY - 5);
    lastY = y;
  }, { passive: true });

  // Smooth anchor links
  navbar.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ─── PARALLAX (hero only, subtle) ─────────────
window.addEventListener('scroll', () => {
  const heroContent = document.querySelector('.hero-content');
  if (heroContent && window.scrollY < window.innerHeight) {
    heroContent.style.transform = `translateY(${window.scrollY * 0.25}px)`;
    heroContent.style.opacity = 1 - window.scrollY / (window.innerHeight * 0.7);
  }
}, { passive: true });

// ─── CAROUSEL ─────────────────────────────────
function initCarousel() {
  const container  = document.getElementById('carouselContainer');
  const prevBtn    = document.getElementById('prevBtn');
  const nextBtn    = document.getElementById('nextBtn');
  const indicators = document.querySelectorAll('.indicator');
  if (!container) return;

  let current = 0;
  const total = document.querySelectorAll('.apartment-card').length;

  function go(idx) {
    current = (idx + total) % total;
    container.style.transform = `translateX(-${current * 100}%)`;
    indicators.forEach((ind, i) => ind.classList.toggle('active', i === current));

    // Subtle card entrance: fade + slide inner content
    const cards = document.querySelectorAll('.apartment-card');
    cards.forEach((card, i) => {
      card.classList.toggle('is-active', i === current);
    });
  }

  prevBtn && prevBtn.addEventListener('click', () => go(current - 1));
  nextBtn && nextBtn.addEventListener('click', () => go(current + 1));
  indicators.forEach((ind, i) => ind.addEventListener('click', () => go(i)));

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') go(current - 1);
    if (e.key === 'ArrowRight') go(current + 1);
  });

  // Touch / swipe
  let tx = 0;
  container.addEventListener('touchstart', e => { tx = e.changedTouches[0].screenX; }, { passive: true });
  container.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].screenX - tx;
    if (Math.abs(dx) > 50) go(dx < 0 ? current + 1 : current - 1);
  });

  go(0);
}

// ─── MAP PIN INTERACTIONS ─────────────────────
document.querySelectorAll('.map-pin').forEach(pin => {
  const pulse = pin.querySelector('.pin-pulse');
  pin.addEventListener('mouseenter', () => { if (pulse) pulse.style.animationDuration = '0.7s'; });
  pin.addEventListener('mouseleave', () => { if (pulse) pulse.style.animationDuration = '2.5s'; });
  pin.addEventListener('click', () => {
    pin.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.25)' },
      { transform: 'scale(1)' },
    ], { duration: 300, easing: 'cubic-bezier(0.22,0.61,0.36,1)' });
  });
});

// ─── EXPLORE BUTTON ───────────────────────────
const exploreBtn = document.querySelector('.explore-button');
if (exploreBtn) {
  exploreBtn.addEventListener('click', () => {
    const target = document.querySelector('.apartments-section');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ─── BOOK BUTTON ──────────────────────────────
document.addEventListener('click', e => {
  if (!e.target.classList.contains('book-button')) return;
  const name = e.target.closest('.apartment-card')?.querySelector('.apartment-name')?.textContent;
  if (name) {
    showToast(`Hvala! Kliknite "Rezerviši" u formi da završite rezervaciju za ${name}.`);
    const form = document.querySelector('.reservation-section');
    if (form) setTimeout(() => form.scrollIntoView({ behavior: 'smooth', block: 'start' }), 600);
  }
});

// ─── TOAST NOTIFICATION ───────────────────────
function showToast(msg) {
  let toast = document.getElementById('zs-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'zs-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 4000);
}

// ─── PRICE CALCULATION ────────────────────────
function updatePriceCalculation() {
  const checkIn  = document.getElementById('checkIn')?.value;
  const checkOut = document.getElementById('checkOut')?.value;
  const apartment = document.getElementById('apartment');
  const nightEl  = document.getElementById('nightCount');
  const pnEl     = document.getElementById('pricePerNight');
  const totalEl  = document.getElementById('totalPrice');
  if (!nightEl || !pnEl || !totalEl) return;

  const opt = apartment?.selectedOptions[0];
  if (checkIn && checkOut && opt?.value) {
    const inD  = new Date(checkIn);
    const outD = new Date(checkOut);
    const ppn  = parseInt(opt.dataset.price);
    if (outD > inD && ppn) {
      const nights = Math.ceil((outD - inD) / 86400000);
      nightEl.textContent  = nights;
      pnEl.textContent     = `€${ppn}`;
      totalEl.textContent  = `€${nights * ppn}`;
      return;
    }
  }
  [nightEl, pnEl, totalEl].forEach(el => el.textContent = '—');
}

['checkIn','checkOut','apartment'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', updatePriceCalculation);
});

// ─── RESERVATION FORM SUBMIT ──────────────────
document.getElementById('reservationForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const btn  = document.getElementById('submitButton');
  const text = btn?.querySelector('.button-text');
  if (!btn || !text) return;

  btn.disabled   = true;
  btn.classList.add('loading');
  text.textContent = 'Slanje…';

  setTimeout(() => {
    showToast('✓ Rezervacija primljena! Kontaktiraćemo vas u roku od 24h.');
    this.reset();
    updatePriceCalculation();
    btn.disabled = false;
    btn.classList.remove('loading');
    text.textContent = 'Potvrdi Rezervaciju';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 1800);
});

// ─── CURSOR GLOW (desktop only) ───────────────
if (window.matchMedia('(pointer:fine)').matches) {
  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  document.body.appendChild(glow);
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
}

// ─── LIGHTBOX GALERIJA ────────────────────────
const GALLERIES = {
  '1': ['media/Apartman 1/1.jpg','media/Apartman 1/2.jpg','media/Apartman 1/3.jpg','media/Apartman 1/4.jpg'],
  '2': ['media/Apartman 2/1.jpg','media/Apartman 2/2.jpg','media/Apartman 2/3.jpg','media/Apartman 2/4.jpg'],
  '3': ['media/Apartman 3/1.jpg','media/Apartman 3/2.jpg','media/Apartman 3/3.jpg','media/Apartman 3/4.jpg'],
};

// Stanje po galeriji — pamti poslednju sliku
const galleryState = { '1': 0, '2': 0, '3': 0 };

let lbCurrentGallery = null;

function zsOpenLightbox(galleryId, startIndex) {
  const lb     = document.getElementById('zsLightbox');
  const images = GALLERIES[galleryId];
  lbCurrentGallery = galleryId;
  galleryState[galleryId] = startIndex;

  lb.classList.add('lb-open');
  document.body.style.overflow = 'hidden';

  lbBuildDots(images.length);
  lbGoTo(startIndex);
}

function lbClose() {
  const lb = document.getElementById('zsLightbox');
  lb.classList.remove('lb-open');
  document.body.style.overflow = '';

  // Resetuj sliku kartice na prvu
  if (lbCurrentGallery) {
    const cardImg = document.querySelector('.card-image[data-gallery="' + lbCurrentGallery + '"] img');
    if (cardImg) cardImg.src = GALLERIES[lbCurrentGallery][0];
    galleryState[lbCurrentGallery] = 0;
    lbUpdateCardCounter(lbCurrentGallery, 0);
    lbUpdateThumbs(lbCurrentGallery, 0);
  }

  setTimeout(() => {
    const lbImg = document.getElementById('lbImg');
    lbImg.src = '';
    lbImg.classList.remove('lb-img-ready');
  }, 350);
}

function lbGoTo(idx) {
  const images = GALLERIES[lbCurrentGallery];
  const total  = images.length;
  idx = (idx + total) % total;
  galleryState[lbCurrentGallery] = idx;

  const lbImg    = document.getElementById('lbImg');
  const lbLoader = document.getElementById('lbLoader');
  const lbCtr    = document.getElementById('lbCounter');

  lbImg.classList.remove('lb-img-ready');
  lbLoader.classList.remove('hidden');

  const tmp = new Image();
  tmp.onload = () => {
    lbImg.src = images[idx];
    lbLoader.classList.add('hidden');
    requestAnimationFrame(() => lbImg.classList.add('lb-img-ready'));
  };
  tmp.onerror = () => lbLoader.classList.add('hidden');
  tmp.src = images[idx];

  lbCtr.textContent = (idx + 1) + ' / ' + total;
  lbUpdateDots(idx);
  lbUpdateCardCounter(lbCurrentGallery, idx);
  lbUpdateThumbs(lbCurrentGallery, idx);
}

function lbUpdateCardCounter(gId, idx) {
  const span = document.querySelector('.gallery-counter[data-gallery="' + gId + '"]');
  if (span) span.textContent = (idx + 1) + ' / ' + GALLERIES[gId].length;
}

function lbUpdateThumbs(gId, idx) {
  document.querySelectorAll('.thumb-item[data-gallery="' + gId + '"]').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
  });
}

function lbBuildDots(total) {
  const lbDots = document.getElementById('lbDots');
  lbDots.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const d = document.createElement('button');
    d.className = 'lb-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Slika ' + (i + 1));
    const idx = i;
    d.addEventListener('click', () => lbGoTo(idx));
    lbDots.appendChild(d);
  }
}

function lbUpdateDots(idx) {
  document.querySelectorAll('.lb-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });
}

// Kontrole lightboxa
document.addEventListener('DOMContentLoaded', () => {
  const lbCloseBtn = document.getElementById('lbClose');
  const lbPrev     = document.getElementById('lbPrev');
  const lbNext     = document.getElementById('lbNext');
  const lb         = document.getElementById('zsLightbox');

  if (lbCloseBtn) lbCloseBtn.addEventListener('click', lbClose);
  if (lbPrev)     lbPrev.addEventListener('click', () => lbGoTo(galleryState[lbCurrentGallery] - 1));
  if (lbNext)     lbNext.addEventListener('click', () => lbGoTo(galleryState[lbCurrentGallery] + 1));

  // Klik na pozadinu zatvara
  if (lb) lb.addEventListener('click', e => { if (e.target === lb) lbClose(); });

  // Tastatura
  document.addEventListener('keydown', e => {
    const lb = document.getElementById('zsLightbox');
    if (!lb || !lb.classList.contains('lb-open')) return;
    if (e.key === 'Escape')     lbClose();
    if (e.key === 'ArrowLeft')  lbGoTo(galleryState[lbCurrentGallery] - 1);
    if (e.key === 'ArrowRight') lbGoTo(galleryState[lbCurrentGallery] + 1);
  });

  // Swipe na mobilnom
  let lbTx = 0;
  if (lb) {
    lb.addEventListener('touchstart', e => { lbTx = e.changedTouches[0].screenX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].screenX - lbTx;
      if (Math.abs(dx) > 50) lbGoTo(galleryState[lbCurrentGallery] + (dx < 0 ? 1 : -1));
    });
  }
});
