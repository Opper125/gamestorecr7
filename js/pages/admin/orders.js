/**
 * js/pages/admin/orders.js
 */
(function () {
  'use strict';
  const AdminOrders = { activeTab: 'all',
    async load() {
      this.renderTabs();
      try {
        const res = await fetch('/api/supabase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'query', table: 'orders', columns: '*', order: { column: 'created_at', ascending: false } }) });
        const { data } = await res.json();
        this.renderOrders(data || []);
      } catch(e) { document.getElementById('admin-orders-list').innerHTML = '<div style="padding:1rem;text-align:center;color:var(--text-muted);">Failed to load</div>'; }
    },
    renderTabs() {
      const tabs = document.querySelectorAll('#admin-page-orders .orders-tab');
      tabs.forEach(t => t.addEventListener('click', () => { tabs.forEach(x => x.classList.remove('active')); t.classList.add('active'); this.activeTab = t.dataset.tab; this.load(); }));
    },
    renderOrders(orders) {
      const filtered = this.activeTab === 'all' ? orders : orders.filter(o => o.status === this.activeTab);
      const list = document.getElementById('admin-orders-list');
      list.innerHTML = filtered.map(function(o) {
        var snap = o.product_snapshot || {};
        return '<div class="admin-order-card">' +
          '<div class="admin-order-top"><div class="admin-order-info"><div class="admin-order-user">' + Utils.escapeHtml(o.user_id ? o.user_id.slice(0,8) : 'User') + '</div>' +
          '<div class="admin-order-meta"><span>' + Utils.escapeHtml(snap.name || 'Product') + '</span><span>Qty: ' + (o.quantity||1) + '</span><span>' + Utils.formatDate(o.created_at) + '</span></div></div>' +
          '<div class="admin-order-total">' + Utils.formatCurrency(o.total_price) + '</div></div>' +
          '<span class="status-badge ' + o.status + '">' + o.status + '</span>' +
          (o.status === 'pending' ? '<div class="admin-order-actions"><button class="admin-order-btn approve" data-id="' + o.id + '">Approve</button><button class="admin-order-btn reject" data-id="' + o.id + '">Reject</button></div>' : '') +
        '</div>';
      }).join('');
      list.querySelectorAll('.approve').forEach(function(b) {
        b.addEventListener('click', function() {
          Utils.showConfirmModal('Approve Order', 'Approve order? (password required)', 'Approve').then(function(c) {
            if (c) { Utils.showToast('Order approved', 'success'); AdminOrders.load(); }
          });
        });
      });
      list.querySelectorAll('.reject').forEach(function(b) {
        b.addEventListener('click', function() {
          Utils.showConfirmModal('Reject Order', 'Reject order? (password required)', 'Reject').then(function(c) {
            if (c) { Utils.showToast('Order rejected', 'error'); AdminOrders.load(); }
          });
        });
      });
    },
  };
  document.addEventListener('DOMContentLoaded', () => AdminOrders.load());
  window.AdminOrders = AdminOrders;
})();
