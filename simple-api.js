/**
 * Multi-source API wrapper (HackerNews + Dev.to)
 */

// ==================== HackerNews API ====================
class HackerNewsAPI {
  constructor() {
    this.cache = new Map();
    this.apiBase = "https://hacker-news.firebaseio.com/v0";
  }

  async fetchFeed(feedType = "topstories") {
    const cacheKey = `feed_${feedType}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.time < 300000) {
        // 5 min
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${this.apiBase}/${feedType}.json`);
      const data = await response.json();
      this.cache.set(cacheKey, { data, time: Date.now() });
      return data;
    } catch (error) {
      console.error("Failed to fetch HN feed:", error);
      throw error;
    }
  }

  async fetchItem(id) {
    const cacheKey = `item_${id}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.apiBase}/item/${id}.json`);
      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Failed to fetch HN item:", error);
      return null;
    }
  }

  async fetchItems(ids) {
    const promises = ids.map((id) => this.fetchItem(id));
    return Promise.all(promises);
  }

  async fetchUser(id) {
    const cacheKey = `user_${id}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.apiBase}/user/${id}.json`);
      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Failed to fetch HN user:", error);
      return null;
    }
  }
}

// ==================== Dev.to API ====================
class DevToAPI {
  constructor() {
    this.cache = new Map();
    this.apiBase = "https://dev.to/api";
  }

  async fetchFeed(feedType = "latest") {
    const cacheKey = `feed_${feedType}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.time < 300000) {
        // 5 min
        return cached.data;
      }
    }

    try {
      // Dev.to doesn't have feed types like HN, we fetch articles
      const url = new URL(`${this.apiBase}/articles`);
      url.searchParams.append("per_page", "30");

      if (feedType !== "latest") {
        url.searchParams.append("tags", feedType);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      // Normalize to IDs (keep as numbers like HN)
      const ids = data.map((article) => article.id);

      // Cache articles for later retrieval
      data.forEach((article) => {
        this.cache.set(`article_${article.id}`, article);
      });

      this.cache.set(cacheKey, { data: ids, time: Date.now() });
      return ids;
    } catch (error) {
      console.error("Failed to fetch Dev.to feed:", error);
      throw error;
    }
  }

  async fetchItem(id) {
    const cacheKey = `article_${id}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.apiBase}/articles/${id}`);
      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Failed to fetch Dev.to article:", error);
      return null;
    }
  }

  async fetchItems(ids) {
    const promises = ids.map((id) => this.fetchItem(id));
    return Promise.all(promises);
  }

  async fetchUser(username) {
    const cacheKey = `user_${username}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${this.apiBase}/users/by_username?url=https://dev.to/${username}`,
      );
      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Failed to fetch Dev.to user:", error);
      return null;
    }
  }
}

// ==================== API Manager ====================
class APIManager {
  constructor() {
    this.hnAPI = new HackerNewsAPI();
    this.devtoAPI = new DevToAPI();
    this.currentSource = "hn"; // 'hn' or 'devto' (kept for backward compatibility)
  }

  setSource(source) {
    this.currentSource = source;
  }

  getAPI() {
    return this.currentSource === "hn" ? this.hnAPI : this.devtoAPI;
  }

  async fetchFeed(feedType = "topstories") {
    return this.getAPI().fetchFeed(feedType);
  }

  // New method: fetch unified feed from both sources
  async fetchUnifiedFeed() {
    try {
      const hnIds = await this.hnAPI.fetchFeed("topstories");
      const devtoIds = await this.devtoAPI.fetchFeed("latest");

      // Mark items with their source
      const hnWithSource = hnIds
        .slice(0, 15)
        .map((id) => ({ id, source: "hn" }));
      const devtoWithSource = devtoIds
        .slice(0, 15)
        .map((id) => ({ id, source: "devto" }));

      // Interleave the two sources for variety
      const unified = [];
      for (
        let i = 0;
        i < Math.max(hnWithSource.length, devtoWithSource.length);
        i++
      ) {
        if (i < hnWithSource.length) unified.push(hnWithSource[i]);
        if (i < devtoWithSource.length) unified.push(devtoWithSource[i]);
      }

      return unified;
    } catch (error) {
      console.error("Failed to fetch unified feed:", error);
      throw error;
    }
  }

  async fetchItem(id, source) {
    if (source === "devto") {
      return this.devtoAPI.fetchItem(id);
    }
    return this.hnAPI.fetchItem(id);
  }

  async fetchItems(items) {
    // items is now an array of {id, source} objects
    const promises = items.map((item) =>
      item.source === "devto"
        ? this.devtoAPI.fetchItem(item.id)
        : this.hnAPI.fetchItem(item.id),
    );
    return Promise.all(promises);
  }

  async fetchUser(id, source) {
    if (source === "devto") {
      return this.devtoAPI.fetchUser(id);
    }
    return this.hnAPI.fetchUser(id);
  }
}

// Export singleton
window.hnAPI = new APIManager();
