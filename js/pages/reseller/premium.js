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
      list.innerHTML = data.map(function(p) {
        return '<div class="premium-plan-card"' + (p.stroke_color ? ' style="border:2px solid ' + p.stroke_color + '"' : '') + '>' +
          (p.bg_image_url ? '<img src="' + p.bg_image_url + '" alt="" class="premium-plan-bg" />' : '') +
          '<div class="premium-plan-overlay"></div>' +
          '<div class="premium-plan-content">' +
          '<div class="premium-plan-name">' + Utils.escapeHtml(p.name) + '</div>' +
          '<div class="premium-plan-price">' + Utils.formatCurrency(p.price) + '</div>' +
          '<div class="premium-plan-duration">' + p.duration_days + ' days</div>' +
          '<button class="premium-plan-btn"' + (hasActive ? ' disabled' : '') + ' data-id="' + p.id + '" data-price="' + p.price + '">' + (hasActive ? 'Active Plan' : 'Purchase') + '</button>' +
          '</div></div>';
      }).join('');
      // Add purchase button click handlers
      list.querySelectorAll('.premium-plan-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          Utils.showConfirmModal('Purchase Plan', 'Confirm purchase of ' + Utils.formatCurrency(btn.dataset.price) + '?', 'Purchase').then(function(c) {
            if (c) Utils.showToast('Plan purchased!', 'success');
          });
        });
      });
    } catch(e) { list.innerHTML = '<div class="no-plan-message">Failed to load plans</div>'; }
  }
};
document.addEventListener('DOMContentLoaded', () => ResellerPremium.load());
window.ResellerPremium = ResellerPremium;
})();
