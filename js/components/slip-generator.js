/**
 * js/components/slip-generator.js - Order Slip PNG Generator
 * Renders order details as downloadable PNG (<500KB).
 */
(function() {
'use strict';
const SlipGenerator = {
  async generate(order) {
    if (!order) return;
    // Create slip HTML
    const slip = document.createElement('div');
    slip.style.cssText = 'width:400px;padding:1.5rem;background:white;font-family:Inter,sans-serif;color:#1A1A1A;';
    const snap = order.product_snapshot || {};
    slip.innerHTML = `
      <div style="text-align:center;margin-bottom:1rem;">
        <div style="font-size:1.25rem;font-weight:700;">Order Slip</div>
        <div style="font-size:0.7rem;color:#9E9E9E;">${Utils.formatDateTimeFull(order.created_at)}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
        <tr><td style="padding:0.35rem 0;color:#6B6B6B;">Product</td><td style="text-align:right;font-weight:600;">${Utils.escapeHtml(snap.name||'Product')}</td></tr>
        <tr><td style="padding:0.35rem 0;color:#6B6B6B;">Quantity</td><td style="text-align:right;">${order.quantity||1}</td></tr>
        <tr><td style="padding:0.35rem 0;color:#6B6B6B;">Unit Price</td><td style="text-align:right;">${Utils.formatCurrency(order.unit_price)}</td></tr>
        <tr><td style="padding:0.35rem 0;color:#6B6B6B;">Total</td><td style="text-align:right;font-weight:700;color:#3B82F6;font-size:1rem;">${Utils.formatCurrency(order.total_price)}</td></tr>
        <tr><td style="padding:0.35rem 0;color:#6B6B6B;">Status</td><td style="text-align:right;text-transform:capitalize;">${order.status}</td></tr>
      </table>
      <div style="margin-top:1rem;padding-top:0.75rem;border-top:1px solid #E8E4DE;text-align:center;font-size:0.7rem;color:#9E9E9E;">Thank you for your purchase!</div>
    `;
    document.body.appendChild(slip);

    // Use html2canvas if available, otherwise fallback
    try {
      if (window.html2canvas) {
        const canvas = await window.html2canvas(slip, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = `order-${order.id?.slice(0,8) || 'slip'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        alert('Order slip: ' + Utils.formatCurrency(order.total_price));
      }
    } catch(e) {
      alert('Could not generate slip. Order total: ' + Utils.formatCurrency(order.total_price));
    }
    document.body.removeChild(slip);
  },
  async downloadPNG() {}
};
window.SlipGenerator = SlipGenerator;
})();
