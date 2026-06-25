/**
 * js/pages/users/auth.js - Auth Page Modals & Form Handlers
 */

(function () {
  'use strict';

  // ── DOM References ──
  let signupModal, loginModal;
  let signupForm, loginForm;
  let signupBtn, loginBtn;
  let switchToLogin, switchToSignup;

  function init() {
    signupModal = document.getElementById('signup-modal');
    loginModal = document.getElementById('login-modal');
    signupForm = document.getElementById('signup-form');
    loginForm = document.getElementById('login-form');
    signupBtn = document.getElementById('btn-signup');
    loginBtn = document.getElementById('btn-login');
    switchToLogin = document.getElementById('switch-to-login');
    switchToSignup = document.getElementById('switch-to-signup');

    if (signupBtn) signupBtn.addEventListener('click', () => openModal('signup'));
    if (loginBtn) loginBtn.addEventListener('click', () => openModal('login'));
    if (switchToLogin) switchToLogin.addEventListener('click', () => openModal('login'));
    if (switchToSignup) switchToSignup.addEventListener('click', () => openModal('signup'));

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) closeAllModals();
      });
    });

    // Close on X button
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', closeAllModals);
    });

    // Signup form
    if (signupForm) {
      signupForm.addEventListener('submit', handleSignup);
      // Real-time validation
      setupValidation(signupForm);
    }

    // Login form
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
  }

  function openModal(type) {
    closeAllModals();
    if (type === 'signup' && signupModal) {
      signupModal.style.display = 'flex';
      signupModal.parentElement.style.display = 'block';
    } else if (type === 'login' && loginModal) {
      loginModal.style.display = 'flex';
      loginModal.parentElement.style.display = 'block';
    }
  }

  function closeAllModals() {
    const modals = document.getElementById('auth-modals');
    if (modals) modals.style.display = 'none';
    if (signupModal) signupModal.style.display = 'none';
    if (loginModal) loginModal.style.display = 'none';
  }

  // ── Real-time validation ──
  function setupValidation(form) {
    const username = form.querySelector('#signup-username');
    const gmail = form.querySelector('#signup-gmail');
    const password = form.querySelector('#signup-password');
    const pin = form.querySelector('#signup-pin');

    if (username) {
      username.addEventListener('input', () => {
        const val = username.value;
        if (val.length >= 6 && /^[a-zA-Z0-9_]+$/.test(val)) {
          username.className = 'form-input valid';
          document.getElementById('signup-username-error').textContent = '';
        } else if (val.length > 0) {
          username.className = 'form-input invalid';
        } else {
          username.className = 'form-input';
        }
      });
    }

    if (gmail) {
      gmail.addEventListener('input', () => {
        const val = gmail.value;
        const prefix = val.split('@')[0] || '';
        if (prefix.length >= 7 && val.includes('@')) {
          gmail.className = 'form-input valid';
          document.getElementById('signup-gmail-error').textContent = '';
        } else if (val.length > 0) {
          gmail.className = 'form-input invalid';
        } else {
          gmail.className = 'form-input';
        }
      });
    }

    if (password) {
      password.addEventListener('input', () => {
        const val = password.value;
        if (Utils.isValidPassword(val)) {
          password.className = 'form-input valid';
          document.getElementById('signup-password-error').textContent = '';
        } else if (val.length > 0) {
          password.className = 'form-input invalid';
        } else {
          password.className = 'form-input';
        }
      });
    }

    if (pin) {
      pin.addEventListener('input', () => {
        const val = pin.value;
        if (/^[0-9]{6}$/.test(val)) {
          pin.className = 'form-input valid';
          document.getElementById('signup-pin-error').textContent = '';
        } else if (val.length > 0) {
          pin.className = 'form-input invalid';
        } else {
          pin.className = 'form-input';
        }
      });
    }
  }

  // ── Handle Signup ──
  async function handleSignup(e) {
    e.preventDefault();

    const username = document.getElementById('signup-username')?.value;
    const gmail = document.getElementById('signup-gmail')?.value;
    const password = document.getElementById('signup-password')?.value;
    const pin = document.getElementById('signup-pin')?.value;

    LoadingManager.show('Creating account...');
    const result = await Auth.signup(username, gmail, password, pin);
    LoadingManager.hide();

    if (result.success) {
      closeAllModals();
      showToast(result.message, 'success');
      if (signupForm) signupForm.reset();
    } else {
      showToast(result.error, 'error');
    }
  }

  // ── Handle Login ──
  async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('login-username')?.value;
    const password = document.getElementById('login-password')?.value;

    LoadingManager.show('Logging in...');
    const result = await Auth.login(username, password);
    LoadingManager.hide();

    if (result.success) {
      closeAllModals();
      showToast(result.message, 'success');
      if (loginForm) loginForm.reset();
      // Subscribe to realtime balance
      if (window.Realtime) {
        Realtime.subscribeToBalance();
      }
    } else {
      showToast(result.error, 'error');
    }
  }

  // ── Toast Notification ──
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: ${type === 'success' ? '#22C55E' : type === 'error' ? '#EF4444' : '#1A1A1A'};
      color: white; padding: 0.75rem 1.25rem; border-radius: 8px;
      font-size: 0.85rem; font-weight: 500; z-index: 1000;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      animation: fadeIn 0.2s ease; max-width: 90vw; text-align: center;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ── Initialize ──
  document.addEventListener('DOMContentLoaded', init);
})();
