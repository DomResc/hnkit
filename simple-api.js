/**
 * Simple HackerNews API wrapper
 */

const API_BASE = 'https://hacker-news.firebaseio.com/v0';

class SimpleAPI {
  constructor() {
    this.cache = new Map();
  }

  async fetchFeed(feedType = 'topstories') {
    const cacheKey = `feed_${feedType}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.time < 300000) { // 5 min
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${API_BASE}/${feedType}.json`);
      const data = await response.json();
      this.cache.set(cacheKey, { data, time: Date.now() });
      return data;
    } catch (error) {
      console.error('Failed to fetch feed:', error);
      throw error;
    }
  }

  async fetchItem(id) {
    const cacheKey = `item_${id}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${API_BASE}/item/${id}.json`);
      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch item:', error);
      return null;
    }
  }

  async fetchItems(ids) {
    const promises = ids.map(id => this.fetchItem(id));
    return Promise.all(promises);
  }
}

// Export singleton
window.hnAPI = new SimpleAPI();
