/**
 * js/pages/reseller/products.js
 */
(function() {
'use strict';
const ResellerProducts = { activeType: 'type1',
  async load() {
    this.renderTypeTabs();
    await this.renderProducts();
  },
  renderTypeTabs() {
    const container = document.getElementById('reseller-products-content');
    if (!container) return;
    container.innerHTML = `<div class="product-type-tabs"><button class="product-type-tab active" data-type="type1">Simple</button><button class="product-type-tab" data-type="type2">Accounts</button><button class="product-type-tab" data-type="type3">Merch</button></div><div id="reseller-product-list" class="reseller-product-list"></div>`;
    container.querySelectorAll('.product-type-tab').forEach(t => t.addEventListener('click', () => {
      container.querySelectorAll('.product-type-tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active'); this.activeType = t.dataset.type; this.renderProducts();
    }));
  },
  async renderProducts() {
    const user = Auth.getUser();
    if (!user) return;
    const list = document.getElementById('reseller-product-list');
    try {
      const tableMap = { type1: 'reseller_products_type1', type2: 'reseller_products_type2', type3: 'reseller_products_type3' };
      const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        action:'query', table:tableMap[this.activeType], columns:'*',
        filters:[{method:'eq',column:'reseller_id',value:user.id}],
        order:{column:'created_at',ascending:false}
      })});
      const {data} = await res.json();
      list.innerHTML = `<button class="create-btn">+ Add ${this.activeType === 'type1' ? 'Simple' : this.activeType === 'type2' ? 'Account' : 'Merch'} Product</button>
      ${(data||[]).map(p => `<div class="reseller-product-card"><div class="reseller-product-info"><div class="reseller-product-name">${Utils.escapeHtml(p.name)}</div><div class="reseller-product-meta">${p.stock_sold||0} sold</div></div><div class="reseller-product-price">${Utils.formatCurrency(p.price)}</div></div>`).join('')}`;
    } catch(e) { list.innerHTML = '<div style="color:var(--text-muted);padding:1rem;">Failed to load</div>'; }
  }
};
document.addEventListener('DOMContentLoaded', () => ResellerProducts.load());
window.ResellerProducts = ResellerProducts;
})();
