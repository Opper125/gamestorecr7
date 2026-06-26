/**
 * js/global/navigation.js - Dashboard Navigation Initializer
 *
 * Handles sidebar navigation for admin/reseller dashboards and
 * bottom navigation for the user dashboard. Runs after DOM is ready.
 * Uses the Utils.initDashboardNav() helper from utils.js.
 */

(function () {
  'use strict';

  function init() {
    if (document.getElementById('admin-app')) {
      initAdminNav();
    } else if (document.getElementById('reseller-app')) {
      initResellerNav();
    } else if (document.getElementById('app')) {
      initUserNav();
    }
  }

  function initAdminNav() {
    Utils.initDashboardNav('sidebar-item', 'admin-page', {
      dashboard: window.AdminDashboard,
      settings: window.AdminSettings,
      users: window.AdminUsers,
      orders: window.AdminOrders,
      products: window.AdminProducts,
      categories: window.AdminCategories,
      banner: window.AdminBanner,
      payment: window.AdminPayment,
      promo: window.AdminPromo,
      g2bulk: window.AdminG2Bulk,
      reseller: window.AdminReseller,
    });
  }

  function initResellerNav() {
    Utils.initDashboardNav('sidebar-item', 'reseller-page', {
      dashboard: window.ResellerDashboard,
      menu: window.ResellerMenu,
      categories: window.ResellerCategories,
      products: window.ResellerProducts,
      orders: window.ResellerOrders,
      payment: window.ResellerPayment,
      'input-tables': window.ResellerInputTables,
      premium: window.ResellerPremium,
      settings: window.ResellerSettings,
    }, 'admin-page');
  }

  function initUserNav() {
    Utils.initDashboardNav('nav-item', 'page', {
      home: window.HomePage,
      categories: window.CategoriesPage,
      gstore: window.GStorePage,
      news: window.NewsPage,
      orders: window.OrdersPage,
      profile: window.ProfilePage,
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
