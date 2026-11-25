// ============================================
// app.js — FinNews Platform Frontend
// ============================================

// --- STEP 1: Connect to page elements ---
const articlesGrid = document.getElementById("articles-grid");
const loadingState = document.getElementById("loading");
const errorState = document.getElementById("error");
const currentDateEl = document.getElementById("current-date");
const navButtons = document.querySelectorAll(".nav-btn");
const featuredBanner = document.getElementById("featured-banner");
const countdownEl = document.getElementById("countdown-timer");
const lastCheckEl = document.getElementById("last-updated-text");
const refreshMessage = document.getElementById("refresh-message");
const refreshBtn = document.getElementById("refresh-now");

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const clearBtn = document.getElementById("clear-btn");

// --- STEP 2: Display today's date ---
const today = new Date();
const formattedDate = today.toLocaleDateString("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});
if (currentDateEl) currentDateEl.textContent = formattedDate;

// --- STEP 3: Track current state ---
let currentCategory = "business";
let allArticles = [];
let timerId = null;
let newsRequest = null;
let showingSampleFeed = false;

// --- STEP 4: Reading List Storage (STAYS THE SAME) ---
function getSavedArticles() {
  const saved = localStorage.getItem("finnews-saved");
  return saved ? JSON.parse(saved) : [];
}

function saveArticle(article) {
  const saved = getSavedArticles();
  if (!saved.find(a => a.url === article.url)) {
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
  return getSavedArticles().some(a => a.url === articleUrl);
}

// --- STEP 5: Build the Featured Banner (STAYS THE SAME) ---
function buildFeaturedBanner(article) {
  if (!article || !featuredBanner) {
    if (featuredBanner) featuredBanner.style.display = "none";
    return;
  }
  const imageUrl = article.urlToImage || "https://picsum.photos/seed/featured/1200/420";
  featuredBanner.innerHTML = `
    <img class="featured-image" src="${imageUrl}" alt="${article.title}" onerror="this.src='https://picsum.photos/seed/featured/1200/420'" />
    <div class="featured-overlay">
      <div class="featured-label">Top Story</div>
      <p class="featured-source">${article.source.name}</p>
      <h2 class="featured-title">${article.title}</h2>
      <p class="featured-description">${article.description || ""}</p>
      <a class="featured-link" href="${article.url}" target="_blank" rel="noopener noreferrer">Read Full Story →</a>
    </div>
  `;
  featuredBanner.style.display = "block";
}

// --- STEP 6: Automatic refresh countdown ---
function startCountdown() {
  let timeLeft = 300;
  countdownEl.textContent = "5:00";
  timerId = setInterval(() => {
    timeLeft -= 1;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = String(timeLeft % 60).padStart(2, "0");
    countdownEl.textContent = `${minutes}:${seconds}`;
    if (timeLeft === 0) fetchNews(currentCategory);
  }, 1000);
}

// --- STEP 7: Check for new headlines ---
async function fetchNews(category) {
  if (newsRequest && category === currentCategory) return;
  newsRequest?.abort();
  clearInterval(timerId);

  if (category !== currentCategory) {
    allArticles = [];
    showingSampleFeed = false;
    lastCheckEl.textContent = "Not checked yet";
  }
  currentCategory = category;

  if (allArticles.length === 0) {
    if (searchInput) searchInput.value = "";
    if (clearBtn) clearBtn.style.display = "none";
    featuredBanner.style.display = "none";
    articlesGrid.replaceChildren();
    loadingState.style.display = "block";
  }
  errorState.style.display = "none";
  refreshBtn.disabled = true;
  countdownEl.textContent = "—";
  refreshMessage.textContent = "Checking for headlines…";

  const request = new AbortController();
  newsRequest = request;
  const timeout = setTimeout(() => request.abort(), 15000);

  try {
    const query = new URLSearchParams({ category, t: Date.now() });
    const response = await fetch(`/api/news?${query}`, { signal: request.signal });
    if (!response.ok) throw new Error("News request failed");
    const data = await response.json();
    if (newsRequest !== request) return;
    if (!Array.isArray(data.articles) || data.articles.length === 0) {
      throw new Error("No headlines returned");
    }
    if (data.feedStatus === "fallback" && allArticles.length > 0 && !showingSampleFeed) {
      throw new Error("Live headlines are unavailable");
    }

    const previousUrls = new Set(allArticles.map(article => article.url));
    const newUrls = new Set(data.articles.map(article => article.url).filter(url => !previousUrls.has(url)));
    const hadLiveFeed = allArticles.length > 0 && !showingSampleFeed;

    buildFeaturedBanner(data.articles[0]);
    articlesGrid.replaceChildren(...data.articles.slice(1).map(article => createArticleCard(article)));
    allArticles = data.articles;
    showingSampleFeed = data.feedStatus === "fallback";

    if (showingSampleFeed) {
      refreshMessage.textContent = "Live headlines unavailable. Showing sample headlines.";
      return;
    }

    const checkedAt = new Date().toLocaleTimeString([], {
      hour: "numeric", minute: "2-digit", second: "2-digit"
    });
    lastCheckEl.textContent = `Last checked: ${checkedAt}`;
    if (!hadLiveFeed) {
      refreshMessage.textContent = "Headlines loaded.";
    } else if (newUrls.size === 0) {
      refreshMessage.textContent = "No new headlines.";
    } else {
      refreshMessage.textContent = `${newUrls.size} new ${newUrls.size === 1 ? "headline" : "headlines"}.`;
    }
  } catch {
    if (newsRequest !== request) return;
    if (allArticles.length === 0) errorState.style.display = "block";
    refreshMessage.textContent = allArticles.length > 0
      ? "Refresh failed. Showing previous headlines."
      : "Could not load headlines.";
  } finally {
    clearTimeout(timeout);
    if (newsRequest === request) {
      newsRequest = null;
      loadingState.style.display = "none";
      refreshBtn.disabled = false;
      startCountdown();
    }
  }
}

// --- STEP 8: Article Card UI (STAYS THE SAME) ---
function createArticleCard(article, isSavedView = false) {
  const card = document.createElement("div");
  card.classList.add("article-card");

  const imageUrl = article.urlToImage || "https://picsum.photos/seed/default/400/200";
  const alreadySaved = isArticleSaved(article.url);
  const actionButton = isSavedView
    ? `<button class="remove-btn" data-url="${article.url}">✕ Remove</button>`
    : `<button class="bookmark-btn ${alreadySaved ? "saved" : ""}" data-url="${article.url}">${alreadySaved ? "✓ Saved" : "Save"}</button>`;

  card.innerHTML = `
    <img class="article-image" src="${imageUrl}" />
    <div class="article-body">
      <p class="article-source">${article.source.name}</p>
      <h2 class="article-title">${article.title}</h2>
      <div class="article-footer">
        <div style="display:flex; gap:8px;">
          ${actionButton}
          <a class="article-link" href="${article.url}" target="_blank">Read More →</a>
        </div>
      </div>
    </div>
  `;

  const btnElement = card.querySelector(isSavedView ? ".remove-btn" : ".bookmark-btn");
  if (btnElement) {
    btnElement.addEventListener("click", () => {
      if (isSavedView) {
        removeArticle(article.url);
        displayReadingList();
      } else {
        if (isArticleSaved(article.url)) {
          removeArticle(article.url);
          btnElement.textContent = "Save";
          btnElement.classList.remove("saved");
        } else {
          saveArticle(article);
          btnElement.textContent = "✓ Saved";
          btnElement.classList.add("saved");
        }
      }
    });
  }
  return card;
}

// --- STEP 9: Navigation & Refresh Logic ---
navButtons.forEach(button => {
  button.addEventListener("click", (e) => {
    if (button.getAttribute("href") === "/quiz") return;
    e.preventDefault();
    navButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    const category = button.getAttribute("data-category");
    if (category === "saved") {
      newsRequest?.abort();
      newsRequest = null;
      clearInterval(timerId);
      currentCategory = "saved";
      refreshBtn.disabled = true;
      countdownEl.textContent = "paused";
      refreshMessage.textContent = "";
      lastCheckEl.textContent = "Reading list";
      loadingState.style.display = "none";
      errorState.style.display = "none";
      displayReadingList();
    } else if (category) {
      fetchNews(category);
    }
  });
});

refreshBtn.addEventListener("click", () => fetchNews(currentCategory));

function displayReadingList() {
  if (!articlesGrid) return;
  articlesGrid.innerHTML = "";
  if (featuredBanner) featuredBanner.style.display = "none";
  const saved = getSavedArticles();
  if (saved.length === 0) {
    articlesGrid.innerHTML = `<div class="empty-list"><h3>No saved articles</h3></div>`;
    return;
  }
  saved.forEach(article => articlesGrid.appendChild(createArticleCard(article, true)));
}

// --- STEP 10: Initialize ---
if (articlesGrid) fetchNews("business");
