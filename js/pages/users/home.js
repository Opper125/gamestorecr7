/**
 * js/pages/users/home.js - Home Page Controller
 */

(function () {
  'use strict';

  const HomePage = {
    /**
     * Load and render the home page content
     */
    async load() {
      try {
        // Fetch home data
        const [categoriesRes, productsRes, menusRes, bannersRes] = await Promise.all([
          this.fetchData('home_categories', '*'),
          this.fetchData('home_products_type1', '*'),
          this.fetchData('menus', '*'),
          this.fetchData('banners', 'id, image_url, sort_order'),
        ]);

        this.renderCategories(categoriesRes.data || []);
        this.renderProducts(productsRes.data || []);
        this.renderMenuStrip(menusRes.data || []);
        this.renderBanners(bannersRes.data || []);

        // Initialize banner slider synchronously after rendering
        // DOM is already updated by renderBanners() above
        if (bannersRes.data && bannersRes.data.length > 0 && window.BannerSlider) {
          BannerSlider.init('home-banner-slider');
        }
      } catch (err) {
        console.warn('Home load error');
      }
    },

    async fetchData(table, columns) {
      const res = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'query',
          table,
          columns,
          order: { column: 'sort_order', ascending: true },
        }),
      });
      return res.json();
    },

    renderCategories(categories) {
      const grid = document.getElementById('home-categories');
      if (!grid) return;

      if (categories.length === 0) {
        grid.innerHTML = '';
        return;
      }

      grid.innerHTML = `
        <h3 class="home-categories-title">Categories</h3>
        <div class="categories-grid">
          ${categories.map(cat => `
            <div class="category-card" data-id="${cat.id}">
              <img src="${cat.icon_url || '/assets/icons/default-category.svg'}" alt="" class="category-icon" loading="lazy" />
              <span class="category-name">${Utils.escapeHtml(cat.name)}</span>
              ${cat.discount_label ? `<span class="category-discount">${Utils.escapeHtml(cat.discount_label)}</span>` : ''}
              ${cat.flag_text ? `<span class="category-flag">${Utils.escapeHtml(cat.flag_text)}</span>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    },

    renderProducts(products) {
      const container = document.getElementById('home-standalone-products');
      if (!container) return;

      if (products.length === 0) {
        container.innerHTML = '';
        return;
      }

      container.innerHTML = `
        <h3 class="standalone-products-title">Products</h3>
        <div class="standalone-products-list">
          ${products.map(p => `
            <div class="product-card" data-id="${p.id}">
              <img src="${p.icon_url || '/assets/icons/default-product.svg'}" alt="" class="product-icon" loading="lazy" />
              <div class="product-info">
                <div class="product-name">${Utils.escapeHtml(p.name)}</div>
                <div class="product-amount-label">${p.amount_label || ''}</div>
                <div class="product-price-row">
                  <span class="product-price">${Utils.formatCurrency(p.price)}</span>
                  ${p.discount_pct ? `<span class="product-price original">${Utils.formatCurrency(p.price)}</span>` : ''}
                </div>
              </div>
              <button class="product-add-btn" aria-label="Add to cart">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          `).join('')}
        </div>
      `;
    },

    renderMenuStrip(menus) {
      const strip = document.getElementById('home-menu-strip');
      if (!strip) return;

      if (menus.length === 0) {
        strip.style.display = 'none';
        return;
      }

      strip.style.display = 'flex';
      strip.innerHTML = menus.map(m => `
        <div class="menu-strip-item" data-id="${m.id}">
          <img src="${m.icon_url || '/assets/icons/default-menu.svg'}" alt="" class="menu-strip-icon" loading="lazy" />
          <span class="menu-strip-label">${Utils.escapeHtml(m.name)}</span>
        </div>
      `).join('');
    },

    renderBanners(banners) {
      const slider = document.getElementById('home-banner-slider');
      if (!slider) return;

      if (banners.length === 0) {
        slider.style.display = 'none';
        return;
      }

      slider.style.display = 'block';
      slider.innerHTML = `
        <div class="banner-track" id="banner-track">
          ${banners.map(b => `
            <div class="banner-slide">
              <img src="${b.image_url}" alt="" loading="lazy" />
            </div>
          `).join('')}
        </div>
        <div class="banner-dots">
          ${banners.map((_, i) => `
            <span class="banner-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
          `).join('')}
        </div>
      `;
    },
  };

  // Load home page when it becomes active
  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
      const homePage = document.getElementById('page-home');
      if (homePage && homePage.classList.contains('active')) {
        HomePage.load();
        observer.disconnect();
      }
    });
    observer.observe(document.getElementById('page-home')?.parentElement || document.body, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });
  });

  window.HomePage = HomePage;
})();
