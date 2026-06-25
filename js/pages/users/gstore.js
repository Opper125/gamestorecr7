/**
 * js/pages/users/gstore.js - G Store Page (G2Bulk Integration)
 */

(function () {
  'use strict';

  const GStorePage = {
    activeTab: 'topup',

    async load() {
      this.renderTabs();
      if (this.activeTab === 'topup') {
        await this.loadTopupContent();
      } else {
        await this.loadGiftCardsContent();
      }
    },

    renderTabs() {
      const tabs = document.querySelectorAll('.gstore-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.activeTab = tab.dataset.tab;
          await this.load();
        });
      });
    },

    async loadTopupContent() {
      const container = document.getElementById('gstore-content');
      if (!container) return;

      try {
        // Fetch admin categories for topup
        const res = await fetch('/api/supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'query',
            table: 'g2bulk_admin_categories',
            columns: '*',
            filters: [{ method: 'eq', column: 'page_type', value: 'topup' }],
            order: { column: 'sort_order', ascending: true },
          }),
        });
        const { data: categories } = await res.json();

        container.innerHTML = `
          <div class="gstore-category-section">
            <div class="gstore-category-header">Categories</div>
            <div class="gstore-category-list">
              ${(categories || []).map(c => `
                <div class="gstore-category-item" data-id="${c.id}">
                  <img src="${c.icon_url || '/assets/icons/default-category.svg'}" alt="" class="gstore-category-icon" loading="lazy" />
                  <span class="gstore-category-name">${Utils.escapeHtml(c.name)}</span>
                </div>
              `).join('')}
              ${(!categories || categories.length === 0) ? '<div style="grid-column:span 4;text-align:center;color:var(--text-muted);font-size:0.8rem;">Loading categories...</div>' : ''}
            </div>
          </div>
          <div class="gstore-category-section">
            <div class="gstore-category-header">Games</div>
            <div class="gstore-game-list" id="gstore-game-list">
              <div style="text-align:center;padding:1rem;color:var(--text-muted);font-size:0.8rem;">Select a category to browse games</div>
            </div>
          </div>
        `;

        // Add click handlers for categories
        container.querySelectorAll('.gstore-category-item').forEach(item => {
          item.addEventListener('click', () => this.loadGames(item.dataset.id));
        });
      } catch (err) {
        container.innerHTML = '<div style="text-align:center;padding:1rem;">Failed to load G Store</div>';
      }
    },

    async loadGames(categoryId) {
      const list = document.getElementById('gstore-game-list');
      if (!list) return;

      // Fetch games assigned to this category
      const res = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'query',
          table: 'g2bulk_game_assignments',
          columns: '*',
          filters: [{ method: 'eq', column: 'admin_category_id', value: categoryId }],
        }),
      });
      const { data: games } = await res.json();

      if (!games || games.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-muted);">No games available</div>';
        return;
      }

      list.innerHTML = games.map(g => `
        <div class="gstore-game-item" data-code="${g.game_code}">
          <img src="/assets/icons/default-category.svg" alt="" class="gstore-game-icon" loading="lazy" />
          <span class="gstore-game-name">${Utils.escapeHtml(g.game_name)}</span>
        </div>
      `).join('');

      list.querySelectorAll('.gstore-game-item').forEach(item => {
        item.addEventListener('click', () => this.loadGameDetail(item.dataset.code));
      });
    },

    async loadGameDetail(gameCode) {
      // This would call /api/g2bulk-v1 to fetch game details, fields, and packages
      // For now, render placeholder detail form
      const container = document.getElementById('gstore-content');
      if (!container) return;

      container.innerHTML = `
        <div class="gstore-game-detail">
          <button class="back-btn" id="gstore-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back
          </button>
          <h3 style="margin:1rem 0;">Game: ${gameCode}</h3>
          <div class="gstore-input-section">
            <label>Player ID</label>
            <input id="gstore-player-id" type="text" class="form-input" placeholder="Enter Player ID" />
          </div>
          <div class="gstore-input-section">
            <label>Server ID (optional)</label>
            <input id="gstore-server-id" type="text" class="form-input" placeholder="Enter Server ID" />
          </div>
          <button id="gstore-verify" class="btn-primary btn-full">Verify & Load Packages</button>
          <div id="gstore-packages" class="gstore-package-list" style="margin-top:1rem;"></div>
        </div>
      `;

      document.getElementById('gstore-back')?.addEventListener('click', () => this.load());
      document.getElementById('gstore-verify')?.addEventListener('click', () => {
        alert('Verification and package loading would use /api/g2bulk-v1');
      });
    },

    async loadGiftCardsContent() {
      const container = document.getElementById('gstore-content');
      if (!container) return;

      container.innerHTML = `
        <div class="gstore-category-section">
          <div class="gstore-category-header">Gift Cards</div>
          <div class="gstore-category-list">
            <div style="grid-column:span 4;text-align:center;padding:2rem;color:var(--text-muted);font-size:0.85rem;">
              Gift card services loaded via G2Bulk API
            </div>
          </div>
        </div>
      `;
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
      const page = document.getElementById('page-gstore');
      if (page && page.classList.contains('active')) {
        GStorePage.load();
        observer.disconnect();
      }
    });
    observer.observe(document.getElementById('page-gstore')?.parentElement || document.body, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });
  });

  window.GStorePage = GStorePage;
})();
