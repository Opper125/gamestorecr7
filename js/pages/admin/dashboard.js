/**
 * js/pages/admin/dashboard.js - Admin Dashboard Controller
 */

(function () {
  'use strict';

  const AdminDashboard = {
    async load() {
      this.renderStats();
      this.renderChart();
    },

    renderStats() {
      const grid = document.getElementById('admin-dashboard-stats');
      if (!grid) return;

      grid.innerHTML = `
        <div class="stat-card"><div class="stat-value" id="stat-today">0</div><div class="stat-label">Today's Sales</div></div>
        <div class="stat-card"><div class="stat-value" id="stat-month">0</div><div class="stat-label">Monthly Sales</div></div>
        <div class="stat-card"><div class="stat-value" id="stat-year">0</div><div class="stat-label">Yearly Sales</div></div>
        <div class="stat-card"><div class="stat-value" id="stat-orders">0</div><div class="stat-label">Total Orders</div></div>
      `;

      // Fetch actual stats
      this.fetchStats();
    },

    async fetchStats() {
      try {
        const res = await fetch('/api/supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'query', table: 'orders', columns: 'total_price,status,created_at' }),
        });
        const { data } = await res.json();
        if (!data) return;

        const now = new Date();
        const today = data.filter(o => new Date(o.created_at).toDateString() === now.toDateString());
        const thisMonth = data.filter(o => {
          const d = new Date(o.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const thisYear = data.filter(o => new Date(o.created_at).getFullYear() === now.getFullYear());

        const sum = (arr) => arr.reduce((s, o) => s + (parseFloat(o.total_price) || 0), 0);

        document.getElementById('stat-today').textContent = Utils.formatCurrency(sum(today));
        document.getElementById('stat-month').textContent = Utils.formatCurrency(sum(thisMonth));
        document.getElementById('stat-year').textContent = Utils.formatCurrency(sum(thisYear));
        document.getElementById('stat-orders').textContent = data.length;
      } catch (err) {
        console.warn('Stats fetch error');
      }
    },

    renderChart() {
      const container = document.getElementById('admin-dashboard-chart');
      if (!container) return;
      container.innerHTML = '<div class="chart-title">Revenue</div><div class="chart-placeholder">Chart will render here</div>';
    },
  };

  document.addEventListener('DOMContentLoaded', () => AdminDashboard.load());
  window.AdminDashboard = AdminDashboard;
})();
