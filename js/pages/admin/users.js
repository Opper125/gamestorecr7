/**
 * js/pages/admin/users.js - Admin Users Page
 */
(function () {
  'use strict';
  const UsersAdmin = {
    async load() {
      const container = document.getElementById('admin-users-list');
      if (!container) return;
      try {
        const res = await fetch('/api/supabase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'query', table: 'users', columns: 'id,username,gmail,game_balance,role,is_banned,created_at', order: { column: 'created_at', ascending: false } }) });
        const { data } = await res.json();
        container.innerHTML = (data || []).map(u => `<div class="user-admin-card" data-id="${u.id}">
          <div class="user-admin-avatar" style="background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:600;color:var(--text-muted);">${(u.username||'U')[0].toUpperCase()}</div>
          <div class="user-admin-info"><div class="user-admin-name">${Utils.escapeHtml(u.username)} ${u.is_banned ? '<span class="badge badge-red">Banned</span>' : ''}</div>
          <div class="user-admin-email">${Utils.escapeHtml(u.gmail)}</div></div>
          <div class="user-admin-balance">${Utils.formatCurrency(u.game_balance)}</div>
        </div>`).join('');
        container.querySelectorAll('.user-admin-card').forEach(card => card.addEventListener('click', () => this.showDetail(card.dataset.id)));
      } catch(e) { container.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-muted);">Failed to load users</div>'; }
    },
    async showDetail(userId) { /* Would navigate to user detail view */ alert('User detail: ' + userId); }
  };
  document.addEventListener('DOMContentLoaded', () => UsersAdmin.load());
  window.AdminUsers = UsersAdmin;
})();
