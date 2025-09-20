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

