/**
 * js/pages/admin/products.js
 */
(function() {
'use strict';
const AdminProducts = { activeTab: 'menus',
  async load() {
    this.renderTabs();
    if (this.activeTab === 'menus') await this.loadMenus();
    else alert('Tab: ' + this.activeTab);
  },
  renderTabs() {
    const tabs = document.querySelectorAll('#admin-page-products .admin-tab');
    tabs.forEach(t => t.addEventListener('click', () => { tabs.forEach(x => x.classList.remove('active')); t.classList.add('active'); this.activeTab = t.dataset.tab; this.load(); }));
  },
  async loadMenus() {
    const c = document.getElementById('admin-products-content');
    try {
      const res = await fetch('/api/supabase', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({action:'query',table:'menus',columns:'*',order:{column:'sort_order',ascending:true}}) });
      const {data} = await res.json();
      c.innerHTML = `<button class="create-btn" id="create-menu">+ Create Menu</button>
      ${(data||[]).map(m => `<div class="admin-list-item"><div class="admin-list-item-info"><div class="admin-list-item-name">${Utils.escapeHtml(m.name)}</div></div>
      <div class="admin-list-item-actions"><button class="admin-list-edit-btn">Edit</button><button class="admin-list-delete-btn">Delete</button></div></div>`).join('')}`;
      document.getElementById('create-menu')?.addEventListener('click', () => alert('Create menu (password required)'));
    } catch(e) { c.innerHTML = '<div style="color:var(--text-muted);padding:1rem;">Failed to load menus</div>'; }
  }
};
document.addEventListener('DOMContentLoaded', () => AdminProducts.load());
window.AdminProducts = AdminProducts;
})();
