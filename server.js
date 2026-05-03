const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// 1. THE CONSOLE & STYLE CLEANER
// Stops the 404 favicon error and serves your CSS/Fonts immediately
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// --- 2. NEWS API ROUTE (DESIGN PROTECTED) ---
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
    res.status(500).json({ error: "News service stable but headlines unavailable" });
  }
});

// --- 3. FOUNDATIONAL QUIZ ROUTE (STABLE) ---
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
app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'quiz.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 5. THE ULTIMATE CATCH-ALL ---
// Compatible with Node v24.14.1 on Render
app.get(/^((?!\.).)*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews Platform: High-Performance Mode on ${PORT}`));
