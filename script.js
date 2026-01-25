const DEFAULT_LEAD_SUBMIT_URL = '/.netlify/functions/submit-lead';
const LEAD_SUBMIT_URL = typeof window !== 'undefined' && window.LEAD_SUBMIT_URL
  ? window.LEAD_SUBMIT_URL
  : DEFAULT_LEAD_SUBMIT_URL;
const LEAD_IDENTITY_TYPE = 'slug';
const LEAD_IDENTITY_VALUE = 'jyoti-pg';
const LEAD_SOURCE = 'jyotipg_marketing';
const UTM_STORAGE_KEY = 'jyotiPg.utm';
const UTM_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];


const parseUtmFromUrl = function () {
  if (typeof window === 'undefined') {
    return null;
  }
  const params = new URLSearchParams(window.location.search || '');
  const utm = {};
  let found = false;

  UTM_KEYS.forEach(function (key) {
    const value = params.get(key);
    if (value) {
      utm[key] = value;
      found = true;
    }
  });

  return found ? utm : null;
};

const storeUtm = function (utm) {
  if (!utm || typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify({
      values: utm,
      storedAt: Date.now()
    }));
  } catch (error) {
    // Ignore storage errors.
  }
};

const getUtm = function () {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.values || !parsed.storedAt) {
      return {};
    }

    if (Date.now() - parsed.storedAt > UTM_TTL_MS) {
      window.localStorage.removeItem(UTM_STORAGE_KEY);
      return {};
    }

    return parsed.values;
  } catch (error) {
    return {};
  }
};

const normalizeIndianPhone = function (value) {
  if (!value) {
    return '';
  }

  var digits = String(value).replace(/\D/g, '');
  if (digits.length === 12 && digits.indexOf('91') === 0) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.indexOf('0') === 0) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) {
    return '';
  }
  return digits;
};

document.addEventListener('DOMContentLoaded', function () {
  const utmFromUrl = parseUtmFromUrl();
  if (utmFromUrl) {
    storeUtm(utmFromUrl);
  }

  const sendGtagEvent = function (eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  };
  const form = document.getElementById('enquiry-form');
  if (form) {
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (status) {
        status.textContent = 'Thank you! Our admissions team will contact you within one working day.';
        status.classList.add('visible');
      }
      form.reset();
    });
  }

  const yearHolder = document.querySelector('[data-year]');
  if (yearHolder) {
    yearHolder.textContent = new Date().getFullYear();
  }

  const prefersReducedMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  const navToggle = document.querySelector('.nav-toggle');
  const navDrawer = document.getElementById('nav-drawer');
  if (navToggle && navDrawer) {
    const navOverlay = navDrawer.querySelector('[data-nav-overlay]');
    const navClose = navDrawer.querySelector('.nav-close');
    const navDrawerPanel = navDrawer.querySelector('.nav-drawer-panel');
    const navDrawerLinks = Array.from(navDrawer.querySelectorAll('a'));

    const setNavState = function (open) {
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navDrawer.classList.toggle('is-open', open);
      navDrawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.classList.toggle('nav-open', open);
    };

    const closeNav = function () {
      setNavState(false);
    };

    navToggle.addEventListener('click', function () {
      const willOpen = navToggle.getAttribute('aria-expanded') !== 'true';
      setNavState(willOpen);
    });

    if (navClose) {
      navClose.addEventListener('click', closeNav);
    }

    if (navOverlay) {
      navOverlay.addEventListener('click', closeNav);
    }

    navDrawerLinks.forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900) {
        closeNav();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeNav();
      }
    });

    document.addEventListener('click', function (event) {
      if (!navDrawer.classList.contains('is-open')) {
        return;
      }

      const clickedToggle = navToggle.contains(event.target);
      const clickedInsidePanel = navDrawerPanel && navDrawerPanel.contains(event.target);

      if (!clickedToggle && !clickedInsidePanel) {
        closeNav();
      }
    }, true);
  }

  const stickyWhatsApp = document.querySelector('.sticky-cta a[href*="wa.me"]');
  if (stickyWhatsApp) {
    stickyWhatsApp.addEventListener('click', function () {
      sendGtagEvent('cta_whatsapp_click', { placement: 'sticky' });
    });
  }

  const leadModalOverlay = document.getElementById('leadModalOverlay');
  const openLeadModalBtn = document.getElementById('openLeadModalBtn');

  if (leadModalOverlay && openLeadModalBtn) {
    const modalCloseBtn = leadModalOverlay.querySelector('[data-modal-close]');
    const modalTabs = Array.from(leadModalOverlay.querySelectorAll('[data-tab]'));
    const modalPanels = Array.from(leadModalOverlay.querySelectorAll('[data-panel]'));
    const modalTabsWrapper = leadModalOverlay.querySelector('.modal-tabs');
    const modalPanelsWrapper = leadModalOverlay.querySelector('.modal-panels');
    const modalSuccess = leadModalOverlay.querySelector('#leadModalSuccess');
    const modalTitle = leadModalOverlay.querySelector('#lead-modal-title');
    const modalSubtitle = leadModalOverlay.querySelector('#lead-modal-subtitle');
    const whatsappAfterSubmit = leadModalOverlay.querySelector('#openWhatsAppAfterSubmit');
    const leadForms = Array.from(leadModalOverlay.querySelectorAll('.lead-form'));

    const tabCopy = {
      availability: {
        title: 'Check Availability',
        subtitle: 'Share a few details and we will confirm availability.'
      },
      visit: {
        title: 'Schedule Visit',
        subtitle: 'Pick a preferred date and time for a quick tour.'
      }
    };

    const setActiveTab = function (key) {
      modalTabs.forEach(function (tab) {
        const isActive = tab.dataset.tab === key;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      modalPanels.forEach(function (panel) {
        const isActive = panel.dataset.panel === key;
        panel.classList.toggle('is-active', isActive);
        panel.hidden = !isActive;
      });

      if (tabCopy[key]) {
        if (modalTitle) {
          modalTitle.textContent = tabCopy[key].title;
        }
        if (modalSubtitle) {
          modalSubtitle.textContent = tabCopy[key].subtitle;
        }
      }
    };

    const resetLeadModal = function () {
      if (modalTabsWrapper) {
        modalTabsWrapper.classList.remove('is-hidden');
      }
      if (modalPanelsWrapper) {
        modalPanelsWrapper.classList.remove('is-hidden');
      }
      if (modalSuccess) {
        modalSuccess.hidden = true;
      }
      leadForms.forEach(function (form) {
        form.reset();
        const error = form.querySelector('[data-error]');
        if (error) {
          error.textContent = '';
          error.classList.remove('is-visible');
        }
        Array.from(form.querySelectorAll('.is-invalid')).forEach(function (input) {
          input.classList.remove('is-invalid');
        });
        setSubmitState(form, false);
      });
      setActiveTab('availability');
    };

    const openLeadModal = function () {
      resetLeadModal();
      leadModalOverlay.classList.add('is-open');
      leadModalOverlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      const firstInput = leadModalOverlay.querySelector('[data-panel="availability"] input');
      if (firstInput) {
        firstInput.focus();
      }
    };

    const closeLeadModal = function () {
      leadModalOverlay.classList.remove('is-open');
      leadModalOverlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    };

    const setSubmitState = function (form, isSubmitting) {
      const submitButton = form.querySelector('[data-submit]');
      if (!submitButton) {
        return;
      }
      if (isSubmitting) {
        if (!submitButton.dataset.defaultText) {
          submitButton.dataset.defaultText = submitButton.textContent;
        }
        submitButton.textContent = 'Submitting...';
        submitButton.disabled = true;
        submitButton.classList.add('is-loading');
      } else {
        submitButton.textContent = submitButton.dataset.defaultText || submitButton.textContent;
        submitButton.disabled = false;
        submitButton.classList.remove('is-loading');
      }
    };

    const setFormError = function (form, message) {
      const error = form.querySelector('[data-error]');
      if (error) {
        error.textContent = message;
        error.classList.add('is-visible');
      }
    };

    const clearFormError = function (form) {
      const error = form.querySelector('[data-error]');
      if (error) {
        error.textContent = '';
        error.classList.remove('is-visible');
      }
    };

    const buildPayload = function (form) {
      const formData = new FormData(form);
      const raw = {};

      formData.forEach(function (value, key) {
        const trimmed = String(value || '').trim();
        if (trimmed) {
          raw[key] = trimmed;
        }
      });

      const fullName = String(formData.get('full_name') || '').trim();
      const rawPhone = formData.get('phone');
      const normalizedPhone = normalizeIndianPhone(rawPhone);
      const email = String(formData.get('email') || '').trim();
      const course = String(formData.get('course') || '').trim();
      const moveInDate = String(formData.get('move_in_date') || '').trim();
      const message = String(formData.get('message') || '').trim();

      const fullNameInput = form.querySelector('input[name="full_name"]');
      const phoneInput = form.querySelector('input[name="phone"]');

      if (!fullName) {
        if (fullNameInput) {
          fullNameInput.classList.add('is-invalid');
          fullNameInput.focus();
        }
        setFormError(form, 'Please enter your full name.');
        return null;
      }

      if (!normalizedPhone) {
        if (phoneInput) {
          phoneInput.classList.add('is-invalid');
          phoneInput.focus();
        }
        setFormError(form, 'Please enter a valid 10-digit Indian mobile number.');
        return null;
      }

      const contact = {
        full_name: fullName,
        phone: normalizedPhone
      };

      if (email) {
        contact.email = email;
      }
      if (course) {
        contact.course = course;
      }
      if (moveInDate) {
        contact.move_in_date = moveInDate;
      }
      if (message) {
        contact.message = message;
      }

      const utm = getUtm();
      const utmSource = utm.utm_source || 'direct';
      const utmMedium = utm.utm_medium || 'organic';
      const utmCampaign = utm.utm_campaign || 'organic';

      const formPayload = Object.assign({}, raw, {
        page_url: window.location.href,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign
      });

      if (utm.utm_content) {
        formPayload.utm_content = utm.utm_content;
      }
      if (utm.utm_term) {
        formPayload.utm_term = utm.utm_term;
      }

      return {
        identity_type: LEAD_IDENTITY_TYPE,
        identity_value: LEAD_IDENTITY_VALUE,
        contact: contact,
        form_payload: formPayload,
        source: LEAD_SOURCE,
        campaign: utmCampaign || 'organic'
      };
    };

    const buildWhatsAppUrl = function (payload) {
      const contact = payload && payload.contact ? payload.contact : {};
      const formPayload = payload && payload.form_payload ? payload.form_payload : {};
      const utmSource = formPayload.utm_source || 'direct';
      const utmCampaign = formPayload.utm_campaign || 'organic';
      const messageParts = [
        'Hi, I want details for Jyoti PG.',
        'Name: ' + (contact.full_name || 'NA') + '.',
        'Phone: ' + (contact.phone || 'NA') + '.'
      ];

      if (contact.course) {
        messageParts.push('Course: ' + contact.course + '.');
      }
      if (contact.move_in_date) {
        messageParts.push('Move-in: ' + contact.move_in_date + '.');
      }
      if (formPayload.enquiry_type) {
        messageParts.push('Enquiry: ' + formPayload.enquiry_type + '.');
      }
      if (formPayload.preferred_date) {
        messageParts.push('Visit date: ' + formPayload.preferred_date + '.');
      }
      if (formPayload.preferred_time) {
        messageParts.push('Visit time: ' + formPayload.preferred_time + '.');
      }
      if (contact.message) {
        messageParts.push('Message: ' + contact.message + '.');
      }

      messageParts.push('Source: website.');
      messageParts.push('UTM: ' + utmSource + '/' + utmCampaign);

      const message = messageParts.join(' ');
      return 'https://wa.me/919922333305?text=' + encodeURIComponent(message);
    };

    const showSuccessState = function (payload, formKey) {
      if (modalTabsWrapper) {
        modalTabsWrapper.classList.add('is-hidden');
      }
      if (modalPanelsWrapper) {
        modalPanelsWrapper.classList.add('is-hidden');
      }
      if (modalSuccess) {
        modalSuccess.hidden = false;
      }
      if (whatsappAfterSubmit) {
        whatsappAfterSubmit.href = buildWhatsAppUrl(payload);
      }
      sendGtagEvent('lead_form_submit_success', { form_key: formKey, vertical: 'pg' });
    };

    const submitLeadForm = function (event) {
      event.preventDefault();
      const form = event.currentTarget;
      const formKey = form.getAttribute('data-form-key') || 'pg_check_availability';
      clearFormError(form);
      const payload = buildPayload(form);
      if (!payload) {
        return;
      }

      setSubmitState(form, true);

      fetch(LEAD_SUBMIT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('http_error');
          }
          return response;
        })
        .then(function () {
          showSuccessState(payload, formKey);
        })
        .catch(function (error) {
          const reason = error && error.message === 'http_error' ? 'http_error' : 'network_error';
          setFormError(form, 'Sorry, something went wrong. Please try again or WhatsApp us.');
          sendGtagEvent('lead_form_submit_fail', { form_key: formKey, reason: reason });
        })
        .finally(function () {
          setSubmitState(form, false);
        });
    };

    setActiveTab('availability');

    openLeadModalBtn.addEventListener('click', function () {
      sendGtagEvent('cta_check_availability_click', { placement: 'hero' });
      openLeadModal();
    });

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeLeadModal);
    }

    leadModalOverlay.addEventListener('click', function (event) {
      if (event.target === leadModalOverlay) {
        closeLeadModal();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && leadModalOverlay.classList.contains('is-open')) {
        closeLeadModal();
      }
    });

    modalTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const key = tab.dataset.tab;
        if (key) {
          setActiveTab(key);
        }
      });
    });

    leadForms.forEach(function (form) {
      form.addEventListener('submit', submitLeadForm);
      ['full_name', 'phone'].forEach(function (fieldName) {
        const input = form.querySelector('input[name="' + fieldName + '"]');
        if (!input) {
          return;
        }
        input.addEventListener('input', function () {
          input.classList.remove('is-invalid');
          clearFormError(form);
        });
      });
    });
  }

  const counterElements = {
    visits: document.getElementById('total-visit-count'),
    calls: document.getElementById('call-count'),
    whatsapp: document.getElementById('whatsapp-count')
  };

  if (Object.values(counterElements).some(Boolean)) {
    // Browser-side counters; swap for a backend service to share totals across visitors.
    var storageKeys = {
      visits: 'jyotiPg.visitCount',
      calls: 'jyotiPg.callCount',
      whatsapp: 'jyotiPg.whatsappCount'
    };

    var storageEnabled = true;
    try {
      var probeKey = 'jyotiPg.probe';
      window.localStorage.setItem(probeKey, '1');
      window.localStorage.removeItem(probeKey);
    } catch (error) {
      storageEnabled = false;
    }

    var counts = {
      visits: storageEnabled ? parseInt(window.localStorage.getItem(storageKeys.visits), 10) || 0 : 0,
      calls: storageEnabled ? parseInt(window.localStorage.getItem(storageKeys.calls), 10) || 0 : 0,
      whatsapp: storageEnabled ? parseInt(window.localStorage.getItem(storageKeys.whatsapp), 10) || 0 : 0
    };

    var formatCount = function (value) {
      return new Intl.NumberFormat('en-IN').format(Math.max(value, 0));
    };

    var persist = function (key) {
      if (storageEnabled) {
        window.localStorage.setItem(storageKeys[key], String(counts[key]));
      }
    };

    var updateDisplay = function (key) {
      var holder = counterElements[key];
      if (holder) {
        holder.textContent = formatCount(counts[key]);
      }
    };

    if (counterElements.visits) {
      counts.visits += 1;
      persist('visits');
      updateDisplay('visits');
    }

    ['calls', 'whatsapp'].forEach(function (key) {
      if (counterElements[key]) {
        updateDisplay(key);
      }
    });

    var sendAnalyticsEvent = function (name, label) {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, {
          event_category: 'engagement',
          event_label: label
        });
      }
    };

    var registerCounter = function (selector, key, eventName) {
      document.querySelectorAll(selector).forEach(function (link) {
        link.addEventListener('click', function () {
          counts[key] += 1;
          persist(key);
          updateDisplay(key);
          sendAnalyticsEvent(eventName, link.getAttribute('href') || eventName);
        });
      });
    };

    registerCounter('a[href^="tel:"]', 'calls', 'call_click');
    registerCounter('a[href*="wa.me"]', 'whatsapp', 'whatsapp_click');
  }

  const sliderViewport = document.querySelector('.testimonial-viewport');
  const sliderTrack = sliderViewport ? sliderViewport.querySelector('.testimonial-track') : null;
  const testimonialCards = sliderTrack ? Array.from(sliderTrack.querySelectorAll('.testimonial-card')) : [];

  if (sliderViewport && testimonialCards.length) {
    const prevButton = document.querySelector('.testimonial-nav.prev');
    const nextButton = document.querySelector('.testimonial-nav.next');
    const dotsHolder = document.querySelector('[data-slider-dots]');
    const autoDelay = 5000;
    let dots = [];
    let activeIndex = 0;
    let ignoreObserver = false;
    let resizeTimer;
    let autoTimerId = null;

    function updateDots() {
      if (!dots.length) {
        return;
      }

      dots.forEach(function (dot, idx) {
        const isActive = idx === activeIndex;
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
        dot.tabIndex = isActive ? 0 : -1;
      });
    }

    function setActive(index, options) {
      if (!testimonialCards[index]) {
        return;
      }

      activeIndex = index;
      updateDots();

      if (options && options.skipScroll) {
        return;
      }

      ignoreObserver = true;
      const smooth = !(options && options.instant) && !prefersReducedMotion.matches;
      const cardRect = testimonialCards[index].getBoundingClientRect();
      const viewportRect = sliderViewport.getBoundingClientRect();
      const targetOffset = sliderViewport.scrollLeft + (cardRect.left - viewportRect.left);

      if (typeof sliderViewport.scrollTo === 'function') {
        sliderViewport.scrollTo({
          left: targetOffset,
          behavior: smooth ? 'smooth' : 'auto'
        });
      } else {
        sliderViewport.scrollLeft = targetOffset;
      }


      window.setTimeout(function () {
        ignoreObserver = false;
      }, smooth ? 420 : 0);
    }

    const moveBy = function (step) {
      const nextIndex = (activeIndex + step + testimonialCards.length) % testimonialCards.length;
      setActive(nextIndex);
    };

    const stopAuto = function () {
      if (autoTimerId) {
        window.clearInterval(autoTimerId);
        autoTimerId = null;
      }
    };

    const startAuto = function () {
      if (prefersReducedMotion.matches) {
        stopAuto();
        return;
      }

      stopAuto();
      autoTimerId = window.setInterval(function () {
        moveBy(1);
      }, autoDelay);
    };

    if (dotsHolder) {
      dotsHolder.setAttribute('role', 'tablist');
      dotsHolder.setAttribute('aria-label', 'Select testimonial');
      dotsHolder.innerHTML = '';

      dots = testimonialCards.map(function (_card, idx) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Show testimonial ' + (idx + 1));

        dot.addEventListener('click', function () {
          stopAuto();
          setActive(idx);
          startAuto();
          try {
            sliderViewport.focus({ preventScroll: true });
          } catch (error) {
            sliderViewport.focus();
          }
        });

        dot.addEventListener('keydown', function (event) {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            const nextIndex = (idx + direction + testimonialCards.length) % testimonialCards.length;

            if (dots[nextIndex]) {
              dots[nextIndex].focus();
            }

            stopAuto();
            setActive(nextIndex);
            startAuto();
          }
        });

        dotsHolder.appendChild(dot);
        return dot;
      });

      updateDots();
    }

    if (prevButton) {
      prevButton.addEventListener('click', function () {
        stopAuto();
        moveBy(-1);
        startAuto();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        stopAuto();
        moveBy(1);
        startAuto();
      });
    }

    sliderViewport.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        stopAuto();
        moveBy(event.key === 'ArrowRight' ? 1 : -1);
        startAuto();
      }
    });

    sliderViewport.addEventListener('focusin', stopAuto);
    sliderViewport.addEventListener('focusout', function (event) {
      if (!sliderViewport.contains(event.relatedTarget)) {
        startAuto();
      }
    });

    if ('IntersectionObserver' in window) {
      const slideObserver = new IntersectionObserver(function (entries) {
        if (ignoreObserver) {
          return;
        }

        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const index = testimonialCards.indexOf(entry.target);

            if (index !== -1 && index !== activeIndex) {
              activeIndex = index;
              updateDots();
            }
          }
        });
      }, { root: sliderViewport, threshold: 0.6 });

      testimonialCards.forEach(function (card) {
        slideObserver.observe(card);
      });
    }

    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        setActive(activeIndex, { instant: true });
      }, 150);
    });

    const handleMotionPreference = function () {
      if (prefersReducedMotion.matches) {
        stopAuto();
      } else {
        startAuto();
      }
    };

    if (typeof prefersReducedMotion.addEventListener === 'function') {
      prefersReducedMotion.addEventListener('change', handleMotionPreference);
    } else if (typeof prefersReducedMotion.addListener === 'function') {
      prefersReducedMotion.addListener(handleMotionPreference);
    }

    setActive(0, { skipScroll: true });
    startAuto();
  }
  const animatedBlocks = document.querySelectorAll('[data-animate]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    animatedBlocks.forEach(function (block) {
      observer.observe(block);
    });
  } else {
    animatedBlocks.forEach(function (block) {
      block.classList.add('animate-in');
    });
  }

  const parallaxItems = Array.from(document.querySelectorAll('[data-parallax]'));
  if (parallaxItems.length) {
    const getStrength = function (element) {
      const value = element.getAttribute('data-parallax');
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? 16 : parsed;
    };

    const resetParallax = function () {
      parallaxItems.forEach(function (item) {
        item.style.setProperty('--parallax-offset', '0px');
      });
    };

    let ticking = false;
    let listenersAttached = false;

    const updateParallax = function () {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      parallaxItems.forEach(function (item) {
        const strength = getStrength(item);
        if (!strength) {
          item.style.setProperty('--parallax-offset', '0px');
          return;
        }

        const rect = item.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const offsetRatio = (elementCenter - viewportHeight / 2) / viewportHeight;
        const translate = Math.max(Math.min(offsetRatio * strength, Math.abs(strength)), -Math.abs(strength));

        item.style.setProperty('--parallax-offset', translate.toFixed(2) + 'px');
      });

      ticking = false;
    };

    const requestTick = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateParallax);
      }
    };

    const attachListeners = function () {
      if (listenersAttached) {
        requestTick();
        return;
      }

      window.addEventListener('scroll', requestTick, { passive: true });
      window.addEventListener('resize', requestTick);
      listenersAttached = true;
      requestTick();
    };

    const detachListeners = function () {
      if (!listenersAttached) {
        resetParallax();
        return;
      }

      window.removeEventListener('scroll', requestTick);
      window.removeEventListener('resize', requestTick);
      listenersAttached = false;
      resetParallax();
    };

    if (prefersReducedMotion.matches) {
      resetParallax();
    } else {
      attachListeners();
    }

    const handleParallaxPreference = function (event) {
      if (event.matches) {
        detachListeners();
      } else {
        attachListeners();
      }
    };

    if (typeof prefersReducedMotion.addEventListener === 'function') {
      prefersReducedMotion.addEventListener('change', handleParallaxPreference);
    } else if (typeof prefersReducedMotion.addListener === 'function') {
      prefersReducedMotion.addListener(handleParallaxPreference);
    }
  }

  const mapContainer = document.getElementById('pg-map');
  if (mapContainer && typeof L !== 'undefined') {
    const coordinates = [19.8642843, 75.3328362];
    const map = L.map(mapContainer, {
      scrollWheelZoom: false,
      attributionControl: true
    }).setView(coordinates, 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker(coordinates)
      .addTo(map)
      .bindPopup('<strong>Jyoti Girls PG</strong><br>Near Osmanpura, Chhatrapati Sambhaji Nagar')
      .openPopup();

    const googleMapsUrl = 'https://www.google.com/maps?q=19.8642843,75.3328362';
    let mapWasDragging = false;

    map.on('dragstart', function () {
      mapWasDragging = true;
    });

    map.on('dragend', function () {
      window.setTimeout(function () {
        mapWasDragging = false;
      }, 80);
    });

    mapContainer.classList.add('map-can-open');
    mapContainer.addEventListener('click', function (event) {
      if (mapWasDragging || (event.target && event.target.closest('.leaflet-control'))) {
        return;
      }

      window.open(googleMapsUrl, '_blank', 'noopener');
    });
  }
});








