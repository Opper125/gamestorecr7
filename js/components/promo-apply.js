/**
 * js/components/promo-apply.js - Promo Code Application
 */
(function() {
'use strict';
const PromoApply = {
  async apply(code, productId, productType, price) {
    if (!code || !Auth.isLoggedIn()) return { error: 'Please log in first' };
    try {
      const res = await fetch('/api/promo', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        action:'apply', code, user_id: Auth.getUserId(), product_id: productId, product_type: productType, price
      })});
      const result = await res.json();
      if (result.valid) {
        return {
          valid: true,
          originalPrice: result.original_price,
          discountAmount: result.discount_amount,
          finalPrice: result.final_price,
        };
      }
      return { error: result.error || 'Invalid promo code' };
    } catch(e) { return { error: 'Failed to validate code' }; }
  },

  renderDiscountDisplay(container, result) {
    if (!container || !result || !result.valid) return;
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem;background:rgba(34,197,94,0.06);border-radius:var(--radius-sm);margin-top:0.5rem;">
        <span style="font-size:0.8rem;color:var(--text-muted);text-decoration:line-through;">${Utils.formatCurrency(result.originalPrice)}</span>
        <span style="font-size:1rem;font-weight:700;color:var(--accent-green);">${Utils.formatCurrency(result.finalPrice)}</span>
        <span style="font-size:0.65rem;color:var(--accent-green);font-weight:500;background:rgba(34,197,94,0.1);padding:0.1rem 0.4rem;border-radius:99px;">-${Utils.formatCurrency(result.discountAmount)}</span>
      </div>
    `;
  }
};
window.PromoApply = PromoApply;
})();
