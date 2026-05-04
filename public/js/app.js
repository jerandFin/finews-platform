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
const countdownEl = document.getElementById("countdown-timer"); // The countdown span

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
let timeLeft = 300; // 5 minutes
let timerId = null;

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

// --- STEP 6: TIMER LOGIC (THE FIX) ---
function startCountdown() {
  if (timerId) clearInterval(timerId); 
  timeLeft = 300; 
  
  timerId = setInterval(() => {
    timeLeft--;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    if (countdownEl) {
        countdownEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    if (timeLeft <= 0) {
      fetchNews(currentCategory); 
    }
  }, 1000);
}

// --- STEP 7: Fetch news from server (FIXED WITH TIMESTAMP) ---
async function fetchNews(category = "business") {
  currentCategory = category;
  if (searchInput) searchInput.value = "";
  if (clearBtn) clearBtn.style.display = "none";
  if (featuredBanner) featuredBanner.style.display = "none";

  if (loadingState) loadingState.style.display = "block";
  if (errorState) errorState.style.display = "none";
  if (articlesGrid) articlesGrid.innerHTML = "";

  try {
    const response = await fetch(`/api/news?category=${category}&t=${Date.now()}`);
    const data = await response.json();

    if (loadingState) loadingState.style.display = "none";

    if (data.articles && data.articles.length > 0) {
      allArticles = data.articles;
      buildFeaturedBanner(allArticles[0]);
      allArticles.slice(1).forEach(article => {
        articlesGrid.appendChild(createArticleCard(article));
      });
      startCountdown(); // Reset clock after news arrives
    } else {
      if (errorState) errorState.style.display = "block";
    }
  } catch (error) {
    if (loadingState) loadingState.style.display = "none";
    if (errorState) errorState.style.display = "block";
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
    if (category === "saved") displayReadingList();
    else if (category) fetchNews(category);
  });
});

const refreshBtn = document.getElementById('refresh-now');
if (refreshBtn) {
    refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fetchNews(currentCategory);
    });
}

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
