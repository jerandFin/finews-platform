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

// Search bar elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const clearBtn = document.getElementById("clear-btn");

// --- STEP 2: Display today's date ---
const today = new Date();
const formattedDate = today.toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
});
if (currentDateEl) currentDateEl.textContent = formattedDate;

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

// --- STEP 5: Build the Featured Banner ---
function buildFeaturedBanner(article) {
  if (!article || !featuredBanner) {
    if (featuredBanner) featuredBanner.style.display = "none";
    return;
  }

  const imageUrl = article.urlToImage || "https://picsum.photos/seed/featured/1200/420";
  const description = article.description || "Click to read the full story.";

  featuredBanner.innerHTML = `
    <img class="featured-image" src="${imageUrl}" alt="${article.title}" onerror="this.src='https://picsum.photos/seed/featured/1200/420'" />
    <div class="featured-overlay">
      <div class="featured-label">Top Story</div>
      <p class="featured-source">${article.source.name}</p>
      <h2 class="featured-title">${article.title}</h2>
      <p class="featured-description">${description}</p>
      <a class="featured-link" href="${article.url}" target="_blank" rel="noopener noreferrer">Read Full Story →</a>
    </div>
  `;
  featuredBanner.style.display = "block";
}

// --- STEP 6: Fetch news from server ---
async function fetchNews(category = "business") {
  currentCategory = category;
  if (searchInput) searchInput.value = "";
  if (clearBtn) clearBtn.style.display = "none";
  if (featuredBanner) featuredBanner.style.display = "none";

  if (loadingState) loadingState.style.display = "block";
  if (errorState) errorState.style.display = "none";
  if (articlesGrid) articlesGrid.innerHTML = "";

  try {
    // FIX: Using absolute path '/news' instead of relative 'news'
    // This ensures it works whether you are at / or /quiz
    const response = await fetch(`/news?category=${category}`);
    const data = await response.json();

    if (loadingState) loadingState.style.display = "none";

    // Standardized check for data.articles existence
    if (data.articles && data.articles.length > 0) {
      allArticles = data.articles;
      buildFeaturedBanner(allArticles[0]);
      allArticles.slice(1).forEach(article => {
        const card = createArticleCard(article);
        articlesGrid.appendChild(card);
      });
    } else {
      if (errorState) errorState.style.display = "block";
    }
  } catch (error) {
    if (loadingState) loadingState.style.display = "none";
    if (errorState) errorState.style.display = "block";
    console.error("Fetch error:", error);
  }
}

// --- STEP 7: Article Card UI ---
function createArticleCard(article, isSavedView = false) {
  const card = document.createElement("div");
  card.classList.add("article-card");

  const publishDate = new Date(article.publishedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  const imageUrl = article.urlToImage || "https://picsum.photos/seed/default/400/200";
  const alreadySaved = isArticleSaved(article.url);

  const actionButton = isSavedView
    ? `<button class="remove-btn" data-url="${article.url}">✕ Remove</button>`
    : `<button class="bookmark-btn ${alreadySaved ? "saved" : ""}" data-url="${article.url}">${alreadySaved ? "✓ Saved" : "Save"}</button>`;

  card.innerHTML = `
    <img class="article-image" src="${imageUrl}" onerror="this.src='https://picsum.photos/seed/fallback/400/200'" />
    <div class="article-body">
      <p class="article-source">${article.source.name}</p>
      <h2 class="article-title">${article.title}</h2>
      <p class="article-description">${article.description || ""}</p>
      <div class="article-footer">
        <span class="article-date">${publishDate}</span>
        <div style="display:flex; gap:8px; align-items:center;">
          ${actionButton}
          <a class="article-link" href="${article.url}" target="_blank">Read More →</a>
        </div>
      </div>
    </div>
  `;

  const btnClass = isSavedView ? ".remove-btn" : ".bookmark-btn";
  const btnElement = card.querySelector(btnClass);
  
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

// --- STEP 8: Navigation Logic ---
navButtons.forEach(button => {
  button.addEventListener("click", (e) => {
    // Check if it's the Quiz link or button
    if (button.getAttribute("href") === "/quiz" || button.classList.contains("quiz-nav-btn")) {
      return; // Let the browser handle the navigation to the quiz page
    }

    e.preventDefault();
    navButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    
    const category = button.getAttribute("data-category");
    if (category === "saved") {
      displayReadingList();
    } else if (category) {
      fetchNews(category);
    }
  });
});

function displayReadingList() {
  if (!articlesGrid) return;
  articlesGrid.innerHTML = "";
  if (featuredBanner) featuredBanner.style.display = "none";
  const saved = getSavedArticles();

  if (saved.length === 0) {
    articlesGrid.innerHTML = `<div class="empty-list" style="grid-column: 1/-1; text-align:center; padding: 50px;"><h3>No saved articles</h3><p>Click "Save" on news items to see them here.</p></div>`;
    return;
  }
  saved.forEach(article => articlesGrid.appendChild(createArticleCard(article, true)));
}

// --- STEP 9: Initialize ---
// Only fetch news if we are on the main news grid page
if (articlesGrid) {
  fetchNews("business");
}

// --- STEP 10: Search Support ---
if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
        const keyword = searchInput.value.trim().toLowerCase();
        if (!keyword) return;
        
        const results = allArticles.filter(a => 
          a.title.toLowerCase().includes(keyword) || 
          (a.description && a.description.toLowerCase().includes(keyword))
        );

        articlesGrid.innerHTML = "";
        if (featuredBanner) featuredBanner.style.display = "none";

        if (results.length === 0) {
          articlesGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center;">No results found for "${keyword}"</p>`;
        } else {
          results.forEach(a => articlesGrid.appendChild(createArticleCard(a)));
        }
    });
}
