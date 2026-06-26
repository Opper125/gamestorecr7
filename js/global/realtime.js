/**
 * js/global/realtime.js - Supabase Realtime Subscription Manager
 *
 * Manages Supabase Realtime subscriptions for instant updates:
 * - Balance changes
 * - Order status changes
 * - Site on/off toggles
 * - Notifications
 * - Settings updates
 * - Product changes
 *
 * All subscriptions use the Supabase JS client with the anon key.
 */

const Realtime = {
  client: null,
  channels: [],
  subscriptions: {},
  isConnected: false,

  /**
   * Initialize Realtime with Supabase client
   */
  async init() {
    try {
      // Dynamically import Supabase JS
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

      // Get Supabase credentials from /api/config (server-side ENV)
      let supabaseUrl = CONFIG?.supabaseUrl || '';
      let supabaseAnonKey = CONFIG?.supabaseAnonKey || '';

      // Fallback: try /api/config directly if CONFIG not populated yet
      if (!supabaseUrl || !supabaseAnonKey) {
        try {
          const configRes = await fetch('/api/config');
          const configData = await configRes.json();
          supabaseUrl = configData.supabaseUrl || '';
          supabaseAnonKey = configData.supabaseAnonKey || '';
        } catch (e) { /* ignore */ }
      }

      // Fallback: try window.__ENV
      if (!supabaseUrl && window.__ENV?.SUPABASE_URL) supabaseUrl = window.__ENV.SUPABASE_URL;
      if (!supabaseAnonKey && window.__ENV?.SUPABASE_ANON_KEY) supabaseAnonKey = window.__ENV.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Realtime: Supabase not configured');
        return false;
      }

      this.client = createClient(supabaseUrl, supabaseAnonKey);
      this.isConnected = true;

      // Subscribe to essential channels
      this.subscribeToSettings();
      this.subscribeToOrders();
      this.subscribeToNotifications();

      return true;
    } catch (err) {
      console.warn('Realtime init error:', err);
      return false;
    }
  },

  /**
   * Subscribe to admin_settings changes
   */
  subscribeToSettings() {
    if (!this.client) return;

    const channel = this.client
      .channel('admin_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_settings' },
        (payload) => {
          this.handleSettingsChange(payload.new);
        }
      )
      .subscribe();

    this.channels.push(channel);
  },

  /**
   * Handle settings change
   */
  handleSettingsChange(setting) {
    if (!setting) return;

    switch (setting.key) {
      case 'site_on':
        CONFIG.siteOn = setting.value === 'true';
        this.handleSiteToggle(CONFIG.siteOn);
        break;
      case 'logo_url':
        CONFIG.logoUrl = setting.value;
        this.updateLogos(setting.value);
        break;
      case 'background_media_url':
        CONFIG.backgroundMedia = setting.value;
        document.body.style.backgroundImage = `url(${setting.value})`;
        break;
      case 'loading_ui_url':
        CONFIG.loadingUiUrl = setting.value;
        document.querySelectorAll('#loading-gif').forEach(el => { el.src = setting.value; });
        break;
      case 'live_text':
        CONFIG.liveText = setting.value;
        this.updateLiveText(setting.value);
        break;
    }
  },

  /**
   * Handle site on/off toggle
   */
  handleSiteToggle(isOn) {
    const overlay = document.getElementById('site-off-overlay');
    if (!overlay) return;

    if (isOn) {
      overlay.style.display = 'none';
    } else {
      overlay.style.display = 'flex';
      // Update overlay content
      const mediaEl = document.getElementById('site-off-media');
      const reasonEl = document.getElementById('site-off-reason');
      const contactEl = document.getElementById('site-off-contact');

      if (mediaEl && CONFIG.siteOffMedia) mediaEl.src = CONFIG.siteOffMedia;
      if (reasonEl) reasonEl.textContent = CONFIG.siteOffMessage || 'Site is currently unavailable';
      if (contactEl && CONFIG.siteOffContact) {
        const { name, value } = CONFIG.siteOffContact;
        if (value && value.startsWith('http')) {
          contactEl.innerHTML = `<a href="${value}" target="_blank">${name || value}</a>`;
        } else {
          contactEl.textContent = `Platform: @${value || name || ''}`;
        }
      }
    }
  },

  /**
   * Update all logo elements
   */
  updateLogos(url) {
    if (!url) return;
    document.querySelectorAll('[id$="-logo"], [id*="logo"]').forEach(el => {
      el.src = url;
    });
  },

  /**
   * Update live text bar
   */
  updateLiveText(text) {
    const bar = document.getElementById('home-live-text');
    if (!bar) return;
    const track = bar.querySelector('.live-text-track');
    if (track) {
      track.innerHTML = `<span class="live-text-content">${Utils.escapeHtml(text)}</span>`;
    }
  },

  /**
   * Subscribe to orders for live order bar
   */
  subscribeToOrders() {
    if (!this.client) return;

    const channel = this.client
      .channel('orders_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: 'status=eq.approved' },
        (payload) => {
          this.handleNewOrder(payload.new);
        }
      )
      .subscribe();

    this.channels.push(channel);
  },

  /**
   * Handle new approved order for live bar
   */
  handleNewOrder(order) {
    if (!order) return;
    const bar = document.getElementById('home-live-orders');
    if (!bar) return;

    const snapshot = order.product_snapshot || {};
    const item = document.createElement('span');
    item.className = 'live-order-item';
    item.innerHTML = `
      <span class="live-order-username">${Utils.escapeHtml(order.user_id?.slice(0, 8) || 'User')}</span>:
      <span class="live-order-success">Success</span>
      ${order.quantity || 1}x${Utils.escapeHtml(snapshot.name || 'Product')}!
    `;

    const track = bar.querySelector('.live-order-track');
    if (track) {
      track.appendChild(item);
    }
  },

  /**
   * Subscribe to user-specific notifications
   */
  subscribeToNotifications() {
    if (!this.client) return;

    const userId = Auth.getUserId();
    if (!userId) return;

    const channel = this.client
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          this.handleNewNotification(payload.new);
        }
      )
      .subscribe();

    this.channels.push(channel);
  },

  /**
   * Handle new notification
   */
  handleNewNotification(notification) {
    if (!notification) return;

    // Update badge
    const badge = document.getElementById('notif-badge');
    if (badge) {
      const count = parseInt(badge.textContent || '0') + 1;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }

    // If notification panel is open, add the notification
    const panel = document.getElementById('notification-panel');
    const list = document.getElementById('notif-list');
    if (panel && panel.style.display !== 'none' && list) {
      const card = document.createElement('div');
      card.className = 'notif-card unread';
      card.innerHTML = `
        <div class="notif-title">${Utils.escapeHtml(notification.title)}</div>
        <div class="notif-body">${Utils.escapeHtml(notification.body)}</div>
        <div class="notif-time">Just now</div>
        ${notification.gift_type === 'balance' ? '<button class="notif-claim-btn" data-notif-id="' + notification.id + '">Claim</button>' : ''}
      `;
      list.prepend(card);
    }
  },

  /**
   * Subscribe to user balance changes
   */
  subscribeToBalance() {
    if (!this.client) return;

    const userId = Auth.getUserId();
    if (!userId) return;

    const channel = this.client
      .channel(`balance_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && payload.new.game_balance !== undefined) {
            this.handleBalanceChange(payload.new.game_balance, payload.old?.game_balance);
          }
        }
      )
      .subscribe();

    this.channels.push(channel);
  },

  /**
   * Handle balance change
   */
  handleBalanceChange(newBalance, oldBalance) {
    // Update balance display on profile
    const balanceEl = document.querySelector('.profile-balance');
    if (balanceEl) {
      balanceEl.textContent = Utils.formatCurrency(newBalance);
    }

    // Show balance change notification
    if (oldBalance !== undefined) {
      const diff = newBalance - oldBalance;
      if (diff !== 0) {
        const sign = diff > 0 ? '+' : '';
        this.showBalanceToast(`${sign}${Utils.formatNumber(diff)} MMK`);
      }
    }
  },

  /**
   * Show balance change toast
   */
  showBalanceToast(text) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      background: #1A1A1A; color: #FAF9F7; padding: 0.5rem 1rem;
      border-radius: 6px; font-size: 0.8rem; font-weight: 600;
      z-index: 500; animation: fadeIn 0.2s ease;
    `;
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  },

  /**
   * Cleanup all subscriptions
   */
  cleanup() {
    this.channels.forEach(channel => {
      if (this.client) {
        this.client.removeChannel(channel);
      }
    });
    this.channels = [];
    this.subscriptions = {};
  },
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    Realtime.init();
    // Subscribe to balance when auth is ready
    if (Auth.isLoggedIn()) {
      Realtime.subscribeToBalance();
    }
  }, 1000);
});

window.Realtime = Realtime;
