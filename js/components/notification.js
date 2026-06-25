/**
 * js/components/notification.js - Notification System
 */
(function() {
'use strict';
const NotificationManager = {
  async init() {
    document.getElementById('btn-notifications')?.addEventListener('click', () => this.openPanel());
    document.getElementById('notif-close')?.addEventListener('click', () => this.closePanel());
    await this.loadNotifications();
  },

  async loadNotifications() {
    const user = Auth.getUser();
    if (!user) return;
    try {
      const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'query',table:'notifications',columns:'*',filters:[{method:'eq',column:'user_id',value:user.id}],order:{column:'created_at',ascending:false}}) });
      const {data} = await res.json();
      if (!data) return;
      const unread = data.filter(n => !n.is_read);
      const badge = document.getElementById('notif-badge');
      if (badge) {
        badge.textContent = unread.length;
        badge.style.display = unread.length > 0 ? 'flex' : 'none';
      }
      this.notifications = data;
    } catch(e) {}
  },

  async openPanel() {
    const panel = document.getElementById('notification-panel');
    const list = document.getElementById('notif-list');
    if (!panel || !list) return;
    panel.style.display = 'block';
    const notifs = this.notifications || [];

    list.innerHTML = notifs.length === 0
      ? '<div style="padding:1rem;text-align:center;color:var(--text-muted);font-size:0.8rem;">No notifications</div>'
      : notifs.map(n => `
        <div class="notif-card ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
          <div class="notif-title">${Utils.escapeHtml(n.title)}</div>
          <div class="notif-body">${Utils.escapeHtml(n.body)}</div>
          <div class="notif-time">${Utils.formatDate(n.created_at)}</div>
          ${n.gift_type === 'balance' && !n.is_claimed ? `<button class="notif-claim-btn" data-id="${n.id}" data-amount="${n.gift_amount||0}">Claim ${Utils.formatCurrency(n.gift_amount)}</button>` : ''}
          ${n.gift_type === 'promo' && n.promo_code_id ? `<div style="margin-top:0.35rem;font-size:0.7rem;color:var(--accent-blue);font-weight:600;">Promo code available</div>` : ''}
        </div>`).join('');

    list.querySelectorAll('.notif-claim-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const amount = parseFloat(btn.dataset.amount) || 0;
        // Claim via API
        btn.disabled = true;
        btn.textContent = 'Claimed!';
        // Mark as claimed
        await fetch('/api/balance', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'credit', user_id: Auth.getUserId(), amount, note: 'Gift claimed from notification'}) });
      });
    });
  },

  closePanel() {
    const panel = document.getElementById('notification-panel');
    if (panel) panel.style.display = 'none';
  }
};
document.addEventListener('DOMContentLoaded', () => setTimeout(() => NotificationManager.init(), 2000));
window.NotificationManager = NotificationManager;
})();
