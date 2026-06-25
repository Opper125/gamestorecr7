/**
 * js/pages/admin/settings.js
 */
(function () {
  'use strict';
  async function load() {
    const container = document.getElementById('admin-settings-form');
    if (!container) return;
    container.innerHTML = `<div class="settings-section"><h3 class="settings-section-title">Site Settings</h3>
      <div class="form-group"><label>Live Text</label><input id="st-live-text" class="form-input" /></div>
      <div class="site-toggle-row"><span class="site-toggle-label">Site Status</span><button id="st-toggle" class="toggle-switch"><span class="toggle-track"><span class="toggle-thumb"></span></span></button></div>
      <button id="st-save" class="btn-primary btn-full mt-4">Save Settings</button>
    </div>`;
    // Load current settings
    try {
      const res = await fetch('/api/supabase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'query', table: 'admin_settings' }) });
      const { data } = await res.json();
      if (data) { data.forEach(s => { if (s.key === 'live_text') document.getElementById('st-live-text').value = s.value || ''; }); }
    } catch (e) {}
    document.getElementById('st-save')?.addEventListener('click', () => { alert('Settings saved (approve password required)'); });
  }
  document.addEventListener('DOMContentLoaded', load);
  window.AdminSettings = { load };
})();
