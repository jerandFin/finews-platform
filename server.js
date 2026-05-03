const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// 1. STYLE & DESIGN PROTECTION
// This serves all files in 'public' (CSS, JS, Fonts) with absolute priority.
// It prevents the MIME type "text/html" error by finding the real files first.
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// --- 2. NEWS API ROUTE (STABLE) ---
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
    res.status(500).json({ error: "News service unavailable" });
  }
});

// --- 3. QUIZ ROUTE (STABLE & LOCAL) ---
// This uses your foundational local data to avoid AI-generation 500 errors.
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

// --- 4. EXPLICIT PAGE ROUTES ---
// We use direct paths instead of wildcards to stop the Render PathError crash.
app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'quiz.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 5. THE ULTIMATE STABILITY CATCH-ALL ---
// If the path doesn't match anything above, we return the index.html.
// We use a simple regex that is compatible with all Node versions.
app.get(/^((?!\.).)*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews Platform: Operational on port ${PORT}`));
