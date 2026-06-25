/**
 * js/pages/admin/banner.js
 */
(function() {
'use strict';
const AdminBanner = { activeTab: 'banner-home',
  async load() {
    const tabs = document.querySelectorAll('#admin-page-banner .admin-tab');
    tabs.forEach(t => t.addEventListener('click', () => { tabs.forEach(x => x.classList.remove('active')); t.classList.add('active'); this.activeTab = t.dataset.tab; this.renderContent(); }));
    this.renderContent();
  },
  async renderContent() {
    const c = document.getElementById('admin-banner-content');
    if (this.activeTab === 'banner-home') {
      try {
        const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'query',table:'banners',columns:'*',order:{column:'sort_order',ascending:true}}) });
        const {data} = await res.json();
        c.innerHTML = `<div class="banner-section"><button class="create-btn">+ Upload Home Banner</button><div class="banner-admin-list">${(data||[]).map(b => `<div class="banner-admin-item"><img src="${b.image_url}" alt="" class="banner-preview-sm" /><div class="banner-admin-info"><span class="banner-admin-order">Order: ${b.sort_order||0}</span></div><button class="banner-admin-delete" data-id="${b.id}">Delete</button></div>`).join('')}</div></div>`;
      } catch(e) { c.innerHTML = '<div style="padding:1rem;color:var(--text-muted);">Failed to load banners</div>'; }
    } else {
      c.innerHTML = '<div class="banner-section"><button class="create-btn">+ Upload Category Banner</button><p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.5rem;">Category banner upload with multi-select categories</p></div>';
    }
  }
};
document.addEventListener('DOMContentLoaded', () => AdminBanner.load());
window.AdminBanner = AdminBanner;
})();
