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
  }
});


