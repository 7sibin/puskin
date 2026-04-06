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
  if (!e.target.classList.contains('book-button') && !e.target.closest('.book-button')) return;
  const btn = e.target.classList.contains('book-button') ? e.target : e.target.closest('.book-button');
  const aptSelect = document.querySelector('#apartment');
  if (aptSelect) {
    // On rezervacija.html — scroll to form
    const form = document.querySelector('.reservation-section');
    if (form) { form.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  }
  // On index.html — go to rezervacija.html
  window.location.href = 'rezervacija.html';
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
  document.getElementById(id)?.addEventListener('change', () => { updatePriceCalculation(); checkAvailability(); });
});

// ─── RESERVATION FORM SUBMIT ──────────────────
document.getElementById('reservationForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const btn  = document.getElementById('submitButton');
  const text = btn?.querySelector('.button-text');
  if (!btn || !text) return;

  // Basic validation
  const required = ['checkIn','checkOut','apartment','guests','firstName','lastName','email','phone'];
  let valid = true;
  required.forEach(id => {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      el?.closest('.field-group')?.classList.add('field-error');
      valid = false;
    } else {
      el?.closest('.field-group')?.classList.remove('field-error');
    }
  });
  // Check checkout > checkin
  const ci = new Date(document.getElementById('checkIn')?.value);
  const co = new Date(document.getElementById('checkOut')?.value);
  if (co <= ci) {
    document.getElementById('checkOut')?.closest('.field-group')?.classList.add('field-error');
    showToast('⚠ Datum odlaska mora biti posle datuma dolaska.');
    return;
  }
  if (!valid) {
    showToast('⚠ Molimo popunite sva obavezna polja.');
    return;
  }

  btn.disabled = true;
  btn.classList.add('loading');
  text.textContent = 'Slanje…';

  const body = {
    apartment_id:     document.getElementById('apartment').value,
    check_in:         document.getElementById('checkIn').value,
    check_out:        document.getElementById('checkOut').value,
    guests:           parseInt(document.getElementById('guests').value),
    first_name:       document.getElementById('firstName').value.trim(),
    last_name:        document.getElementById('lastName').value.trim(),
    email:            document.getElementById('email').value.trim(),
    phone:            document.getElementById('phone').value.trim(),
    special_requests: document.getElementById('specialRequests')?.value.trim() || '',
  };

  fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      showToast(`✓ Rezervacija kreirana! Ref: ${data.ref_code} — Proverite email.`);
      document.getElementById('reservationForm').reset();
      updatePriceCalculation();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const msg = data.errors ? data.errors.join('\n') : (data.error || 'Greška.');
      showToast('⚠ ' + msg);
    }
  })
  .catch(() => showToast('⚠ Greška konekcije. Pokušajte ponovo.'))
  .finally(() => {
    btn.disabled = false;
    btn.classList.remove('loading');
    text.textContent = 'Potvrdi rezervaciju';
  });
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
const galleryState = { '1': 0, '2': 0, '3': 0, 'gallery': 0 };

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

  // Resetuj sliku kartice na prvu (samo za apartman galerije)
  if (lbCurrentGallery && lbCurrentGallery !== 'gallery') {
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

// ================================================
// LUXURY GALLERY — Zlatar Stars
// ================================================

// Galerija podaci - 15 slika
const galleryImages = [
{ src: 'media/Gallery/1.jpg', title: 'Zimska idila', desc: 'Snežna planina u punom sjaju' },
{ src: 'media/Gallery/2.jpg', title: 'Jutarnji pogled', desc: 'Prvi sunčevi zraci kroz prozor' },
{ src: 'media/Gallery/3.jpg', title: 'Kamin', desc: 'Toplo ogledalo za hladne večeri' },
{ src: 'media/Gallery/4.jpg', title: 'Terenska avantura', desc: 'Istražite netaknutu prirodu' },
{ src: 'media/Gallery/5.jpg', title: 'Apartman Sunce', desc: 'Prostran porodični smeštaj' },
{ src: 'media/Gallery/6.jpg', title: 'Večernja atmosfera', desc: 'Zlatni sati na planini' },
{ src: 'media/Gallery/7.jpg', title: 'Detalji luksuza', desc: 'Rustičan šarm sa modernim dodirima' },
{ src: 'media/Gallery/8.jpg', title: 'Pogled sa terase', desc: 'Panoramski vidici na zvezde' },
{ src: 'media/Gallery/9.jpg', title: 'Planina jutro', desc: 'Svež vazduh i tišina' },
{ src: 'media/Gallery/10.jpg', title: 'Kuhinjski detalji', desc: 'Sve što vam treba za boravak' },
{ src: 'media/Gallery/11.jpg', title: 'Apartman Zvezda', desc: 'Romantično bekstvo za dva' },
{ src: 'media/Gallery/12.jpg', title: 'Spavaća soba', desc: 'Udobni krevet sa pogledom' },
{ src: 'media/Gallery/13.jpg', title: 'Planinska reka', desc: 'Krištolno čista voda' },
{ src: 'media/Gallery/14.jpg', title: 'Apartman Planina', desc: 'Premium luksuzni doživljaj' },
{ src: 'media/Gallery/15.jpg', title: 'Zalazak sunca', desc: 'Nezaboravan pogled' }
];

// Kreiraj galeriju (koristi postojeći lightbox sistem)
function createGallery() {
const galleryContainer = document.getElementById('luxuryGallery');
if (!galleryContainer) return;

// Registruj galeriju u postojeći sistem
GALLERIES['gallery'] = galleryImages.map(img => img.src);
galleryState['gallery'] = 0;

galleryImages.forEach((img, index) => {
const item = document.createElement('div');
item.className = 'gallery-item';
item.addEventListener('click', function() {
zsOpenLightbox('gallery', index);
});
item.innerHTML = '<img src="' + img.src + '" alt="' + img.title + '" loading="lazy"><div class="gallery-item-number">' + (index + 1) + '</div><div class="gallery-item-title"><h3>' + img.title + '</h3><p>' + img.desc + '</p></div>';
galleryContainer.appendChild(item);
});

// Animate on scroll
const observer = new IntersectionObserver(
entries => {
entries.forEach(entry => {
if (entry.isIntersecting) {
entry.target.classList.add('revealed');
const index = Array.from(galleryContainer.children).indexOf(entry.target);
entry.target.style.transitionDelay = (index * 80) + 'ms';
}
});
},
{ threshold: 0.2 }
);

document.querySelectorAll('.gallery-item').forEach(item => observer.observe(item));
}

// Pokreni kada se stranica učita
document.addEventListener('DOMContentLoaded', () => {
createGallery();
});

// ═════════════════════════════════════════ FAQ SEKCIJA ═════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const faqItems = document.querySelectorAll('.faq-item');
  
  // Scroll reveal za FAQ iteme
  const faqObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.dataset.revealDelay || 0);
      setTimeout(() => el.classList.add('revealed'), delay);
      faqObserver.unobserve(el);
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -80px 0px'
  });
  
  faqItems.forEach(item => faqObserver.observe(item));
  
  // Akordeon funkcionalnost
  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      const faqItem = button.parentElement;
      const answer = faqItem.querySelector('.faq-answer');
      const isOpen = faqItem.classList.contains('open');
      const allItems = document.querySelectorAll('.faq-item');
      
      // Zatvori sve ostale
      allItems.forEach(item => {
        if (item !== faqItem) {
          item.classList.remove('open');
          const otherAnswer = item.querySelector('.faq-answer');
          otherAnswer.style.height = '0px';
        }
      });
      
      // Toggle trenutni
      if (isOpen) {
        faqItem.classList.remove('open');
        answer.style.height = '0px';
      } else {
        faqItem.classList.add('open');
        answer.style.height = answer.scrollHeight + 'px';
      }
    });
  });
  
  // Obezb obradu Resize event (da se prilagodi visina na resize)
  window.addEventListener('resize', () => {
    document.querySelectorAll('.faq-item.open').forEach(item => {
      const answer = item.querySelector('.faq-answer');
      if (answer) answer.style.height = answer.scrollHeight + 'px';
    });
  });
});

// ─── AVAILABILITY CHECK ───────────────────────
let availTimer = null;
function checkAvailability() {
  const aptId    = document.getElementById('apartment')?.value;
  const checkIn  = document.getElementById('checkIn')?.value;
  const checkOut = document.getElementById('checkOut')?.value;
  const panel    = document.getElementById('availabilityMsg');
  if (!panel || !aptId || !checkIn || !checkOut) { if (panel) panel.textContent = ''; return; }
  if (new Date(checkOut) <= new Date(checkIn)) return;
  clearTimeout(availTimer);
  panel.textContent = '⏳ Provera dostupnosti...';
  panel.style.color = '#999';
  availTimer = setTimeout(async () => {
    try {
      const r = await fetch(`/api/reservations/availability?apartment_id=${aptId}&check_in=${checkIn}&check_out=${checkOut}`);
      const d = await r.json();
      if (d.available) {
        panel.textContent = '✓ Apartman je dostupan!';
        panel.style.color = '#2e7d32';
      } else {
        panel.textContent = '✗ Apartman nije dostupan za izabrane datume.';
        panel.style.color = '#c62828';
      }
    } catch { panel.textContent = ''; }
  }, 600);
}
