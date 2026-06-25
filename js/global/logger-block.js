/**
 * js/global/logger-block.js - Activity Log & DevTools Blocker
 *
 * Suppresses all console output globally and mitigates DevTools
 * network inspection of sensitive data.
 *
 * This MUST be loaded as the first script after config.js.
 */

(function () {
  'use strict';

  // ── Suppress all console methods ──
  const noop = function () {};
  const methods = ['log', 'warn', 'error', 'info', 'debug', 'trace', 'dir', 'table'];
  methods.forEach(method => {
    if (typeof console !== 'undefined') {
      console[method] = noop;
    }
  });

  // ── Override assert to never throw ──
  if (typeof console !== 'undefined') {
    console.assert = noop;
  }

  // ── Prevent DevTools opening detection ──
  // This is a mitigation, not a guarantee. The primary protection
  // is that all secrets live server-side in /api/ functions.

  // Disable right-click context menu
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });

  // Disable common DevTools keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I / Cmd+Opt+I
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+J / Cmd+Opt+J
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'j') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+C / Cmd+Opt+C
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      return false;
    }
    // Ctrl+U (view source)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      return false;
    }
    return true;
  });

  // Periodically check for DevTools
  // This uses the fact that console.log is now a noop, so
  // calling it from inside a getter won't reveal anything useful.
  let devtoolsOpen = false;

  function checkDevTools() {
    const threshold = 100;
    const start = performance.now();
    debugger;
    const end = performance.now();
    if (end - start > threshold) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        // DevTools detected - no action taken beyond blocking
        // All console output is already suppressed
      }
    } else {
      devtoolsOpen = false;
    }
  }

  // Check every 2 seconds
  setInterval(checkDevTools, 2000);

  // ── Override toString to prevent DevTools fingerprinting ──
  const element = document.createElement('div');
  Object.defineProperty(element, 'id', {
    get: function () {
      checkDevTools();
      return '';
    },
  });
  // Use the element somewhere harmless
  document.addEventListener('DOMContentLoaded', function () {
    try {
      document.body.appendChild(element);
      document.body.removeChild(element);
    } catch (e) {
      // Silently fail
    }
  });
})();
