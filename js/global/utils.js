/**
 * js/global/utils.js - Shared Utility Functions
 */

const Utils = {
  /**
   * Format a number as MMK currency
   * @param {number} amount
   * @returns {string} e.g. "1,234,567 MMK"
   */
  formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0 MMK';
    return Number(amount).toLocaleString('en-US') + ' MMK';
  },

  /**
   * Format a number with commas (no currency)
   */
  formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('en-US');
  },

  /**
   * Format view/like counts (e.g. 1K, 10K, 1.1M)
   */
  formatCompactCount(num) {
    if (num === null || num === undefined) return '0';
    const n = Number(num);
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
    return String(n);
  },

  /**
   * Format a date string to a readable format
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  },

  /**
   * Format date with time including seconds
   */
  formatDateTimeFull(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  },

  /**
   * Debounce function
   */
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Generate a UUID v4
   */
  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  },

  /**
   * Truncate text with ellipsis
   */
  truncate(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text || '';
    return text.slice(0, maxLength) + '...';
  },

  /**
   * Get value from nested object using dot notation
   */
  get(obj, path, defaultValue = undefined) {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result === null || result === undefined) return defaultValue;
      result = result[key];
    }
    return result !== undefined ? result : defaultValue;
  },

  /**
   * Check if string is a valid email
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * Check if password meets requirements: min 8, max 16, 1 uppercase, 3 digits, 1 special
   */
  isValidPassword(password) {
    if (!password || password.length < 8 || password.length > 16) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/\d/.test(password) || (password.match(/\d/g) || []).length < 3) return false;
    if (!/[@$%#!?&]/.test(password)) return false;
    return true;
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Create an SVG element with attributes
   */
  createSvg(svgString) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = svgString.trim();
    return wrapper.firstElementChild;
  },

  /**
   * Pluralize a word based on count
   */
  pluralize(count, singular, plural) {
    return count === 1 ? singular : (plural || singular + 's');
  },

  /**
   * Extract domain from hostname
   */
  getDomain() {
    return window.location.hostname;
  },

  /**
   * Check if running on a specific domain
   */
  isDomain(domain) {
    return window.location.hostname === domain;
  },

  /**
   * Scroll to top of page smoothly
   */
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Parse JSON safely
   */
  safeJsonParse(str, defaultVal = null) {
    try {
      return JSON.parse(str);
    } catch {
      return defaultVal;
    }
  },
};

// Export to window for access from non-module scripts
window.Utils = Utils;
