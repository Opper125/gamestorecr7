/**
 * js/pages/users/profile.js - Profile Page Controller
 */

(function () {
  'use strict';

  const ProfilePage = {
    async load() {
      if (Auth.isLoggedIn()) {
        Auth.renderProfile();
        this.setupProfileHandlers();
      } else {
        const container = document.getElementById('profile-content');
        if (container) {
          container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">Please log in to view your profile</div>';
        }
      }
    },

    setupProfileHandlers() {
      // Password toggle
      const toggleBtn = document.getElementById('profile-pwd-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const display = document.getElementById('profile-pwd-display');
          if (display) {
            if (display.textContent === '********') {
              display.textContent = '••••••••';
            } else {
              display.textContent = '********';
            }
          }
        });
      }

      // Load reviews
      this.loadWebsiteReviews();
    },

    async loadWebsiteReviews() {
      const area = document.getElementById('website-review-area');
      if (!area) return;

      try {
        const res = await fetch('/api/supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'query',
            table: 'reviews',
            columns: '*',
            filters: [{ method: 'eq', column: 'target_type', value: 'website' }],
            order: { column: 'created_at', ascending: false },
          }),
        });
        const result = await res.json();
        const reviews = result.data || [];

        area.innerHTML = `
          <div class="star-rating" id="website-star-rating">
            ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => `
              <svg data-rating="${i}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            `).join('')}
          </div>
          <div class="review-input">
            <textarea id="website-review-text" placeholder="Write your review..." class="form-textarea"></textarea>
          </div>
          <button id="submit-website-review" class="btn-primary review-submit-btn">Submit Review</button>
          <div class="review-list" id="website-reviews-list">
            ${reviews.slice(0, 1).map(r => `
              <div class="review-card">
                <div class="review-header">
                  <span class="review-user">${Utils.escapeHtml(r.user_id?.slice(0, 8) || 'User')}</span>
                  <div class="review-stars">
                    ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => `
                      <svg class="review-star ${i <= r.rating ? '' : 'empty'}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    `).join('')}
                  </div>
                </div>
                <div class="review-message">${Utils.escapeHtml(r.message)}</div>
              </div>
            `).join('')}
            ${reviews.length > 1 ? '<button class="review-see-more" id="see-more-reviews">See More</button>' : ''}
          </div>
        `;

        // Star rating hover/click
        const stars = area.querySelectorAll('#website-star-rating svg');
        let selectedRating = 0;
        stars.forEach(star => {
          star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            stars.forEach((s, i) => {
              if (i < selectedRating) s.style.color = '#F59E0B';
              else s.style.color = '#E8E4DE';
            });
          });
          star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            stars.forEach((s, i) => {
              if (i < rating) s.style.color = '#F59E0B';
              else s.style.color = '#E8E4DE';
            });
          });
          star.addEventListener('mouseleave', () => {
            stars.forEach((s, i) => {
              if (i < selectedRating) s.style.color = '#F59E0B';
              else s.style.color = '#E8E4DE';
            });
          });
        });

        document.getElementById('submit-website-review')?.addEventListener('click', async () => {
          if (selectedRating === 0) {
            alert('Please select a rating');
            return;
          }
          const message = document.getElementById('website-review-text')?.value;
          if (!message || message.length < 10) {
            alert('Please write at least a short review message');
            return;
          }
          // Submit review
          const res = await fetch('/api/supabase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'insert',
              table: 'reviews',
              data: {
                user_id: Auth.getUserId(),
                target_type: 'website',
                rating: selectedRating,
                message,
              },
            }),
          });
          const result = await res.json();
          if (!result.error) {
            alert('Review submitted!');
            this.loadWebsiteReviews();
          }
        });
      } catch (err) {
        area.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;">Failed to load reviews</div>';
      }
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
      const page = document.getElementById('page-profile');
      if (page && page.classList.contains('active')) {
        ProfilePage.load();
        observer.disconnect();
      }
    });
    observer.observe(document.getElementById('page-profile')?.parentElement || document.body, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });
  });

  window.ProfilePage = ProfilePage;
})();
