const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- 1. STRICT FILE LOCATION MAPPING ---
// Maps /public/css/styles.css and /public/js/app.js to your actual folders
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));

// Secondary shield for direct root access to assets
app.use(express.static(path.join(__dirname, 'public')));

// Stops the favicon 404 console error
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- 2. NEWS API (STABLE & PROTECTED) ---
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
    res.status(500).json({ error: "News service failed" });
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
    }
  ];
  res.json(localQuizData);
});

// --- 4. ROOT-LEVEL INDEPENDENT HTML ---
app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, 'quiz.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 5. STABILITY MIDDLEWARE (NO PathErrors) ---
app.use((req, res) => {
  if (req.path.includes('.')) {
    return res.status(404).send('Resource missing');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews: High-Performance Mode on ${PORT}`));
