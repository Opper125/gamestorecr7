/**
 * js/global/auth.js - Custom Authentication
 *
 * Uses /api/auth endpoint for bcrypt password hashing and verification.
 * Session stored in sessionStorage with expiry token.
 */

const Auth = {
  sessionKey: 'user_session',
  userKey: 'current_user',

  init() {
    const session = sessionStorage.getItem(this.sessionKey);
    const user = sessionStorage.getItem(this.userKey);
    if (session && user) {
      try {
        this.session = JSON.parse(session);
        this.currentUser = JSON.parse(user);
        if (this.session.expiresAt && Date.now() > this.session.expiresAt) {
          this.logout();
          return false;
        }
        this.updateUI();
        return true;
      } catch {
        this.logout();
        return false;
      }
    }
    return false;
  },

  isLoggedIn() { return !!this.session && !!this.currentUser; },
  getUser() { return this.currentUser; },
  getUserId() { return this.currentUser?.id || null; },

  async signup(username, gmail, password, pin) {
    if (!username || username.length < 6) return { success: false, error: 'Username must be at least 6 characters' };
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return { success: false, error: 'Username must be English letters and numbers only' };
    if (!gmail || gmail.split('@')[0].length < 7) return { success: false, error: 'Gmail prefix must be at least 7 characters' };
    if (!Utils.isValidPassword(password)) return { success: false, error: 'Password must be 8-16 chars, 1 uppercase, 3 digits, 1 special' };
    if (!/^[0-9]{6}$/.test(pin)) return { success: false, error: 'PIN must be exactly 6 digits' };
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', username, gmail, password, pin }),
      });
      const result = await res.json();
      if (result.success) {
        this.createSession(result.user);
        return { success: true, message: result.message, user: result.user };
      }
      return { success: false, error: result.error || 'Signup failed' };
    } catch (err) {
      return { success: false, error: 'Signup failed. Please try again.' };
    }
  },

  async login(username, password) {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password }),
      });
      const result = await res.json();
      if (result.success) {
        this.createSession(result.user);
        return { success: true, message: result.message, user: result.user };
      }
      return { success: false, error: result.error || 'Invalid username or password' };
    } catch (err) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  },

  createSession(user) {
    const session = { userId: user.id, createdAt: Date.now(), expiresAt: Date.now() + 86400000 };
    this.session = session;
    this.currentUser = user;
    sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
    sessionStorage.setItem(this.userKey, JSON.stringify(user));
    this.updateUI();
  },

  logout() {
    this.session = null;
    this.currentUser = null;
    sessionStorage.removeItem(this.sessionKey);
    sessionStorage.removeItem(this.userKey);
    this.updateUI();
    this.navigateToHome();
  },

  navigateToHome() {
    const homePage = document.getElementById('page-home');
    const navItems = document.querySelectorAll('.nav-item');
    if (homePage) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      homePage.classList.add('active');
      navItems.forEach(n => n.classList.remove('active'));
      const homeNav = document.querySelector('.nav-item[data-page="home"]');
      if (homeNav) homeNav.classList.add('active');
    }
  },

  updateUI() {
    const authButtons = document.getElementById('auth-buttons');
    const actionIcons = document.getElementById('action-icons');
    if (!authButtons || !actionIcons) return;
    if (this.isLoggedIn()) {
      authButtons.style.display = 'none';
      actionIcons.style.display = 'flex';
    } else {
      authButtons.style.display = 'flex';
      actionIcons.style.display = 'none';
    }
    const profileContent = document.getElementById('profile-content');
    if (profileContent && this.isLoggedIn()) this.renderProfile();
  },

  renderProfile() {
    const container = document.getElementById('profile-content');
    if (!container || !this.currentUser) return;
    const user = this.currentUser;
    const isReseller = user.role === 'reseller';
    container.innerHTML = `<div class="profile-header">
        <img src="${user.profile_icon_url || '/assets/icons/default-avatar.svg'}" alt="" class="profile-avatar" />
        <div class="profile-info">
          <div class="profile-username">${Utils.escapeHtml(user.username)}${isReseller ? '<span class="reseller-badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Reseller Verified</span>' : ''}</div>
          <div class="profile-gmail">${Utils.escapeHtml(user.gmail)}</div>
        </div>
      </div>
      <div class="profile-balance">${Utils.formatCurrency(user.game_balance)}</div>
      <div class="profile-detail">
        <span class="profile-detail-label">Password</span>
        <span class="profile-detail-value">
          <span id="profile-pwd-display">********</span>
          <button id="profile-pwd-toggle" class="password-toggle" aria-label="Toggle password visibility">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </span>
      </div>
      <div class="profile-actions">
        <button class="profile-action-btn" onclick="Auth.showChangePassword()" aria-label="Change password"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Change Password</button>
        ${isReseller ? '<button class="profile-action-btn" onclick="Auth.goToResellerDashboard()" aria-label="Go to Reseller Dashboard"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Go to Reseller Dashboard</button>' : ''}
        <button class="profile-action-btn" onclick="Auth.logout()" aria-label="Logout"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Logout</button>
      </div>
      <div class="review-section"><h3 class="review-section-title">Rate This Website</h3><div id="website-review-area"></div></div>`;
  },

  goToResellerDashboard() {
    const resellerDomain = CONFIG?.resellerDomain;
    if (resellerDomain) window.location.href = 'https://' + resellerDomain;
    else window.open('/reseller.html', '_blank');
  },

  showChangePassword() {},
  showResellerKyc() {},
};

document.addEventListener('DOMContentLoaded', () => Auth.init());
window.Auth = Auth;
