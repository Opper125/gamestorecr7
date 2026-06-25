/**
 * js/pages/reseller/premium.js
 */
(function() {
'use strict';
const ResellerPremium = {
  async load() {
    const list = document.getElementById('reseller-plans-list');
    if (!list) return;
    try {
      const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'query',table:'premium_plans',columns:'*',order:{column:'price',ascending:true}}) });
      const {data} = await res.json();
      if (!data || data.length === 0) {
        list.innerHTML = '<div class="no-plan-message">No premium plans available yet</div>';
        return;
      }
      // Check active subscription
      const user = Auth.getUser();
      let hasActive = false;
      if (user) {
        const subRes = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
          action:'query', table:'reseller_subscriptions', columns:'*',
          filters:[{method:'eq',column:'reseller_id',value:user.id},{method:'eq',column:'is_active',value:true}]
        })});
        const {data:sub} = await subRes.json();
        hasActive = sub && sub.length > 0;
      }
      list.innerHTML = data.map(p => `
        <div class="premium-plan-card" style="${p.stroke_color ? 'border:2px solid '+p.stroke_color : ''}">
          ${p.bg_image_url ? `<img src="${p.bg_image_url}" alt="" class="premium-plan-bg" />` : ''}
          <div class="premium-plan-overlay"></div>
          <div class="premium-plan-content">
            <div class="premium-plan-name">${Utils.escapeHtml(p.name)}</div>
            <div class="premium-plan-price">${Utils.formatCurrency(p.price)}</div>
            <div class="premium-plan-duration">${p.duration_days} days</div>
            <button class="premium-plan-btn" data-id="${p.id}" ${hasActive ? 'disabled' : ''}>${hasActive ? 'Active Plan' : 'Purchase'}</button>
          </div>
        </div>`).join('');
    } catch(e) { list.innerHTML = '<div class="no-plan-message">Failed to load plans</div>'; }
  }
};
document.addEventListener('DOMContentLoaded', () => ResellerPremium.load());
window.ResellerPremium = ResellerPremium;
})();
