(function() {
  'use strict';

  let currentFeed = 'topstories';
  let feedIds = [];
  let allLoadedItems = [];
  let currentPage = 0;
  const itemsPerPage = 20;
  let isSearching = false;

  let elements = {};

  function init() {
    elements = {
      feedSelect: document.getElementById('feedSelect'),
      searchInput: document.getElementById('searchInput'),
      itemsList: document.getElementById('itemsList'),
      loadingIndicator: document.getElementById('loadingIndicator'),
      themeToggle: document.getElementById('themeToggle'),
      refreshBtn: document.getElementById('refreshBtn'),
      modal: document.getElementById('modal'),
      modalContent: document.getElementById('modalContent'),
      modalClose: document.getElementById('modalClose')
    };

    if (!elements.itemsList) {
      console.error('Critical elements missing!');
      return;
    }

    setupEventListeners();
    applyTheme();
    loadFeed();
  }

  function setupEventListeners() {
    if (elements.feedSelect) {
      elements.feedSelect.addEventListener('change', (e) => {
        currentFeed = e.target.value;
        resetAndLoad();
      });
    }

    if (elements.refreshBtn) {
      elements.refreshBtn.addEventListener('click', resetAndLoad);
    }

    if (elements.themeToggle) {
      elements.themeToggle.addEventListener('click', toggleTheme);
    }

    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', debounce(handleSearch, 500));
    }

    if (elements.modalClose) {
      elements.modalClose.addEventListener('click', closeModal);
    }

    if (elements.modal) {
      elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal || e.target.classList.contains('modal-backdrop')) {
          closeModal();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.modal && elements.modal.classList.contains('active')) {
        closeModal();
      }
    });

    if (elements.itemsList) {
      elements.itemsList.addEventListener('click', (e) => {
        const card = e.target.closest('.story-card');
        if (card && !card.classList.contains('skeleton')) {
          const storyId = card.dataset.storyId;
          if (storyId) {
            openComments(storyId);
          }
        }
      });
    }

    window.addEventListener('scroll', debounce(handleScroll, 200));
  }

  async function loadFeed() {
    try {
      showLoading(true);
      feedIds = await window.hnAPI.fetchFeed(currentFeed);
      currentPage = 0;
      elements.itemsList.innerHTML = '';
      await loadMoreItems();
      showLoading(false);
    } catch (error) {
      console.error('Failed to load feed:', error);
      elements.itemsList.innerHTML = '<div class="error">Failed to load stories. Please try again.</div>';
      showLoading(false);
    }
  }

  async function loadMoreItems() {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    const idsToLoad = feedIds.slice(start, end);

    if (idsToLoad.length === 0) return;

    idsToLoad.forEach(() => {
      elements.itemsList.appendChild(createSkeleton());
    });

    const items = await window.hnAPI.fetchItems(idsToLoad);
    
    const skeletons = elements.itemsList.querySelectorAll('.skeleton');
    skeletons.forEach(s => s.remove());

    items.forEach((item, idx) => {
      if (item && !item.deleted) {
        allLoadedItems.push(item);
        const card = createStoryCard(item, start + idx + 1);
        elements.itemsList.appendChild(card);
      }
    });

    currentPage++;
  }

  function createStoryCard(item, rank) {
    const card = document.createElement('article');
    card.className = 'story-card';
    card.dataset.storyId = item.id;
    card.dataset.url = item.url || `https://news.ycombinator.com/item?id=${item.id}`;
    
    const domain = item.url ? new URL(item.url).hostname.replace('www.', '') : 'news.ycombinator.com';
    const timeAgo = formatTimeAgo(item.time);
    
    card.innerHTML = `
      <div class="story-header">
        <div class="story-rank">#${rank}</div>
        <div class="story-meta">
          <div class="story-domain">${escapeHtml(domain)}</div>
          <div class="story-time">${timeAgo}</div>
        </div>
      </div>
      
      <h2 class="story-title">${escapeHtml(item.title || 'Untitled')}</h2>
      
      <div class="story-footer">
        <div class="story-stats">
          <span class="stat-item stat-score">⭐ ${item.score || 0}</span>
          <span class="stat-item stat-comments">💬 ${item.descendants || 0} comments</span>
          <span class="stat-item">👤 ${escapeHtml(item.by || 'unknown')}</span>
        </div>
        <button class="quick-link-btn" title="Open link" onclick="event.stopPropagation(); window.open('${card.dataset.url}', '_blank')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </button>
      </div>
    `;

    return card;
  }

  function createSkeleton() {
    const skeleton = document.createElement('article');
    skeleton.className = 'story-card skeleton';
    skeleton.innerHTML = `
      <div class="story-header">
        <div class="skeleton-box" style="width: 40px; height: 24px;"></div>
        <div class="skeleton-box" style="width: 120px; height: 16px;"></div>
      </div>
      <div class="skeleton-box" style="width: 90%; height: 24px; margin: 12px 0;"></div>
      <div class="skeleton-box" style="width: 70%; height: 20px;"></div>
      <div class="story-footer" style="margin-top: 16px;">
        <div class="skeleton-box" style="width: 200px; height: 20px;"></div>
      </div>
    `;
    return skeleton;
  }

  function handleScroll() {
    if (isSearching) return;
    
    const scrollTop = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= docHeight - 400) {
      loadMoreItems();
    }
  }

  async function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    if (!query) {
      isSearching = false;
      elements.itemsList.innerHTML = '';
      currentPage = 0;
      await loadMoreItems();
      return;
    }

    isSearching = true;
    
    const filteredItems = allLoadedItems.filter(item => 
      item.title && item.title.toLowerCase().includes(query)
    );

    elements.itemsList.innerHTML = '';
    
    if (filteredItems.length === 0) {
      elements.itemsList.innerHTML = '<div class="empty-state"><p>No stories found matching your search.</p></div>';
      return;
    }

    filteredItems.forEach((item, idx) => {
      const card = createStoryCard(item, idx + 1);
      elements.itemsList.appendChild(card);
    });
  }

  function resetAndLoad() {
    feedIds = [];
    allLoadedItems = [];
    currentPage = 0;
    isSearching = false;
    elements.itemsList.innerHTML = '';
    if (elements.searchInput) {
      elements.searchInput.value = '';
    }
    loadFeed();
  }

  function showLoading(loading) {
    if (elements.loadingIndicator) {
      elements.loadingIndicator.classList.toggle('active', loading);
    }
  }

  function applyTheme() {
    const savedTheme = localStorage.getItem('hn_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('hn_theme', newTheme);
  }

  function openModal(content) {
    if (!elements.modal || !elements.modalContent) return;
    elements.modalContent.innerHTML = content;
    elements.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!elements.modal) return;
    elements.modal.classList.remove('active');
    document.body.style.overflow = '';
    currentCommentIds = [];
    currentCommentPage = 0;
    isLoadingComments = false;
  }

  let currentCommentIds = [];
  let currentCommentPage = 0;
  const commentsPerPage = 10;
  let isLoadingComments = false;

  async function openComments(storyId) {
    try {
      const story = await window.hnAPI.fetchItem(storyId);
      
      if (!story) {
        alert('Failed to load story');
        return;
      }

      currentCommentIds = story.kids || [];
      currentCommentPage = 0;

      const modalHTML = `
        <div class="modal-story-header">
          <h2 class="modal-story-title">${escapeHtml(story.title || 'Untitled')}</h2>
          <div class="modal-story-meta">
            <span class="meta-item">👤 ${escapeHtml(story.by || 'unknown')}</span>
            <span class="meta-separator">•</span>
            <span class="meta-item">⏰ ${formatTimeAgo(story.time)}</span>
            <span class="meta-separator">•</span>
            <span class="meta-item">💬 ${story.descendants || 0} comments</span>
          </div>
          <div class="modal-story-actions">
            ${story.url ? `
              <a href="${story.url}" target="_blank" rel="noopener" class="modal-link-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Open Link
              </a>
            ` : ''}
            <a href="https://news.ycombinator.com/item?id=${story.id}" 
               target="_blank" 
               rel="noopener" 
               class="modal-link-btn modal-hn-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              View on HN
            </a>
          </div>
        </div>

        ${story.text ? `
          <div class="story-text">
            ${story.text}
          </div>
        ` : ''}
        
        <div class="comments-container" id="commentsContainer">
          ${currentCommentIds.length > 0 ? 
            '<div class="loading-comments">Loading comments...</div>' : 
            '<div class="no-comments">No comments yet</div>'
          }
        </div>
      `;

      openModal(modalHTML);

      if (currentCommentIds.length > 0) {
        const container = document.getElementById('commentsContainer');
        container.innerHTML = '';
        await loadMoreComments();
        setupModalScroll();
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      alert('Failed to load comments');
    }
  }

  function setupModalScroll() {
    const modalContent = elements.modalContent;
    if (!modalContent) return;

    const handleModalScroll = debounce(async () => {
      const scrollTop = modalContent.scrollTop;
      const scrollHeight = modalContent.scrollHeight;
      const clientHeight = modalContent.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - 200 && !isLoadingComments) {
        await loadMoreComments();
      }
    }, 200);

    modalContent.addEventListener('scroll', handleModalScroll);
  }

  async function loadMoreComments() {
    if (isLoadingComments) return;

    const start = currentCommentPage * commentsPerPage;
    const end = start + commentsPerPage;
    const idsToLoad = currentCommentIds.slice(start, end);

    if (idsToLoad.length === 0) return;

    isLoadingComments = true;
    const container = document.getElementById('commentsContainer');
    
    if (container) {
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading-comments';
      loadingDiv.textContent = 'Loading more comments...';
      container.appendChild(loadingDiv);

      const comments = await window.hnAPI.fetchItems(idsToLoad);
      
      loadingDiv.remove();

      comments.forEach(comment => {
        if (comment && !comment.deleted) {
          const commentEl = createCommentElement(comment);
          container.appendChild(commentEl);
        }
      });

      currentCommentPage++;
    }

    isLoadingComments = false;
  }

  function createCommentElement(comment, level = 0) {
    const article = document.createElement('article');
    article.className = `comment comment-level-${Math.min(level, 5)}`;
    article.style.marginLeft = `${level * 20}px`;
    
    const hasReplies = comment.kids && comment.kids.length > 0;
    
    article.innerHTML = `
      <div class="comment-header">
        <div class="comment-author">👤 ${escapeHtml(comment.by || 'unknown')}</div>
        <div class="comment-time">${formatTimeAgo(comment.time)}</div>
      </div>
      
      <div class="comment-body">
        ${comment.text || '<i>Comment deleted</i>'}
      </div>
      
      ${hasReplies ? `
        <button class="comment-replies-toggle" data-comment-id="${comment.id}">
          ▶ Show ${comment.kids.length} ${comment.kids.length === 1 ? 'reply' : 'replies'}
        </button>
        <div class="comment-children" data-comment-id="${comment.id}" style="display:none;"></div>
      ` : ''}
    `;

    if (hasReplies) {
      const toggle = article.querySelector('.comment-replies-toggle');
      const childrenContainer = article.querySelector('.comment-children');
      
      toggle.addEventListener('click', async () => {
        if (childrenContainer.style.display === 'none') {
          toggle.disabled = true;
          toggle.textContent = 'Loading...';
          
          if (childrenContainer.children.length === 0) {
            const replies = await window.hnAPI.fetchItems(comment.kids);
            replies.forEach(reply => {
              if (reply && !reply.deleted) {
                childrenContainer.appendChild(createCommentElement(reply, level + 1));
              }
            });
          }
          
          childrenContainer.style.display = '';
          toggle.textContent = `▼ Hide replies`;
          toggle.disabled = false;
        } else {
          childrenContainer.style.display = 'none';
          toggle.textContent = `▶ Show ${comment.kids.length} ${comment.kids.length === 1 ? 'reply' : 'replies'}`;
        }
      });
    }

    return article;
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function formatTimeAgo(timestamp) {
    if (!timestamp) return 'unknown';
    
    const now = Date.now();
    const diff = Math.floor((now - timestamp * 1000) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;

    switch(e.key.toLowerCase()) {
      case 'r':
        e.preventDefault();
        resetAndLoad();
        break;
      case '/':
        e.preventDefault();
        if (elements.searchInput) {
          elements.searchInput.focus();
        }
        break;
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
