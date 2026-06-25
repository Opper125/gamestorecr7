/**
 * js/components/review.js - Review & Rating System
 * 1-15 stars. Product and website reviews. See-more overlay.
 */
(function() {
'use strict';
const ReviewManager = {
  async loadWebsiteReviews() {
    const area = document.getElementById('website-review-area');
    if (!area) return;
    try {
      const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'query',table:'reviews',columns:'*',filters:[{method:'eq',column:'target_type',value:'website'}],order:{column:'created_at',ascending:false}}) });
      const {data} = await res.json();
      const reviews = data || [];
      area.innerHTML = `
        <div id="review-stars-container" style="display:flex;gap:2px;margin-bottom:0.5rem;cursor:pointer;">
          ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => `<svg data-rating="${i}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4D0CA" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`).join('')}
        </div>
        <textarea id="review-text" class="form-input form-textarea" placeholder="Share your experience..." style="margin-bottom:0.5rem;"></textarea>
        <button id="submit-review" class="btn-primary btn-sm">Submit</button>
        <div style="margin-top:0.75rem;">${reviews.slice(0,1).map(r => `<div class="review-card"><div class="review-header"><span class="review-user">${r.user_id?.slice(0,6)}</span><div class="review-stars">${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => `<svg class="review-star ${i<=r.rating?'':'empty'}" width="12" height="12" viewBox="0 0 24 24" fill="${i<=r.rating?'#F59E0B':'#E8E4DE'}" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`).join('')}</div></div><div class="review-message">${Utils.escapeHtml(r.message)}</div></div>`).join('')}
        ${reviews.length > 1 ? '<button id="see-all-reviews" class="review-see-more">See more reviews</button>' : ''}
      `;
      this.setupStarRating('review-stars-container', 'submit-review', 'review-text');
    } catch(e) {}
  },

  setupStarRating(containerId, submitId, textareaId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let selected = 0;
    const stars = container.querySelectorAll('svg');
    stars.forEach(s => {
      s.addEventListener('click', () => {
        selected = parseInt(s.dataset.rating);
        stars.forEach((st, i) => { st.style.fill = i < selected ? '#F59E0B' : 'none'; st.style.stroke = i < selected ? '#F59E0B' : '#D4D0CA'; });
      });
    });
    document.getElementById(submitId)?.addEventListener('click', async () => {
      if (selected === 0) { alert('Please select a rating'); return; }
      const msg = document.getElementById(textareaId)?.value;
      if (!msg) { alert('Please write a review'); return; }
      await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'insert',table:'reviews',data:{user_id:Auth.getUserId(),target_type:'website',rating:selected,message:msg}}) });
      alert('Review submitted!');
      this.loadWebsiteReviews();
    });
  }
};
document.addEventListener('DOMContentLoaded', () => setTimeout(() => ReviewManager.loadWebsiteReviews(), 3000));
window.ReviewManager = ReviewManager;
})();
