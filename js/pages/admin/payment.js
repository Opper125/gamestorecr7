/**
 * js/pages/admin/payment.js
 */
(function() {
'use strict';
const AdminPayment = {
  async load() {
    const c = document.getElementById('admin-payment-list');
    try {
      const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'query',table:'payment_methods',columns:'*',filters:[{method:'eq',column:'owner_type',value:'admin'}],order:{column:'created_at',ascending:false}}) });
      const {data} = await res.json();
      c.innerHTML = (data||[]).map(p => `<div class="payment-admin-card">
        <img src="${p.icon_url||'/assets/icons/default-category.svg'}" alt="" class="payment-admin-icon" />
        <div class="payment-admin-info"><div class="payment-admin-name">${Utils.escapeHtml(p.pay_name)}</div><div class="payment-admin-account">${Utils.escapeHtml(p.account_name)}</div></div>
        <div class="payment-admin-actions"><button class="admin-list-edit-btn">Edit</button><button class="admin-list-delete-btn">Delete</button></div>
      </div>`).join('');
    } catch(e) { c.innerHTML = '<div style="color:var(--text-muted);padding:1rem;">Failed to load</div>'; }
  }
};
document.addEventListener('DOMContentLoaded', () => AdminPayment.load());
window.AdminPayment = AdminPayment;
})();
