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

  // ---- Contact form → GAS → Spreadsheet ----
  const contactForm = document.getElementById('contactForm');
  const formStatusError = document.getElementById('formStatusError');
  const formSubmitBtn = document.getElementById('formSubmitBtn');

  function isGasConfigured() {
    const url = typeof FORM_CONFIG !== 'undefined' && FORM_CONFIG.GAS_ENDPOINT_URL;
    return url && !url.includes('https://script.google.com/macros/s/AKfycbyNAV5T8yXjXK4LzTHlgBc4n48P0ktD1AOYpRIopWn2yfiniXp3Q4DT-FGmJI3L7fG77A/exec');
  }

  function setFormLoading(loading) {
    if (!formSubmitBtn) return;
    formSubmitBtn.disabled = loading;
    formSubmitBtn.classList.toggle('is-loading', loading);
    const label = formSubmitBtn.querySelector('.btn-label');
    const loadingEl = formSubmitBtn.querySelector('.btn-loading');
    if (label) label.hidden = loading;
    if (loadingEl) loadingEl.hidden = !loading;
  }

  function showFormError(message) {
    if (!formStatusError) return;
    formStatusError.textContent = message;
    formStatusError.hidden = false;
  }

  function hideFormError() {
    if (!formStatusError) return;
    formStatusError.hidden = true;
    formStatusError.textContent = '';
  }

  function showFormSuccess(name) {
    contactForm.innerHTML = `
      <div class="form-success show">
        <div class="success-icon">✅</div>
        <h3>送信完了しました</h3>
        <p>${escapeHtml(name)} 様、お問い合わせありがとうございます。<br>24時間以内にご返信いたします。</p>
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function submitToGas(payload) {
    const url = FORM_CONFIG.GAS_ENDPOINT_URL;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    let result;
    try {
      result = await response.json();
    } catch (parseErr) {
      throw new Error('サーバーからの応答を読み取れませんでした。');
    }

    if (!result.success) {
      throw new Error(result.message || '送信に失敗しました。');
    }

    return result;
  }

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideFormError();

      const clinic = contactForm.querySelector('#clinic').value.trim();
      const name = contactForm.querySelector('#name').value.trim();
      const email = contactForm.querySelector('#email').value.trim();
      const message = contactForm.querySelector('#message').value.trim();
      const website = contactForm.querySelector('#website')?.value.trim() || '';

      if (!clinic || !name || !email) {
        showFormError('医院名・お名前・メールアドレスは必須です。');
        return;
      }

      if (!isGasConfigured()) {
        showFormError(
          '送信先が未設定です。config.js の GAS_ENDPOINT_URL に Apps Script の URL を設定してください。'
        );
        return;
      }

      const payload = {
        clinic,
        name,
        email,
        message,
        website,
        source: 'AI広報サポートLP',
      };

      setFormLoading(true);

      try {
        await submitToGas(payload);
        showFormSuccess(name);
      } catch (err) {
        console.error('Form submit error:', err);
        showFormError(
          err.message || '送信に失敗しました。時間をおいて再度お試しください。'
        );
        setFormLoading(false);
      }
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
