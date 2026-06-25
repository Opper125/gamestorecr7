/**
 * js/pages/users/orders.js - Orders Page Controller
 */

(function () {
  'use strict';

  const OrdersPage = {
    activeTab: 'pending',
    orders: [],

    async load() {
      this.renderTabs();
      await this.loadOrders();
    },

    renderTabs() {
      const tabs = document.querySelectorAll('#page-orders .orders-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.activeTab = tab.dataset.tab;
          await this.renderOrders();
        });
      });
    },

    async loadOrders() {
      const userId = Auth.getUserId();
      if (!userId) {
        document.getElementById('orders-content').innerHTML = '<div class="orders-empty">Please log in to view your orders</div>';
        return;
      }

      try {
        const res = await fetch('/api/supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'query',
            table: 'orders',
            columns: '*',
            filters: [{ method: 'eq', column: 'user_id', value: userId }],
            order: { column: 'created_at', ascending: false },
          }),
        });
        const result = await res.json();
        this.orders = result.data || [];
        await this.renderOrders();
      } catch (err) {
        document.getElementById('orders-content').innerHTML = '<div class="orders-empty">Failed to load orders</div>';
      }
    },

    renderOrders() {
      const container = document.getElementById('orders-content');
      if (!container) return;

      const filtered = this.orders.filter(o => {
        if (this.activeTab === 'all') return true;
        return o.status === this.activeTab;
      });

      if (filtered.length === 0) {
        container.innerHTML = `<div class="orders-empty">No ${this.activeTab} orders</div>`;
        return;
      }

      container.innerHTML = `<div class="orders-list">${filtered.map(order => {
        const snapshot = order.product_snapshot || {};
        return `
          <div class="order-card" data-id="${order.id}">
            <img src="${snapshot.icon_url || '/assets/icons/default-product.svg'}" alt="" class="order-card-icon" loading="lazy" />
            <div class="order-card-info">
              <div class="order-card-name">${Utils.escapeHtml(snapshot.name || 'Product')}</div>
              <div class="order-card-quantity">Qty: ${order.quantity || 1}</div>
              <div class="order-card-date">${Utils.formatDate(order.created_at)}</div>
            </div>
            <div style="text-align:right;">
              <div class="order-card-total">${Utils.formatCurrency(order.total_price)}</div>
              <div class="order-card-status">
                <span class="status-badge ${order.status}">${order.status}</span>
              </div>
              ${order.status === 'approved' ? '<button class="order-slip-btn generate-slip">Generate Slip</button>' : ''}
            </div>
          </div>
          ${order.status === 'rejected' && order.rejection_message ? `
            <div class="order-rejection-msg">${Utils.escapeHtml(order.rejection_message)}</div>
          ` : ''}
        `;
      }).join('')}</div>`;

      // Slip generation
      container.querySelectorAll('.generate-slip').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const card = e.target.closest('.order-card');
          if (card) {
            const order = this.orders.find(o => o.id === card.dataset.id);
            if (order && window.SlipGenerator) {
              SlipGenerator.generate(order);
            }
          }
        });
      });
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
      const page = document.getElementById('page-orders');
      if (page && page.classList.contains('active')) {
        OrdersPage.load();
        observer.disconnect();
      }
    });
    observer.observe(document.getElementById('page-orders')?.parentElement || document.body, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });
  });

  window.OrdersPage = OrdersPage;
})();
