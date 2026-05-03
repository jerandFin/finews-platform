const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// 1. STYLE & JS PROTECTOR (PATH-SPECIFIC)
// This correctly maps your subfolders: public/css and public/js
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
// General fallback for any other assets in public
app.use(express.static(path.join(__dirname, 'public')));

// Stops the favicon 404 in the console
app.get('/favicon.ico', (req, res) => res.status(204).end());

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
    res.status(500).json({ error: "News failed" });
  }
});

// --- 3. QUIZ ROUTE (STABLE) ---
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

// --- 4. ROOT-LEVEL PAGE ROUTES ---
// Pointing directly to the root directory as per your structure
app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, 'quiz.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 5. MODERN CATCH-ALL (STABILITY FIX) ---
// Redirects any other page requests to index.html in the root
app.get(/^((?!\.).)*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews Platform: Root Mode Active on ${PORT}`));
