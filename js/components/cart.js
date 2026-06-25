/**
 * js/components/cart.js - Cart System
 */
(function() {
'use strict';
const CartManager = {
  items: [],
  init() {
    this.load();
    this.updateBadge();
    document.getElementById('btn-cart')?.addEventListener('click', () => this.openCart());
    document.getElementById('cart-back')?.addEventListener('click', () => this.closeCart());
  },
  load() {
    try { this.items = JSON.parse(localStorage.getItem('cart_items') || '[]'); } catch(e) { this.items = []; }
  },
  save() {
    localStorage.setItem('cart_items', JSON.stringify(this.items));
    this.updateBadge();
  },
  add(product) {
    const existing = this.items.find(i => i.id === product.id && i.source === product.source);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      this.items.push({ ...product, quantity: 1 });
    }
    this.save();
    this.showToast('Added to cart');
  },
  remove(index) {
    this.items.splice(index, 1);
    this.save();
    this.renderCart();
  },
  updateQuantity(index, qty) {
    if (qty < 1) { this.remove(index); return; }
    this.items[index].quantity = qty;
    this.save();
    this.renderCart();
  },
  updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const count = this.items.reduce((s, i) => s + (i.quantity || 1), 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  },
  openCart() {
    if (!Auth.isLoggedIn()) { Utils.showToast('Please log in first', 'error'); return; }
    document.getElementById('cart-page').style.display = 'block';
    this.renderCart();
  },
  closeCart() {
    document.getElementById('cart-page').style.display = 'none';
  },
  renderCart() {
    this.load();
    const container = document.getElementById('cart-items');
    const summary = document.getElementById('cart-summary');
    const empty = document.getElementById('cart-empty');
    const countLabel = document.getElementById('cart-count-label');
    if (this.items.length === 0) {
      container.innerHTML = '';
      summary.style.display = 'none';
      if (empty) empty.style.display = 'block';
      if (countLabel) countLabel.textContent = '';
      return;
    }
    if (empty) empty.style.display = 'none';
    summary.style.display = 'block';
    container.innerHTML = this.items.map((item, i) => {
      return '<div class="cart-item-card">' +
        '<img src="' + (item.icon_url || '/assets/icons/default-product.svg') + '" alt="" class="cart-item-icon" />' +
        '<div class="cart-item-info"><div class="cart-item-name">' + Utils.escapeHtml(item.name) + '</div><div class="cart-item-price">' + Utils.formatCurrency(item.price) + '</div></div>' +
        '<div class="cart-item-qty"><button class="qty-btn" data-index="' + i + '" data-action="minus">-</button><span class="qty-value">' + item.quantity + '</span><button class="qty-btn" data-index="' + i + '" data-action="plus">+</button></div>' +
        '<button class="cart-item-remove" data-index="' + i + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
      '</div>';
    }).join('');
    const totalItems = this.items.reduce((s, i) => s + i.quantity, 0);
    const grandTotal = this.items.reduce((s, i) => s + (parseFloat(i.price) || 0) * i.quantity, 0);
    document.getElementById('cart-total-items').textContent = totalItems;
    document.getElementById('cart-grand-total').textContent = Utils.formatCurrency(grandTotal);
    if (countLabel) countLabel.textContent = '(' + totalItems + ' items)';
    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        const action = btn.dataset.action;
        if (action === 'minus') this.updateQuantity(idx, this.items[idx].quantity - 1);
        else this.updateQuantity(idx, (this.items[idx].quantity || 1) + 1);
      });
    });
    container.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => this.remove(parseInt(btn.dataset.index)));
    });
    document.getElementById('btn-checkout')?.addEventListener('click', () => this.openCheckout());
  },
  async openCheckout() {
    const page = document.getElementById('checkout-page');
    if (!page) return;
    const content = document.getElementById('checkout-content');
    page.style.display = 'block';
    let paymentHtml = '<p style="color:var(--text-muted);font-size:0.8rem;">Loading payment methods...</p>';
    try {
      const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'query',table:'payment_methods',columns:'*',filters:[{method:'eq',column:'owner_type',value:'admin'}]}) });
      const {data} = await res.json();
      if (data && data.length > 0) {
        paymentHtml = data.map(function(p) {
          return '<div class="payment-admin-card" style="cursor:pointer;margin-bottom:0.5rem;" data-id="' + p.id + '"><img src="' + (p.icon_url||'/assets/icons/default-category.svg') + '" alt="" class="payment-admin-icon" /><div class="payment-admin-info"><div class="payment-admin-name">' + Utils.escapeHtml(p.pay_name) + '</div></div></div>';
        }).join('');
      }
    } catch(e) {}
    const total = this.items.reduce((s, i) => s + (parseFloat(i.price)||0) * i.quantity, 0);
    content.innerHTML = '<h4 style="margin-bottom:0.75rem;">Select Payment Method</h4><div id="checkout-payments">' + paymentHtml + '</div>' +
      '<div id="checkout-location" style="margin-top:1rem;"><h4 style="margin-bottom:0.5rem;">Delivery Location</h4><div class="form-group"><input type="text" class="form-input" placeholder="Full address" id="checkout-address" /></div></div>' +
      '<div style="margin-top:1rem;padding-top:0.75rem;border-top:1px solid var(--stroke-light);">' +
      '<div style="display:flex;justify-content:space-between;font-size:0.9rem;font-weight:700;"><span>Total</span><span style="color:var(--price-color);">' + Utils.formatCurrency(total) + '</span></div>' +
      '<button id="checkout-submit" class="btn-primary btn-full mt-4">Place Order</button></div>';
    document.getElementById('checkout-submit')?.addEventListener('click', () => {
      Utils.showConfirmModal('Place Order', 'Confirm order for ' + Utils.formatCurrency(total) + '?', 'Place Order').then(function(c) {
        if (c) {
          Utils.showToast('Order placed successfully!', 'success');
          CartManager.items = [];
          CartManager.save();
          CartManager.closeCart();
          document.getElementById('checkout-page').style.display = 'none';
        }
      });
    });
    document.getElementById('checkout-back')?.addEventListener('click', () => { page.style.display = 'none'; });
  },
  showToast(msg) {
    if (window.Utils && Utils.showToast) {
      Utils.showToast(msg);
    } else {
      const t = document.createElement('div');
      t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1A1A1A;color:#FAF9F7;padding:0.5rem 1rem;border-radius:6px;font-size:0.8rem;z-index:500;';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2000);
    }
  }
};
document.addEventListener('DOMContentLoaded', () => CartManager.init());
window.CartManager = CartManager;
})();
