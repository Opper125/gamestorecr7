/**
 * js/pages/reseller/dashboard.js
 */
(function() {
'use strict';
const ResellerDashboard = {
  async load() {
    this.renderStats();
    this.renderTrialBanner();
  },
  renderStats() {
    const c = document.getElementById('reseller-dashboard-stats');
    if (!c) return;
    c.innerHTML = `
      <div class="reseller-stat-card"><div class="reseller-stat-value" id="rstat-sales">0 MMK</div><div class="reseller-stat-label">Today's Sales</div></div>
      <div class="reseller-stat-card"><div class="reseller-stat-value" id="rstat-month">0 MMK</div><div class="reseller-stat-label">Monthly Sales</div></div>
      <div class="reseller-stat-card"><div class="reseller-stat-value" id="rstat-orders">0</div><div class="reseller-stat-label">Total Orders</div></div>
      <div class="reseller-stat-card"><div class="reseller-stat-value" id="rstat-products">0</div><div class="reseller-stat-label">Products</div></div>
    `;
    this.fetchStats();
  },
  async fetchStats() {
    try {
      const user = Auth.getUser();
      if (!user) return;
      const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        action:'query', table:'orders', columns:'total_price,status,created_at',
        filters:[{method:'eq',column:'owner_type',value:'reseller'},{method:'eq',column:'owner_id',value:user.id}]
      })});
      const {data} = await res.json();
      if (!data) return;
      const total = data.reduce((s,o) => s + (parseFloat(o.total_price)||0), 0);
      const approved = data.filter(o => o.status === 'approved');
      const monthTotal = approved.filter(o => new Date(o.created_at).getMonth() === new Date().getMonth()).reduce((s,o) => s + (parseFloat(o.total_price)||0), 0);
      document.getElementById('rstat-sales').textContent = Utils.formatCurrency(total);
      document.getElementById('rstat-month').textContent = Utils.formatCurrency(monthTotal);
      document.getElementById('rstat-orders').textContent = approved.length;
    } catch(e) {}
  },
  renderTrialBanner() {
    const c = document.getElementById('reseller-dashboard-stats');
    if (!c) return;
    // Check if trial period - would check subscription in production
  }
};
document.addEventListener('DOMContentLoaded', () => ResellerDashboard.load());
window.ResellerDashboard = ResellerDashboard;
})();
