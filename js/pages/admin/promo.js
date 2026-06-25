/**
 * js/pages/admin/promo.js
 */
(function() {
'use strict';
const AdminPromo = {
  async load() {
    const c = document.getElementById('admin-promo-list');
    try {
      const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'query',table:'promo_codes',columns:'*',order:{column:'created_at',ascending:false}}) });
      const {data} = await res.json();
      c.innerHTML = (data||[]).map(p => `<div class="promo-admin-card">
        <div class="promo-admin-top"><span class="promo-admin-code">${Utils.escapeHtml(p.code)}</span><span class="promo-admin-type ${p.type}">${p.type}</span></div>
        <div class="promo-admin-details"><span>${p.type==='cash'?Utils.formatCurrency(p.cash_amount):p.discount_pct+'%'}</span><span>Uses: ${p.used_count||0}/${p.max_uses||'Unlimited'}</span><span>Expires: ${Utils.formatDate(p.expires_at)}</span><span>Scope: ${p.applicable_scope}</span></div>
        <button class="promo-admin-delete" data-id="${p.id}">Delete</button>
      </div>`).join('');
      document.getElementById('btn-add-promo')?.addEventListener('click', () => alert('Create promo code (password required)'));
    } catch(e) { c.innerHTML = '<div style="color:var(--text-muted);padding:1rem;">Failed to load</div>'; }
  }
};
document.addEventListener('DOMContentLoaded', () => AdminPromo.load());
window.AdminPromo = AdminPromo;
})();
