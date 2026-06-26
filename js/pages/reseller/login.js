/**
 * js/pages/reseller/login.js - Reseller Login Controller
 *
 * Verifies dashboard password against stored bcrypt hash via /api/reseller-auth.
 */
(function () {
  'use strict';

  const ResellerLogin = {
    async init() {
      const user = Auth.getUser();
      if (!user || user.role !== 'reseller') {
        window.location.href = '/404.html';
        return;
      }

      // Check if dashboard password is set
      try {
        const res = await fetch('/api/supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'query',
            table: 'reseller_accounts',
            columns: 'dashboard_password_hash',
            filters: [{ method: 'eq', column: 'user_id', value: user.id }],
          }),
        });
        const { data } = await res.json();

        if (data && data[0] && data[0].dashboard_password_hash) {
          // Dashboard password is set — show password screen
          document.getElementById('reseller-pwd-screen').style.display = 'flex';
          this.setupPasswordForm(user.id);
        } else {
          // No password set — unlock directly
          this.unlock();
        }
      } catch (e) {
        this.unlock();
      }
    },

    setupPasswordForm(userId) {
      const form = document.getElementById('reseller-pwd-form');
      const errorEl = document.getElementById('reseller-pwd-error');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = document.getElementById('reseller-dash-pwd').value;
        if (!pwd) {
          if (errorEl) {
            errorEl.textContent = 'Please enter your dashboard password';
            errorEl.style.display = 'block';
          }
          return;
        }

        try {
          const res = await fetch('/api/reseller-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, password: pwd }),
          });
          const result = await res.json();

          if (result.success) {
            this.unlock();
          } else {
            if (errorEl) {
              errorEl.textContent = result.error || 'Invalid dashboard password';
              errorEl.style.display = 'block';
            }
          }
        } catch (err) {
          if (errorEl) {
            errorEl.textContent = 'Connection error. Please try again.';
            errorEl.style.display = 'block';
          }
        }
      });
    },

    unlock() {
      document.getElementById('reseller-pwd-screen').style.display = 'none';
      document.getElementById('reseller-app').style.display = 'block';
      if (window.ResellerDashboard) ResellerDashboard.load();
    },
  };

  document.addEventListener('DOMContentLoaded', () => ResellerLogin.init());
  window.ResellerLogin = ResellerLogin;
})();
