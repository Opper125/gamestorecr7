/**
 * js/global/config.js - Application Configuration
 *
 * All environment variables are read through server-side /api endpoints.
 * No API keys, secrets, or environment variables appear in source code.
 * This module provides a centralized config object used by all other JS files.
 */

const CONFIG = {
  // Supabase (public anon key only - service role never touches browser)
  supabaseUrl: null,
  supabaseAnonKey: null,

  // Domain configuration (read at runtime)
  userDomain: null,
  adminDomain: null,
  resellerDomain: null,

  // API endpoints
  api: {
    supabase: '/api/supabase',
    imgbb: '/api/imgbb',
    g2bulkV1: '/api/g2bulk-v1',
    g2bulkV2: '/api/g2bulk-v2',
    youtube: '/api/youtube',
    auth: '/api/auth',
    adminAuth: '/api/admin-auth',
    balance: '/api/balance',
    promo: '/api/promo',
  },

  // App state
  siteOn: true,
  siteOffMessage: '',
  siteOffContact: null,
  siteOffMedia: '',
  logoUrl: '',
  backgroundMedia: '',
  loadingUiUrl: '',
  liveText: '',

  // Current user session
  session: null,
  currentUser: null,

  // Supabase realtime channel
  realtimeChannel: null,

  // Supabase client (lazy initialized)
  _supabase: null,
};

/**
 * Initialize config - fetch Supabase connection info and admin settings
 */
CONFIG.init = async function () {
  try {
    // Fetch Supabase anon key (public) from a lightweight endpoint
    // This is the only public key - the service role key is never exposed
    const settingsRes = await fetch('/api/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'query',
        table: 'admin_settings',
        columns: 'key, value',
      }),
    });

    if (settingsRes.ok) {
      const settingsData = await settingsRes.json();
      if (settingsData.data) {
        settingsData.data.forEach(setting => {
          switch (setting.key) {
            case 'logo_url':
              CONFIG.logoUrl = setting.value;
              break;
            case 'background_media_url':
              CONFIG.backgroundMedia = setting.value;
              break;
            case 'loading_ui_url':
              CONFIG.loadingUiUrl = setting.value;
              break;
            case 'live_text':
              CONFIG.liveText = setting.value;
              break;
            case 'site_on':
              CONFIG.siteOn = setting.value === 'true';
              break;
            case 'site_off_message':
              CONFIG.siteOffMessage = setting.value || '';
              break;
            case 'site_off_contact_name':
              if (!CONFIG.siteOffContact) CONFIG.siteOffContact = {};
              CONFIG.siteOffContact.name = setting.value;
              break;
            case 'site_off_contact_value':
              if (!CONFIG.siteOffContact) CONFIG.siteOffContact = {};
              CONFIG.siteOffContact.value = setting.value;
              break;
            case 'site_off_media_url':
              CONFIG.siteOffMedia = setting.value || '';
              break;
          }
        });
      }
    }

    // Apply logo and background
    CONFIG.applyInitialSettings();

    return true;
  } catch (err) {
    console.warn('Config init error:', err);
    return false;
  }
};

/**
 * Apply initial settings (logo, background, loading UI) to DOM
 */
CONFIG.applyInitialSettings = function () {
  const logoEls = document.querySelectorAll('[id$="-logo"], [id*="logo"]');
  logoEls.forEach(el => {
    if (CONFIG.logoUrl) {
      el.src = CONFIG.logoUrl;
    }
  });

  if (CONFIG.loadingUiUrl) {
    const loadingGifs = document.querySelectorAll('#loading-gif');
    loadingGifs.forEach(el => {
      el.src = CONFIG.loadingUiUrl;
    });
  }

  if (CONFIG.backgroundMedia) {
    document.body.style.backgroundImage = `url(${CONFIG.backgroundMedia})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundAttachment = 'fixed';
  }
};

/**
 * Show loading overlay
 */
CONFIG.showLoading = function () {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('active');
};

/**
 * Hide loading overlay
 */
CONFIG.hideLoading = function () {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('active');
};

/**
 * Fetch wrapper with common headers
 */
CONFIG.fetch = async function (url, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  return response.json();
};

// Attach to window for non-module script access
window.CONFIG = CONFIG;
