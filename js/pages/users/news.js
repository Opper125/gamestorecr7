/**
 * js/pages/users/news.js - News (YouTube) Page Controller
 */

(function () {
  'use strict';

  const NewsPage = {
    activeTab: 'videos',

    async load() {
      this.renderTabs();
      await this.loadContent();
    },

    renderTabs() {
      const tabs = document.querySelectorAll('.news-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.activeTab = tab.dataset.tab;
          await this.loadContent();
        });
      });
    },

    async loadContent() {
      const container = document.getElementById('news-content');
      if (!container) return;

      container.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="skeleton skeleton-card" style="height:180px;margin-bottom:1rem;"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text" style="width:60%;"></div></div>';

      try {
        const res = await fetch(`/api/youtube?type=${this.activeTab}&max_results=10`);
        const result = await res.json();

        if (!result.data || !result.data.items || result.data.items.length === 0) {
          container.innerHTML = this.activeTab === 'posts'
            ? '<div class="posts-placeholder">Community posts are not available via the YouTube API</div>'
            : '<div class="posts-placeholder">No content available</div>';
          return;
        }

        container.innerHTML = result.data.items.map(item => {
          const snippet = item.snippet || {};
          const stats = item.statistics || {};
          const videoId = item.contentDetails?.videoId || item.id?.videoId || '';
          const thumb = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '';

          return `
            <div class="video-card" data-video-id="${videoId}">
              <img src="${thumb}" alt="" class="video-thumbnail" loading="lazy" onerror="this.src='/assets/icons/default-category.svg'" />
              <div class="video-body">
                <div class="video-title">${Utils.escapeHtml(snippet.title || 'Untitled')}</div>
                <div class="video-stats">
                  ${stats.viewCount ? `<span class="video-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>${Utils.formatCompactCount(stats.viewCount)}</span>` : ''}
                  ${stats.likeCount ? `<span class="video-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>${Utils.formatCompactCount(stats.likeCount)}</span>` : ''}
                  ${stats.commentCount ? `<span class="video-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>${Utils.formatCompactCount(stats.commentCount)}</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('');

        // Add click to view video
        container.querySelectorAll('.video-card').forEach(card => {
          card.addEventListener('click', () => {
            const videoId = card.dataset.videoId;
            if (videoId) this.showVideoDetail(videoId);
          });
        });
      } catch (err) {
        container.innerHTML = '<div class="posts-placeholder">Failed to load content</div>';
      }
    },

    async showVideoDetail(videoId) {
      const container = document.getElementById('news-content');
      if (!container) return;

      container.innerHTML = `
        <div class="video-detail">
          <button class="back-btn" id="video-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back
          </button>
          <div class="video-embed">
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen style="border-radius:var(--radius-sm);"></iframe>
          </div>
          <div class="video-detail-stats" id="video-detail-stats">Loading...</div>
          <div class="video-actions">
            <button class="video-action-btn like-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg> Like</button>
            <button class="video-action-btn comment-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Comment</button>
            <button class="video-action-btn subscribe-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15l5-3-5-3v6z"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg> Subscribe</button>
          </div>
          <div id="video-comments" class="video-comments"></div>
        </div>
      `;

      document.getElementById('video-back')?.addEventListener('click', () => this.load());

      // Fetch video details and comments
      try {
        const res = await fetch(`/api/youtube?video_id=${videoId}`);
        const result = await res.json();

        if (result.data?.video) {
          const stats = result.data.video.statistics || {};
          document.getElementById('video-detail-stats').innerHTML = `
            <span>${Utils.formatCompactCount(stats.viewCount || 0)} views</span>
            <span>${Utils.formatCompactCount(stats.likeCount || 0)} likes</span>
            <span>${Utils.formatCompactCount(stats.commentCount || 0)} comments</span>
          `;
        }

        if (result.data?.comments) {
          const commentsEl = document.getElementById('video-comments');
          commentsEl.innerHTML = result.data.comments.map(c => {
            const comment = c.snippet?.topLevelComment?.snippet || {};
            return `
              <div class="video-comment-item">
                <div class="video-comment-author">${Utils.escapeHtml(comment.authorDisplayName || 'Unknown')}</div>
                <div class="video-comment-text">${Utils.escapeHtml(comment.textOriginal || comment.textDisplay || '')}</div>
              </div>
            `;
          }).join('') || '<div style="color:var(--text-muted);font-size:0.8rem;">No comments</div>';
        }
      } catch (err) {
        document.getElementById('video-detail-stats').textContent = 'Stats unavailable';
      }
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
      const page = document.getElementById('page-news');
      if (page && page.classList.contains('active')) {
        NewsPage.load();
        observer.disconnect();
      }
    });
    observer.observe(document.getElementById('page-news')?.parentElement || document.body, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });
  });

  window.NewsPage = NewsPage;
})();
