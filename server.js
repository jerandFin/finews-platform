const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- 1. DIRECTORY & STYLE PRIORITIZATION ---
// This handles your specific structure: /public/css/styles.css and /public/js/app.js
// We map the '/public' URL path directly to your 'public' folder.
app.use('/public', express.static(path.join(__dirname, 'public')));

// This acts as a secondary shield to ensure styles load even if the '/public' prefix is missing
app.use(express.static(path.join(__dirname, 'public')));

// Stops the favicon 404 error from cluttering your console
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- 2. NEWS API ROUTE (DESIGN CRITICAL) ---
app.get("/api/news", async (req, res) => {
  try {
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    const category = req.query.category || 'business';
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${NEWS_API_KEY}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "News service is online but headlines failed to fetch." });
  }
});

// --- 3. FOUNDATIONAL QUIZ ROUTE ---
app.post("/api/quiz", (req, res) => {
  const localQuizData = [
    {
      question: "What does the 'Law of Demand' suggest?",
      options: ["Price up, Demand up", "Price up, Demand down", "Supply equals Demand", "Price has no effect"],
      correctAnswer: "Price up, Demand down"
    },
    {
      question: "Which organization regulates global trade?",
      options: ["WHO", "IMF", "WTO", "The World Bank"],
      correctAnswer: "WTO"
    },
    {
      question: "In finance, what does 'ROI' stand for?",
      options: ["Rate of Inflation", "Return on Investment", "Risk of Interest", "Revenue on Income"],
      correctAnswer: "Return on Investment"
    }
  ];
  res.json(localQuizData);
});

// --- 4. ROOT-LEVEL HTML ROUTES ---
// Since your HTML files are in the main root, we point to them directly.
app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, 'quiz.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 5. THE "SAFE-ROUTE" CATCH-ALL ---
// We use a middleware function instead of a wildcard '*' to avoid Render's PathErrors.
app.use((req, res) => {
  // If the request is for a file (like .css or .js) but wasn't found in Step 1
  if (req.path.includes('.')) {
    return res.status(404).send('Resource not found');
  }
  // For any other page navigation, default to the root index.html
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews Platform: Operational on port ${PORT}`));
