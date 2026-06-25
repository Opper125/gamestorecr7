/**
 * js/components/live-order-bar.js
 */
(function() {
'use strict';
const LiveOrderBar = {
  async init(containerId = 'home-live-orders') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const user = Auth.getUser();
    if (!user) return;
    try {
      const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        action:'query', table:'orders', columns:'user_id,quantity,product_snapshot,created_at',
        filters:[{method:'eq',column:'status',value:'approved'}],
        order:{column:'created_at',ascending:false}, limit:20
      })});
      const {data} = await res.json();
      const items = (data||[]).map(o => {
        const snap = o.product_snapshot || {};
        return `<span class="live-order-item"><span class="live-order-username">${o.user_id?.slice(0,6)}</span>: <span class="live-order-success">Success</span> ${o.quantity||1}x${Utils.escapeHtml(snap.name||'Product')}!</span>`;
      });
      if (items.length === 0) { container.innerHTML = ''; return; }
      container.innerHTML = `<div class="live-order-track">${items.join('')}${items.join('')}</div>`;
    } catch(e) { container.innerHTML = ''; }
  }
};
document.addEventListener('DOMContentLoaded', () => setTimeout(() => LiveOrderBar.init(), 2000));
window.LiveOrderBar = LiveOrderBar;
})();
