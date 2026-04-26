// ============================================
// app.js — FinNews Platform Brain
// Now includes:
// - Reading List / Bookmark feature
// - Search Bar feature
// - Featured Headline Banner
// ============================================


// --- STEP 1: Connect to page elements ---

const articlesGrid = document.getElementById("articles-grid");
const loadingState = document.getElementById("loading");
const errorState = document.getElementById("error");
const currentDateEl = document.getElementById("current-date");
const navButtons = document.querySelectorAll(".nav-btn");
const featuredBanner = document.getElementById("featured-banner");

// Search bar elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const clearBtn = document.getElementById("clear-btn");


// --- STEP 2: Display today's date in header ---

const today = new Date();
const formattedDate = today.toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
});
currentDateEl.textContent = formattedDate;


// --- STEP 3: Track current state ---

let currentCategory = "business";
let allArticles = [];


// --- STEP 4: Reading List Storage ---

function getSavedArticles() {
  const saved = localStorage.getItem("finnews-saved");
  return saved ? JSON.parse(saved) : [];
}

function saveArticle(article) {
  const saved = getSavedArticles();
  const alreadySaved = saved.find(a => a.url === article.url);
  if (!alreadySaved) {
    saved.push(article);
    localStorage.setItem("finnews-saved", JSON.stringify(saved));
  }
}

function removeArticle(articleUrl) {
  const saved = getSavedArticles();
  const updated = saved.filter(a => a.url !== articleUrl);
  localStorage.setItem("finnews-saved", JSON.stringify(updated));
}

function isArticleSaved(articleUrl) {
  const saved = getSavedArticles();
  return saved.some(a => a.url === articleUrl);
}


// --- STEP 5: Build the Featured Banner ---

function buildFeaturedBanner(article) {

  if (!article) {
    featuredBanner.style.display = "none";
    return;
  }

  const imageUrl = article.urlToImage ||
    "https://picsum.photos/seed/featured/1200/420";

  const description = article.description ||
    "Click to read the full story.";

  featuredBanner.innerHTML = `

    <img
      class="featured-image"
      src="${imageUrl}"
      alt="${article.title}"
      onerror="this.src='https://picsum.photos/seed/featured/1200/420'"
    />

    <div class="featured-overlay">

      <div class="featured-label">Top Story</div>

      <p class="featured-source">${article.source.name}</p>

      <h2 class="featured-title">${article.title}</h2>

      <p class="featured-description">${description}</p>

      <a
        class="featured-link"
        href="${article.url}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Read Full Story →
      </a>

    </div>
  `;

  featuredBanner.style.display = "block";
}


// --- STEP 6: Fetch news from your server ---

async function fetchNews(category = "business") {

  currentCategory = category;
  searchInput.value = "";
  clearBtn.style.display = "none";

  featuredBanner.style.display = "none";

  if (!window.isAutoRefreshing) loadingState.style.display = "block";
  errorState.style.display = "none";
  if (!window.isAutoRefreshing) articlesGrid.innerHTML = "";

  try {
    const response = await fetch(`/news?category=${category}`);
    const data = await response.json();

    loadingState.style.display = "none";

    if (data.status === "ok" && data.articles.length > 0) {

      allArticles = data.articles;

      buildFeaturedBanner(allArticles[0]);

      allArticles.slice(1).forEach(article => {
        const card = createArticleCard(article);
        articlesGrid.appendChild(card);
      });

    } else {
      featuredBanner.style.display = "none";
      errorState.style.display = "block";
    }

  } catch (error) {
    loadingState.style.display = "none";
    featuredBanner.style.display = "none";
    errorState.style.display = "block";
    console.error("Failed to fetch news:", error);
  }
}


// --- STEP 7: Search Logic ---

function searchArticles() {

  const keyword = searchInput.value.trim().toLowerCase();
  if (!keyword) return;

  featuredBanner.style.display = "none";

  clearBtn.style.display = "inline-block";
  articlesGrid.innerHTML = "";
  loadingState.style.display = "none";
  errorState.style.display = "none";

  const results = allArticles.filter(article => {
    const titleMatch = article.title
      .toLowerCase()
      .includes(keyword);
    const descriptionMatch = article.description
      ? article.description.toLowerCase().includes(keyword)
      : false;
    return titleMatch || descriptionMatch;
  });

  if (results.length > 0) {
    const label = document.createElement("p");
    label.classList.add("search-label");
    label.innerHTML = `
      Found <span>${results.length} article${results.length > 1 ? "s" : ""}</span>
      matching <span>"${searchInput.value.trim()}"</span>
    `;
    articlesGrid.appendChild(label);

    results.forEach(article => {
      const card = createArticleCard(article);
      articlesGrid.appendChild(card);
    });

  } else {
    articlesGrid.innerHTML = `
      <div class="empty-list">
        <h3>No Results Found</h3>
        <p>No articles matched <strong>"${searchInput.value.trim()}"</strong>
        <br>Try a different keyword.</p>
      </div>
    `;
  }
}


// --- STEP 8: Clear Search ---

function clearSearch() {
  searchInput.value = "";
  clearBtn.style.display = "none";
  fetchNews(currentCategory);
}


// --- STEP 9: Search button events ---

searchBtn.addEventListener("click", searchArticles);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchArticles();
  }
});

clearBtn.addEventListener("click", clearSearch);


// --- STEP 10: Display the Reading List ---

function displayReadingList() {
  articlesGrid.innerHTML = "";
  loadingState.style.display = "none";
  errorState.style.display = "none";
  searchInput.value = "";
  clearBtn.style.display = "none";

  featuredBanner.style.display = "none";

  const saved = getSavedArticles();

  if (saved.length === 0) {
    articlesGrid.innerHTML = `
      <div class="empty-list">
        <h3>Your Reading List is Empty</h3>
        <p>Click the "Save" button on any article<br>
        to add it to your reading list.</p>
      </div>
    `;
    return;
  }

  saved.forEach(article => {
    const card = createArticleCard(article, true);
    articlesGrid.appendChild(card);
  });
}


// --- STEP 11: Build an article card ---

function createArticleCard(article, isSavedView = false) {

  const card = document.createElement("div");
  card.classList.add("article-card");

  const publishDate = new Date(article.publishedAt);
  const formattedPublishDate = publishDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const imageUrl = article.urlToImage ||
    "https://picsum.photos/seed/default/400/200";

  const description = article.description ||
    "Click to read the full article.";

  const alreadySaved = isArticleSaved(article.url);

  const actionButton = isSavedView
    ? `<button class="remove-btn" data-url="${article.url}">
        ✕ Remove
       </button>`
    : `<button class="bookmark-btn ${alreadySaved ? "saved" : ""}"
        data-url="${article.url}">
        ${alreadySaved ? "✓ Saved" : "Save"}
       </button>`;

  card.innerHTML = `
    <img
      class="article-image"
      src="${imageUrl}"
      alt="${article.title}"
      onerror="this.src='https://picsum.photos/seed/fallback/400/200'"
    />
    <div class="article-body">
      <p class="article-source">${article.source.name}</p>
      <h2 class="article-title">${article.title}</h2>
      <p class="article-description">${description}</p>
      <div class="article-footer">
        <span class="article-date">${formattedPublishDate}</span>
        <div style="display:flex; gap:8px; align-items:center;">
          ${actionButton}
          <a
            class="article-link"
            href="${article.url}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read More →
          </a>
        </div>
      </div>
    </div>
  `;

  if (isSavedView) {
    card.querySelector(".remove-btn").addEventListener("click", () => {
      removeArticle(article.url);
      displayReadingList();
    });
  } else {
    const bookmarkBtn = card.querySelector(".bookmark-btn");
    bookmarkBtn.addEventListener("click", () => {
      if (isArticleSaved(article.url)) {
        removeArticle(article.url);
        bookmarkBtn.textContent = "Save";
        bookmarkBtn.classList.remove("saved");
      } else {
        saveArticle(article);
        bookmarkBtn.textContent = "✓ Saved";
        bookmarkBtn.classList.add("saved");
      }
    });
  }

  return card;
}


// --- STEP 12: Make navigation buttons work ---

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    navButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    const category = button.getAttribute("data-category");
    if (category === "saved") {
      displayReadingList();
    } else {
      fetchNews(category);
    }
  });
});


// --- STEP 13: Load business news on startup ---

fetchNews("business");


// ════════════════════════════════════════
//   AUTO REFRESH MODULE
// ════════════════════════════════════════

const AutoRefresh = (() => {

  const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
  const COUNTDOWN_TICK_MS   = 1000;

  let refreshTimer   = null;
  let countdownTimer = null;
  let secondsLeft    = REFRESH_INTERVAL_MS / 1000;

  const lastUpdatedEl = document.getElementById('last-updated-text');
  const nextRefreshEl = document.getElementById('next-refresh-text');
  const refreshBtn    = document.getElementById('manual-refresh-btn');
  const refreshIcon   = document.getElementById('refresh-icon');

  function formatCountdown(seconds) {
    const m = Math.floor(seconds / 60).toString();
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateLastUpdatedText() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    lastUpdatedEl.textContent = `Last updated: ${timeStr}`;
  }

  function resetCountdown() {
    secondsLeft = REFRESH_INTERVAL_MS / 1000;
    nextRefreshEl.textContent = `Refreshing in ${formatCountdown(secondsLeft)}`;
  }

  function tickCountdown() {
    if (secondsLeft > 0) secondsLeft--;
    nextRefreshEl.textContent = `Refreshing in ${formatCountdown(secondsLeft)}`;
  }

  function showSpinning() {
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;
  }

  function stopSpinning() {
    refreshIcon.classList.remove('spinning');
    refreshBtn.disabled = false;
  }

  async function doRefresh() {
    showSpinning();
    try {
      window.isAutoRefreshing = true;
      await fetchNews(currentCategory);
      window.isAutoRefreshing = false;
      updateLastUpdatedText();
      resetCountdown();
      highlightNewArticles();
    } catch (error) {
      console.warn('Refresh failed quietly:', error);
    } finally {
      stopSpinning();
    }
  }

  function highlightNewArticles() {
    const cards = document.querySelectorAll('.article-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.remove('new-article');
        void card.offsetWidth;
        card.classList.add('new-article');
      }, index * 40);
    });
  }

  function start() {
    stop();
    refreshTimer   = setInterval(doRefresh, REFRESH_INTERVAL_MS);
    countdownTimer = setInterval(tickCountdown, COUNTDOWN_TICK_MS);
    updateLastUpdatedText();
    resetCountdown();
  }

  function stop() {
    clearInterval(refreshTimer);
    clearInterval(countdownTimer);
  }

  refreshBtn.addEventListener('click', async () => {
    stop();
    await doRefresh();
    start();
  });

  return { start, stop, doRefresh };

})();

AutoRefresh.start();
