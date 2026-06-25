/**
 * js/components/banner-slider.js
 */
(function() {
'use strict';
const BannerSlider = {
  interval: null, currentIndex: 0, banners: [],

  init(containerId = 'home-banner-slider') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const track = container.querySelector('.banner-track');
    const slides = container.querySelectorAll('.banner-slide');
    const dots = container.querySelectorAll('.banner-dot');
    if (!track || slides.length === 0) return;

    this.banners = slides;
    this.currentIndex = 0;

    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => this.next(track, dots), 7000);

    // Click dots to navigate
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        this.currentIndex = i;
        this.goToSlide(track, dots);
        clearInterval(this.interval);
        this.interval = setInterval(() => this.next(track, dots), 7000);
      });
    });
  },

  next(track, dots) {
    this.currentIndex = (this.currentIndex + 1) % this.banners.length;
    this.goToSlide(track, dots);
  },

  goToSlide(track, dots) {
    if (!track) return;
    track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    if (dots) {
      dots.forEach((d, i) => d.classList.toggle('active', i === this.currentIndex));
    }
  }
};
window.BannerSlider = BannerSlider;
})();
