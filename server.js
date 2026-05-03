const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- 1. ASSET MAPPING (STRUCTURE B) ---
// This allows your HTML to use href="/public/style.css" OR href="/css/styles.css"
// It prioritizes styles and design by making sure the files are found immediately.
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use('/public', express.static(path.join(__dirname, 'public/css'))); // Shield for the error in image_e20ac0.jpg
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
    res.status(500).json({ error: "News failed" });
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

// --- 4. ROOT-LEVEL INDEPENDENT HTML (STRUCTURE B) ---
app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, 'quiz.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 5. RENDER STABILITY MIDDLEWARE (CONDITION C) ---
// This handles any other page requests without triggering PathErrors on Render.
app.use((req, res) => {
  if (req.path.includes('.') && !req.path.endsWith('.html')) {
    return res.status(404).send('Asset not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews: Operational on port ${PORT}`));
