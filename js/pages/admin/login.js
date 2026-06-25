/**
 * js/pages/admin/login.js - Admin Login Controller
 */

(function () {
  'use strict';

  const AdminLogin = {
    async init() {
      // Check IP setup first
      await this.checkIpSetup();
      this.setupLoginForm();
    },

    async checkIpSetup() {
      try {
        const res = await fetch('/api/admin-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check_ip_setup' }),
        });
        const result = await res.json();

        if (!result.ipConfigured) {
          // Show IP setup overlay
          const overlay = document.getElementById('ip-setup-overlay');
          const display = document.getElementById('client-ip-display');
          if (overlay) overlay.style.display = 'flex';
          if (display) display.textContent = result.clientIp || 'Unable to detect IP';
          return false;
        }

        if (!result.match) {
          // IP doesn't match - show 404
          window.location.href = '/404.html';
          return false;
        }

        return true;
      } catch (err) {
        console.warn('IP check failed');
        return true; // Allow login attempt
      }
    },

    setupLoginForm() {
      const form = document.getElementById('admin-login-form');
      if (!form) return;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-login-password')?.value;
        if (!password) return;

        LoadingManager.show('Verifying...');

        try {
          const res = await fetch('/api/admin-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', password }),
          });
          const result = await res.json();
          LoadingManager.hide();

          if (result.success) {
            // Store admin session
            sessionStorage.setItem('admin_session', result.token);
            // Show admin dashboard
            document.getElementById('admin-login-screen').style.display = 'none';
            document.getElementById('admin-app').style.display = 'flex';
          } else {
            const errorEl = document.getElementById('admin-login-error');
            if (errorEl) {
              errorEl.textContent = result.error || 'Invalid password';
              errorEl.style.display = 'block';
            }
          }
        } catch (err) {
          LoadingManager.hide();
          const errorEl = document.getElementById('admin-login-error');
          if (errorEl) {
            errorEl.textContent = 'Connection error';
            errorEl.style.display = 'block';
          }
        }
      });
    },
  };

  document.addEventListener('DOMContentLoaded', () => AdminLogin.init());
  window.AdminLogin = AdminLogin;
})();
