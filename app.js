const feed = document.getElementById("feed");
const feedStatus = document.getElementById("feedStatus");
const scrollSentinel = document.getElementById("scrollSentinel");
const themeCycleBtn = document.getElementById("themeCycleBtn");
const themeButtons = Array.from(document.querySelectorAll(".theme-btn"));
const cardTemplate = document.getElementById("cardTemplate");

const HN_TOP_URL = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item/";
const DEVTO_URL = "https://dev.to/api/articles?top=7&per_page=6";
const THEME_KEY = "hnkit-theme";
const HN_BATCH = 6;

const state = {
  hnIds: [],
  hnCursor: 0,
  devtoPage: 1,
  isLoading: false,
  items: [],
};

const formatPoints = (points) => `${points ?? 0} pts`;
const formatComments = (count) => `${count ?? 0} comments`;
const formatReadingTime = (minutes) => `${minutes ?? 1} min`;

const computeTrendScore = (item, now) => {
  const ageHours = Math.max(0, (now - item.time) / 36e5);
  const engagement = Math.max(0, item.engagement ?? 0);
  const freshness = 1 / (1 + ageHours / 6);
  return Math.log10(engagement + 1) * 2 + freshness * 3;
};

const setStatus = (text) => {
  feedStatus.textContent = text;
};

const clearFeed = (feed) => {
  feed.innerHTML = "";
};

const createCard = ({ source, title, subtitle, meta, url, delay }) => {
  const card = cardTemplate.content.cloneNode(true);
  const cardRoot = card.querySelector(".card");
  const sourceEl = card.querySelector(".card-source");
  const titleEl = card.querySelector(".card-title");
  const subtitleEl = card.querySelector(".card-subtitle");
  const metaEl = card.querySelector(".pill.soft");

  cardRoot.style.animationDelay = `${delay}ms`;
  sourceEl.textContent = source;
  titleEl.textContent = title;
  subtitleEl.textContent = subtitle;
  metaEl.textContent = meta;
  cardRoot.href = url;

  return card;
};

const renderFeed = (items, { append = false } = {}) => {
  if (!append) {
    clearFeed(feed);
  }
  const offset = append ? feed.children.length : 0;
  items.forEach((item, index) => {
    feed.appendChild(createCard({ ...item, delay: 40 * (offset + index) }));
  });
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

const ensureHnIds = async () => {
  if (state.hnIds.length > 0) {
    return;
  }
  state.hnIds = await fetchJson(HN_TOP_URL);
};

const loadHackerNewsBatch = async () => {
  await ensureHnIds();
  const slice = state.hnIds.slice(state.hnCursor, state.hnCursor + HN_BATCH);
  state.hnCursor += slice.length;
  if (slice.length === 0) {
    return [];
  }
  const items = await Promise.all(
    slice.map(async (id) => {
      const item = await fetchJson(`${HN_ITEM_URL}${id}.json`);
      return {
        source: "HN",
        title: item.title,
        subtitle: item.by ? `by ${item.by}` : "",
        meta: `${formatPoints(item.score)} - ${formatComments(item.descendants)}`,
        url: item.url || `https://news.ycombinator.com/item?id=${id}`,
        time: item.time ? item.time * 1000 : Date.now(),
        engagement: (item.score ?? 0) + (item.descendants ?? 0) * 0.5,
      };
    }),
  );
  return items;
};

const loadDevtoBatch = async () => {
  const articles = await fetchJson(`${DEVTO_URL}&page=${state.devtoPage}`);
  state.devtoPage += 1;
  return articles.map((article) => ({
    source: "DEV",
    title: article.title,
    subtitle: article.user?.name ? `by ${article.user.name}` : "",
    meta: `${formatReadingTime(article.reading_time_minutes)} - ${article.public_reactions_count ?? 0} reactions`,
    url: article.url,
    time: article.published_timestamp
      ? Date.parse(article.published_timestamp)
      : Date.now(),
    engagement:
      (article.public_reactions_count ?? 0) +
      (article.comments_count ?? 0) * 0.6,
  }));
};

const loadNextPage = async () => {
  if (state.isLoading) {
    return;
  }
  state.isLoading = true;
  setStatus("Updating...");
  try {
    const [hnItems, devtoItems] = await Promise.all([
      loadHackerNewsBatch(),
      loadDevtoBatch(),
    ]);
    if (hnItems.length === 0 && devtoItems.length === 0) {
      setStatus("End of feed");
      observer.disconnect();
      return;
    }
    const now = Date.now();
    const merged = [...hnItems, ...devtoItems]
      .map((item) => ({
        ...item,
        trendScore: computeTrendScore(item, now),
      }))
      .sort((a, b) => b.trendScore - a.trendScore || b.time - a.time);
    state.items = state.items.concat(merged);
    renderFeed(merged, { append: true });
    setStatus("Updated just now");
  } catch (error) {
    setStatus("Network error");
  } finally {
    state.isLoading = false;
  }
};

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  themeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
  localStorage.setItem(THEME_KEY, theme);
  if (themeCycleBtn) {
    const label = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "OLED";
    themeCycleBtn.textContent = label;
  }
};

const initTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  setTheme(saved || "dark");
};

themeButtons.forEach((btn) => {
  btn.addEventListener("click", () => setTheme(btn.dataset.theme));
});

if (themeCycleBtn) {
  const order = ["dark", "light", "oled"];
  themeCycleBtn.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "dark";
    const index = order.indexOf(current);
    const next = order[(index + 1) % order.length];
    setTheme(next);
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      loadNextPage();
    }
  },
  { rootMargin: "260px" },
);

initTheme();
observer.observe(scrollSentinel);
loadNextPage();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}
