document.addEventListener('DOMContentLoaded', function () {
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
    const prefersReducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    const autoDelay = 2000;
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








