/**
 * js/components/live-text-bar.js
 */
(function() {
'use strict';
const LiveTextBar = {
  init(containerId = 'home-live-text') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const text = CONFIG?.liveText || 'Welcome!';
    container.innerHTML = `<div class="live-text-track"><span class="live-text-content">${Utils.escapeHtml(text)}</span><span class="live-text-content">${Utils.escapeHtml(text)}</span></div>`;
  }
};
document.addEventListener('DOMContentLoaded', () => LiveTextBar.init());
window.LiveTextBar = LiveTextBar;
})();
