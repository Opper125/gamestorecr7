/**
 * js/pages/admin/g2bulk.js
 */
(function() {
'use strict';
const AdminG2Bulk = { activeTab: 'g2bulk-categories',
  async load() {
    const tabs = document.querySelectorAll('#admin-page-g2bulk .admin-tab');
    tabs.forEach(t => t.addEventListener('click', () => { tabs.forEach(x => x.classList.remove('active')); t.classList.add('active'); this.activeTab = t.dataset.tab; this.render(); }));
    this.render();
  },
  render() {
    const c = document.getElementById('admin-g2bulk-content');
    if (this.activeTab === 'g2bulk-categories') {
      c.innerHTML = '<p style="color:var(--text-muted);">G2Bulk category management (create/edit/delete categories for topup & giftcards)</p>';
    } else if (this.activeTab === 'g2bulk-games') {
      c.innerHTML = '<p style="color:var(--text-muted);">Game assignment - assign game codes to admin categories</p>';
    } else if (this.activeTab === 'g2bulk-prices') {
      c.innerHTML = `<div class="price-settings-grid"><div class="price-setting-card"><div class="price-setting-label">Profit %</div><input id="g2-profit" type="number" class="form-input" value="0" /></div>
      <div class="price-setting-card"><div class="price-setting-label">MMK Rate</div><input id="g2-rate" type="number" class="form-input" value="1" /></div></div>
      <button class="btn-primary btn-full mt-4">Save Price Settings</button>`;
    } else if (this.activeTab === 'g2bulk-deposits') {
      c.innerHTML = '<p style="color:var(--text-muted);">Deposit management - approve/reject pending deposits</p>';
    } else {
      c.innerHTML = '<p style="color:var(--text-muted);">Loading...</p>';
    }
  }
};
document.addEventListener('DOMContentLoaded', () => AdminG2Bulk.load());
window.AdminG2Bulk = AdminG2Bulk;
})();
