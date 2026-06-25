/**
 * js/pages/reseller/orders.js
 */
(function() {
'use strict';
const ResellerOrders = { activeTab: 'pending',
  async load() {
    this.renderTabs();
    await this.loadOrders();
  },
  renderTabs() {
    const tabs = document.querySelectorAll('#reseller-page-orders .orders-tab');
    tabs.forEach(t => t.addEventListener('click', () => { tabs.forEach(x => x.classList.remove('active')); t.classList.add('active'); this.activeTab = t.dataset.tab; this.loadOrders(); }));
  },
  async loadOrders() {
    const user = Auth.getUser();
    if (!user) return;
    const list = document.getElementById('reseller-orders-list');
    try {
      const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        action:'query', table:'orders', columns:'*',
        filters:[{method:'eq',column:'owner_type',value:'reseller'},{method:'eq',column:'owner_id',value:user.id}],
        order:{column:'created_at',ascending:false}
      })});
      const {data} = await res.json();
      const filtered = (data||[]).filter(o => this.activeTab === 'all' ? true : o.status === this.activeTab);
      if (filtered.length === 0) {
        list.innerHTML = '<div class="reseller-orders-empty">No orders</div>';
        return;
      }
      list.innerHTML = filtered.map(function(o) {
        var snap = o.product_snapshot || {};
        return '<div class="reseller-order-card">' +
          '<div class="reseller-order-header"><span class="reseller-order-buyer">' + Utils.escapeHtml(o.user_id ? o.user_id.slice(0,8) : 'User') + '</span><span class="status-badge ' + o.status + '">' + o.status + '</span></div>' +
          '<div class="reseller-order-product">' + Utils.escapeHtml(snap.name || 'Product') + '</div>' +
          '<div class="reseller-order-meta"><span>Qty: ' + (o.quantity||1) + '</span><span>' + Utils.formatDate(o.created_at) + '</span></div>' +
          '<div class="reseller-order-total">' + Utils.formatCurrency(o.total_price) + '</div>' +
          (o.status === 'pending' ? '<div class="reseller-order-actions"><button class="reseller-order-btn approve" data-id="' + o.id + '">Approve</button><button class="reseller-order-btn reject" data-id="' + o.id + '">Reject</button></div>' : '') +
        '</div>';
      }).join('');
      list.querySelectorAll('.approve').forEach(function(b) {
        b.addEventListener('click', function() {
          Utils.showConfirmModal('Approve Order', 'Approve this order?', 'Approve').then(function(c) {
            if (c) { Utils.showToast('Order approved', 'success'); ResellerOrders.loadOrders(); }
          });
        });
      });
      list.querySelectorAll('.reject').forEach(function(b) {
        b.addEventListener('click', function() {
          Utils.showConfirmModal('Reject Order', 'Reject this order?', 'Reject').then(function(c) {
            if (c) { Utils.showToast('Order rejected', 'error'); ResellerOrders.loadOrders(); }
          });
        });
      });
    } catch(e) { list.innerHTML = '<div class="reseller-orders-empty">Failed to load</div>'; }
  }
};
document.addEventListener('DOMContentLoaded', () => ResellerOrders.load());
window.ResellerOrders = ResellerOrders;
})();
