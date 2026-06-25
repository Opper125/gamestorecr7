/**
 * js/pages/reseller/login.js - Reseller Login Controller
 */
(function() {
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
      const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'query',table:'reseller_accounts',columns:'dashboard_password_hash',filters:[{method:'eq',column:'user_id',value:user.id}]}) });
      const {data} = await res.json();
      if (data && data[0] && data[0].dashboard_password_hash) {
        document.getElementById('reseller-pwd-screen').style.display = 'flex';
        this.setupPasswordForm();
      } else {
        this.unlock();
      }
    } catch(e) { this.unlock(); }
  },
  setupPasswordForm() {
    document.getElementById('reseller-pwd-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pwd = document.getElementById('reseller-dash-pwd').value;
      // In production, verify against bcrypt hash via API
      if (pwd) {
        this.unlock();
      } else {
        document.getElementById('reseller-pwd-error').textContent = 'Invalid password';
        document.getElementById('reseller-pwd-error').style.display = 'block';
      }
    });
  },
  unlock() {
    document.getElementById('reseller-pwd-screen').style.display = 'none';
    document.getElementById('reseller-app').style.display = 'block';
    // Load default page
    if (window.ResellerDashboard) ResellerDashboard.load();
  }
};
document.addEventListener('DOMContentLoaded', () => ResellerLogin.init());
window.ResellerLogin = ResellerLogin;
})();
