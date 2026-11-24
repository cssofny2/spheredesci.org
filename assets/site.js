(() => {
  const menus = () => Array.from(document.querySelectorAll('.site-menu'));

  const syncBodyLock = () => {
    const mobOpen = Boolean(document.querySelector('.mob-menu[open]'));
    document.documentElement.classList.toggle('mob-nav-open', mobOpen);
  };

  const clampPanel = (menu) => {
    if (!menu.open || menu.classList.contains('mob-menu')) return;
    const panel = menu.querySelector('.nav-mega');
    if (!panel) return;
    panel.style.transform = '';
    const rect = panel.getBoundingClientRect();
    const pad = 16;
    let shift = 0;
    if (rect.right > window.innerWidth - pad) {
      shift = (window.innerWidth - pad) - rect.right;
    } else if (rect.left < pad) {
      shift = pad - rect.left;
    }
    if (shift !== 0) {
      panel.style.transform = `translateX(${Math.round(shift)}px)`;
    }
  };

  menus().forEach((menu) => {
    menu.addEventListener('toggle', () => {
      if (menu.open) {
        menus().forEach((other) => {
          if (other !== menu && other.open) other.open = false;
        });
        requestAnimationFrame(() => clampPanel(menu));
      } else {
        const panel = menu.querySelector('.nav-mega');
        if (panel) panel.style.transform = '';
      }
      syncBodyLock();
    });
  });

  document.addEventListener('click', (event) => {
    menus().forEach((menu) => {
      if (!menu.open) return;
      if (!menu.contains(event.target) || event.target.closest('a')) {
        menu.open = false;
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    menus().forEach((menu) => {
      if (!menu.open) return;
      menu.open = false;
      const summary = menu.querySelector('summary');
      if (summary) summary.focus();
    });
  });

  window.addEventListener('resize', () => {
    menus().forEach((menu) => {
      if (menu.open) clampPanel(menu);
    });
  }, { passive: true });

  // Homepage Chapter Wayfinder scrollspy
  const initWayfinder = () => {
    const wayfinder = document.querySelector('.section-wayfinder');
    if (!wayfinder || typeof IntersectionObserver === 'undefined') return;
    const links = Array.from(wayfinder.querySelectorAll('a[href^="#"]'));
    const targets = links
      .map((link) => ({ link, el: document.querySelector(link.getAttribute('href')) }))
      .filter((item) => item.el);
    if (!targets.length) return;

    const rail = wayfinder.querySelector('.wayfinder-inner');
    const setActive = (id) => {
      links.forEach((link) => {
        const match = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('is-active', match);
        if (match) {
          link.setAttribute('aria-current', 'location');
          if (rail && rail.scrollWidth > rail.clientWidth) {
            const targetLeft = link.offsetLeft - (rail.clientWidth - link.offsetWidth) / 2;
            rail.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
          }
        } else {
          link.removeAttribute('aria-current');
        }
      });
    };

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) setActive(visible[0].target.id);
    }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });

    targets.forEach(({ el }) => observer.observe(el));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWayfinder, { once: true });
  } else {
    initWayfinder();
  }
})();
