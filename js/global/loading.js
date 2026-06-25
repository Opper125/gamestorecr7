/**
 * js/global/loading.js - Loading UI Controller
 *
 * Manages loading states using the Admin-defined GIF/Webm (40x40px).
 * No CSS spinners are used anywhere.
 */

const LoadingManager = {
  overlay: null,
  gifElement: null,
  stack: [],
  debug: false,

  /**
   * Initialize the loading manager
   */
  init() {
    this.overlay = document.getElementById('loading-overlay');
    this.gifElement = document.getElementById('loading-gif');

    if (!this.overlay) {
      console.warn('Loading overlay not found');
    }
  },

  /**
   * Show loading overlay
   * @param {string} [message] - Optional loading message
   */
  show(message) {
    this.stack.push(message || '');

    if (!this.overlay) this.init();
    if (!this.overlay) return;

    // Ensure GIF src is set
    if (this.gifElement && !this.gifElement.src && window.CONFIG?.loadingUiUrl) {
      this.gifElement.src = window.CONFIG.loadingUiUrl;
    }

    this.overlay.classList.add('active');

    // Set loading text if provided
    const textEl = this.overlay.querySelector('.loading-text');
    if (textEl) {
      textEl.textContent = message || '';
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  },

  /**
   * Hide loading overlay
   */
  hide() {
    this.stack.pop();

    // Only hide when all stacked loaders are resolved
    if (this.stack.length > 0) return;

    if (!this.overlay) return;
    this.overlay.classList.remove('active');

    // Restore body scroll
    document.body.style.overflow = '';
  },

  /**
   * Force hide all loading states
   */
  forceHide() {
    this.stack = [];
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
    document.body.style.overflow = '';
  },

  /**
   * Wrap an async function with loading state
   * @param {Function} fn - Async function to wrap
   * @param {string} [message] - Optional loading message
   * @returns {Promise<any>}
   */
  async wrap(fn, message) {
    this.show(message);
    try {
      const result = await fn();
      return result;
    } finally {
      this.hide();
    }
  },
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  LoadingManager.init();
});

window.LoadingManager = LoadingManager;
