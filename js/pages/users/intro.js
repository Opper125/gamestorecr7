/**
 * js/pages/users/intro.js - Intro Screen Controller
 *
 * Shows the logo for 6 seconds, then transitions to the dashboard.
 * Logo aspect ratio: 16:9. Subtle fade + scale animation.
 */

(function () {
  'use strict';

  const INTRO_DURATION = 6000; // 6 seconds
  const TRANSITION_DURATION = 500; // 0.5 seconds

  let introEl;
  let appEl;
  let announcementEl;

  /**
   * Initialize the intro screen
   */
  async function initIntro() {
    introEl = document.getElementById('intro-screen');
    appEl = document.getElementById('app');
    announcementEl = document.getElementById('announcement-overlay');

    if (!introEl) return;

    // Set logo from config
    const logoEl = document.getElementById('intro-logo');
    if (logoEl && CONFIG?.logoUrl) {
      logoEl.src = CONFIG.logoUrl;
    }

    // Wait for 6 seconds
    await wait(INTRO_DURATION);

    // Hide intro, show app
    if (introEl) {
      introEl.style.opacity = '0';
      introEl.style.transition = `opacity ${TRANSITION_DURATION}ms ease`;
    }

    await wait(TRANSITION_DURATION);

    if (introEl) introEl.style.display = 'none';
    if (appEl) appEl.style.display = 'block';

    // Show announcement overlay (first visit)
    showAnnouncement();
  }

  /**
   * Show announcement image overlay
   */
  function showAnnouncement() {
    if (!announcementEl) return;

    // Check if user has seen announcement in this session
    const seen = sessionStorage.getItem('announcement_seen');
    if (seen) return;

    const img = document.getElementById('announcement-img');
    if (img && CONFIG?.logoUrl) {
      // In production, announcement image would be a separate setting
      img.src = CONFIG.logoUrl;
    }

    announcementEl.style.display = 'flex';
  }

  /**
   * Close announcement overlay
   */
  function closeAnnouncement() {
    if (!announcementEl) return;
    announcementEl.style.display = 'none';
    sessionStorage.setItem('announcement_seen', 'true');
  }

  /**
   * Promise-based wait
   */
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ── Event Listeners ──
  document.addEventListener('DOMContentLoaded', () => {
    // Start intro after config is loaded
    setTimeout(initIntro, 300);
  });

  // Announcement close
  document.addEventListener('click', (e) => {
    if (e.target.closest('#announcement-close')) {
      closeAnnouncement();
    }
  });

  // Expose for debugging
  window.Intro = { initIntro, closeAnnouncement };
})();
