/**
 * js/pages/admin/reseller.js
 */
(function() {
'use strict';
const AdminReseller = { activeTab: 'reseller-kyc',
  async load() {
    const tabs = document.querySelectorAll('#admin-page-reseller .admin-tab');
    tabs.forEach(t => t.addEventListener('click', () => { tabs.forEach(x => x.classList.remove('active')); t.classList.add('active'); this.activeTab = t.dataset.tab; this.render(); }));
    this.render();
  },
  async render() {
    const c = document.getElementById('admin-reseller-content');
    if (this.activeTab === 'reseller-kyc') {
      try {
        const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'query',table:'reseller_accounts',columns:'*',order:{column:'created_at',ascending:false}}) });
        const {data} = await res.json();
        c.innerHTML = (data||[]).map(r => `<div class="kyc-admin-card">
          <div class="kyc-admin-header"><span class="kyc-admin-user">${Utils.escapeHtml(r.full_name)}</span><span class="kyc-admin-status ${r.kyc_status}">${r.kyc_status}</span></div>
          <div class="kyc-admin-details"><div class="kyc-admin-field"><span class="kyc-admin-field-label">NRC</span><span class="kyc-admin-field-value">${Utils.escapeHtml(r.nrc_number)}</span></div>
          <div class="kyc-admin-field"><span class="kyc-admin-field-label">User</span><span class="kyc-admin-field-value">${r.user_id?.slice(0,8)}</span></div></div>
          ${r.kyc_status === 'pending' ? `<div class="kyc-admin-actions"><button class="kyc-action-btn approve" data-id="${r.id}">Approve</button><button class="kyc-action-btn reject" data-id="${r.id}">Reject</button></div>` : ''}
        </div>`).join('');
      } catch(e) { c.innerHTML = '<div style="color:var(--text-muted);padding:1rem;">Failed to load</div>'; }
    } else {
      try {
        const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'query',table:'premium_plans',columns:'*',order:{column:'created_at',ascending:false}}) });
        const {data} = await res.json();
        c.innerHTML = `<button class="create-btn">+ Create Plan</button>` + (data||[]).map(p => `<div class="premium-plan-admin-card"><div class="premium-plan-admin-name">${Utils.escapeHtml(p.name)}</div><div class="premium-plan-admin-price">${Utils.formatCurrency(p.price)}</div><div class="premium-plan-admin-actions"><button class="admin-list-edit-btn">Edit</button><button class="admin-list-delete-btn">Delete</button></div></div>`).join('');
      } catch(e) { c.innerHTML = '<div style="color:var(--text-muted);padding:1rem;">Failed to load</div>'; }
    }
  }
};
document.addEventListener('DOMContentLoaded', () => AdminReseller.load());
window.AdminReseller = AdminReseller;
})();
