// ============================================
// app.js — FinNews Platform Frontend (Countdown Fix)
// ============================================

// --- STEP 1: Connect to page elements ---
const articlesGrid = document.getElementById("articles-grid");
const loadingState = document.getElementById("loading");
const errorState = document.getElementById("error");
const currentDateEl = document.getElementById("current-date");
const navButtons = document.querySelectorAll(".nav-btn");
const featuredBanner = document.getElementById("featured-banner");
const countdownEl = document.getElementById("countdown-timer"); // Ensure this ID is in your index.html

// Search bar elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");

// --- STEP 2: Display today's date ---
const today = new Date();
const formattedDate = today.toLocaleDateString("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});
if (currentDateEl) currentDateEl.textContent = formattedDate;

// --- STEP 3: Track current state ---
let currentCategory = "business";
let allArticles = [];
let timeLeft = 300; // 5 minutes in seconds
let timerId = null;

// --- STEP 4: Reading List Storage (Preserved) ---
function getSavedArticles() {
  const saved = localStorage.getItem("finnews-saved");
  return saved ? JSON.parse(saved) : [];
}
// ... (Keep your saveArticle/removeArticle/isArticleSaved functions here)

// --- STEP 5: Build Featured Banner (Preserved) ---
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
      <h2 class="featured-title">${article.title}</h2>
      <a class="featured-link" href="${article.url}" target="_blank">Read Full Story →</a>
    </div>
  `;
  featuredBanner.style.display = "block";
}

// --- STEP 6: TIMER LOGIC (NEW) ---
function startCountdown() {
  if (timerId) clearInterval(timerId); // Clear any existing timer
  timeLeft = 300; // Reset to 5:00
  
  timerId = setInterval(() => {
    timeLeft--;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    // Update the UI (B)
    if (countdownEl) {
        countdownEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    if (timeLeft <= 0) {
      fetchNews(currentCategory); // Auto-refresh when time hits 0
    }
  }, 1000);
}

// --- STEP 7: Fetch news from server (FIXED WITH TIMESTAMP) ---
async function fetchNews(category = "business") {
  currentCategory = category;
  if (loadingState) loadingState.style.display = "block";
  if (articlesGrid) articlesGrid.innerHTML = "";

  try {
    // (D) Cache-Buster for ASUS VivoBook/Render
    const response = await fetch(`/api/news?category=${category}&t=${Date.now()}`);
    const data = await response.json();

    if (loadingState) loadingState.style.display = "none";

    if (data.articles && data.articles.length > 0) {
      allArticles = data.articles;
      buildFeaturedBanner(allArticles[0]);
      allArticles.slice(1).forEach(article => {
        articlesGrid.appendChild(createArticleCard(article));
      });
      startCountdown(); // Restart the 5:00 clock after a successful fetch
    } else {
      if (errorState) errorState.style.display = "block";
    }
  } catch (error) {
    if (loadingState) loadingState.style.display = "none";
    if (errorState) errorState.style.display = "block";
    console.error("Fetch error:", error);
  }
}

// --- STEP 8: Create Article Card (Preserved Logic) ---
function createArticleCard(article, isSavedView = false) {
    // (B) Keep your original card design logic here
    const card = document.createElement("div");
    card.classList.add("article-card");
    // ... (Your original card creation code)
    return card;
}

// --- STEP 9: Navigation & Refresh Events ---
navButtons.forEach(button => {
  button.addEventListener("click", (e) => {
    if (button.getAttribute("href") === "/quiz") return;
    e.preventDefault();
    const category = button.getAttribute("data-category");
    if (category) fetchNews(category);
  });
});

// Target your "Refresh Now" button
const refreshBtn = document.getElementById('refresh-now');
if (refreshBtn) {
    refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fetchNews(currentCategory);
    });
}

// --- STEP 10: Initialize ---
if (articlesGrid) {
  fetchNews("business");
}
