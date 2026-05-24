/**
 * AI広報サポート LP — Interactions
 */

(function () {
  'use strict';

  // ---- Header scroll effect ----
  const header = document.getElementById('header');
  const fixedCta = document.getElementById('fixedCta');
  const hero = document.getElementById('hero');

  function onScroll() {
    const scrollY = window.scrollY;

    if (header) {
      header.classList.toggle('scrolled', scrollY > 40);
    }

    if (fixedCta && hero) {
      const heroBottom = hero.offsetTop + hero.offsetHeight;
      fixedCta.classList.toggle('show', scrollY > heroBottom * 0.6);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- Mobile menu ----
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuToggle.classList.toggle('active', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Scroll reveal ----
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  // ---- Counter animation (Before/After stats) ----
  const statNums = document.querySelectorAll('.stat-num[data-target]');
  let statsAnimated = false;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (statNums.length && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !statsAnimated) {
            statsAnimated = true;
            statNums.forEach(animateCounter);
            statsObserver.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsSection = document.querySelector('.ba-stats');
    if (statsSection) statsObserver.observe(statsSection);
  }

  // ---- FAQ: only one open at a time ----
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach((other) => {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  // ---- Contact form ----
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const clinic = contactForm.querySelector('#clinic').value.trim();
      const name = contactForm.querySelector('#name').value.trim();
      const email = contactForm.querySelector('#email').value.trim();

      if (!clinic || !name || !email) return;

      contactForm.innerHTML = `
        <div class="form-success show">
          <div class="success-icon">✅</div>
          <h3>送信完了しました</h3>
          <p>${name} 様、お問い合わせありがとうございます。<br>24時間以内にご返信いたします。</p>
        </div>
      `;
    });
  }

  // ---- Smooth anchor scroll offset ----
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ---- Problem cards stagger delay ----
  document.querySelectorAll('.problem-card.reveal').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.1}s`;
  });

  document.querySelectorAll('.benefit-item.reveal').forEach((item, i) => {
    item.style.transitionDelay = `${i * 0.12}s`;
  });

  document.querySelectorAll('.testimonial-card.reveal').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.15}s`;
  });

  document.querySelectorAll('.flow-step.reveal').forEach((step, i) => {
    step.style.transitionDelay = `${i * 0.1}s`;
  });
})();
