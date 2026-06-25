/**
 * js/pages/users/categories.js - Categories Page & KYC Controller
 */

(function () {
  'use strict';

  const CategoriesPage = {
    async load() {
      try {
        const res = await fetch('/api/supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'query',
            table: 'home_categories',
            columns: '*',
            order: { column: 'sort_order', ascending: true },
          }),
        });
        const { data } = await res.json();
        this.render(data || []);

        // Show reseller CTA for non-reseller users
        this.renderResellerCTA();
      } catch (err) {
        console.warn('Categories load error');
      }
    },

    render(categories) {
      const grid = document.getElementById('categories-grid');
      if (!grid) return;

      grid.innerHTML = categories.map(cat => `
        <div class="category-card" data-id="${cat.id}">
          <img src="${cat.icon_url || '/assets/icons/default-category.svg'}" alt="" class="category-icon" loading="lazy" />
          <span class="category-name">${Utils.escapeHtml(cat.name)}</span>
          ${cat.discount_label ? `<span class="category-discount">${Utils.escapeHtml(cat.discount_label)}</span>` : ''}
          ${cat.flag_text ? `<span class="category-flag">${Utils.escapeHtml(cat.flag_text)}</span>` : ''}
        </div>
      `).join('');
    },

    renderResellerCTA() {
      const user = Auth.getUser();
      if (!user) return;

      const header = document.getElementById('categories-header');
      if (!header) return;

      if (user.role === 'reseller') {
        header.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h2>Categories</h2>
            <button class="auth-btn" onclick="Auth.goToResellerDashboard()">Reseller Dashboard</button>
          </div>
        `;
      } else if (user.role !== 'banned') {
        // Show "Become a Reseller" CTA below header
        const existing = document.querySelector('.reseller-cta');
        if (!existing) {
          const cta = document.createElement('div');
          cta.className = 'reseller-cta';
          cta.innerHTML = `
            <span class="reseller-cta-text">Become a Reseller</span>
            <svg class="reseller-cta-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          `;
          cta.addEventListener('click', () => this.openKYCForm());
          header.parentElement.insertBefore(cta, header.nextSibling);
        }
      }
    },

    async openKYCForm() {
      const container = document.getElementById('categories-grid');
      if (!container) return;

      container.innerHTML = `
        <div class="kyc-form">
          <h3 style="margin-bottom:1rem;">Reseller Application</h3>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:1rem;">
            Complete the form below to apply as a reseller. Review takes 1-7 business days.
          </p>
          <div class="form-group">
            <label>Full Name (English)</label>
            <input id="kyc-fullname" type="text" class="form-input" placeholder="e.g. John Doe" required />
          </div>
          <div class="form-group">
            <label>NRC Number</label>
            <input id="kyc-nrc" type="text" class="form-input" placeholder="e.g. 12/MAGATA(N)123456" required />
          </div>
          <div class="form-group">
            <label>Date of Birth</label>
            <input id="kyc-dob" type="date" class="form-input" required />
          </div>
          <div class="form-group">
            <label>NRC Issue Date</label>
            <input id="kyc-issue-date" type="date" class="form-input" required />
          </div>
          <div class="form-group">
            <label>Current Address</label>
            <textarea id="kyc-address" class="form-input form-textarea" placeholder="Full address" required></textarea>
          </div>
          <div class="form-group">
            <label>Phone Numbers</label>
            <div id="kyc-phones">
              <div class="social-link-row">
                <input type="tel" class="form-input phone-input" placeholder="Phone number" required />
                <button class="link-btn add-phone" type="button">+</button>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Ward Support Letter (Image)</label>
            <input id="kyc-letter" type="file" accept="image/*" class="form-input" />
          </div>
          <div class="form-group">
            <label>NRC Front (Image)</label>
            <input id="kyc-nrc-front" type="file" accept="image/*" class="form-input" />
          </div>
          <div class="form-group">
            <label>NRC Back (Image)</label>
            <input id="kyc-nrc-back" type="file" accept="image/*" class="form-input" />
          </div>
          <div class="form-group">
            <label>Payment Methods</label>
            <div id="kyc-payments">
              <div class="social-link-row">
                <input type="text" class="form-input" placeholder="Pay Name" style="flex:1;" />
                <input type="text" class="form-input" placeholder="Account Number" style="flex:1;" />
                <input type="text" class="form-input" placeholder="Account Name" style="flex:1;" />
                <button class="link-btn add-payment" type="button">+</button>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Owner Photo (Clear face photo)</label>
            <input id="kyc-owner-photo" type="file" accept="image/*" class="form-input" />
          </div>
          <button id="kyc-submit" class="btn-primary btn-full mt-4">Submit Application</button>
          <button id="kyc-cancel" class="btn-secondary btn-full mt-2">Cancel</button>
        </div>
      `;

      // Event listeners
      document.querySelector('.add-phone')?.addEventListener('click', () => {
        const wrapper = document.getElementById('kyc-phones');
        const row = document.createElement('div');
        row.className = 'social-link-row';
        row.innerHTML = `
          <input type="tel" class="form-input phone-input" placeholder="Phone number" />
          <button class="link-btn remove-phone" type="button">-</button>
        `;
        wrapper.appendChild(row);
        row.querySelector('.remove-phone').addEventListener('click', () => row.remove());
      });

      document.querySelector('.add-payment')?.addEventListener('click', () => {
        const wrapper = document.getElementById('kyc-payments');
        const row = document.createElement('div');
        row.className = 'social-link-row';
        row.innerHTML = `
          <input type="text" class="form-input" placeholder="Pay Name" style="flex:1;" />
          <input type="text" class="form-input" placeholder="Account Number" style="flex:1;" />
          <input type="text" class="form-input" placeholder="Account Name" style="flex:1;" />
          <button class="link-btn remove-payment" type="button">-</button>
        `;
        wrapper.appendChild(row);
        row.querySelector('.remove-payment').addEventListener('click', () => row.remove());
      });

      document.getElementById('kyc-submit')?.addEventListener('click', () => this.submitKYC());
      document.getElementById('kyc-cancel')?.addEventListener('click', () => this.load());
    },

    async submitKYC() {
      const user = Auth.getUser();
      if (!user) return;

      LoadingManager.show('Submitting application...');
      // Collect form data
      const kycData = {
        user_id: user.id,
        full_name: document.getElementById('kyc-fullname')?.value || '',
        nrc_number: document.getElementById('kyc-nrc')?.value || '',
        date_of_birth: document.getElementById('kyc-dob')?.value || '',
        nrc_issue_date: document.getElementById('kyc-issue-date')?.value || '',
        address: document.getElementById('kyc-address')?.value || '',
        phone_numbers: [],
        kyc_status: 'pending',
      };

      // Collect phone numbers
      document.querySelectorAll('.phone-input').forEach(input => {
        if (input.value) kycData.phone_numbers.push(input.value);
      });

      // Upload images (simplified - would use /api/imgbb in production)
      // For now submit with placeholder URLs
      kycData.ward_support_letter_url = '/assets/icons/default-upload.svg';
      kycData.nrc_front_url = '/assets/icons/default-upload.svg';
      kycData.nrc_back_url = '/assets/icons/default-upload.svg';
      kycData.owner_photo_url = '/assets/icons/default-upload.svg';

      try {
        const res = await fetch('/api/supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'insert',
            table: 'reseller_accounts',
            data: kycData,
          }),
        });

        const result = await res.json();
        LoadingManager.hide();

        if (result.error) {
          alert('Error submitting application: ' + result.error);
        } else {
          // Show pending status
          const container = document.getElementById('categories-grid');
          if (container) {
            container.innerHTML = `
              <div class="kyc-status">
                <img src="/assets/icons/default-category.svg" alt="" class="kyc-status-icon" />
                <div class="kyc-status-text">Under Review  1-7 business days</div>
              </div>
            `;
          }
        }
      } catch (err) {
        LoadingManager.hide();
        alert('Submission failed. Please try again.');
      }
    },
  };

  // Load when page becomes active
  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
      const page = document.getElementById('page-categories');
      if (page && page.classList.contains('active')) {
        CategoriesPage.load();
        observer.disconnect();
      }
    });
    observer.observe(document.getElementById('page-categories')?.parentElement || document.body, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });
  });

  window.CategoriesPage = CategoriesPage;
})();
