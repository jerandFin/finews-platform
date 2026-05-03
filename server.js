const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// 1. STYLE & STATIC PROTECTOR
// We explicitly tell the server to look in 'public' for any folder-based requests first.
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. NEWS API ROUTE (STAYS WORKING) ---
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
    },
    {
      question: "What is 'Inflation'?",
      options: ["The rise in purchasing power", "The fall in general price levels", "The rise in general price levels", "The growth of the stock market"],
      correctAnswer: "The rise in general price levels"
    },
    {
      question: "In finance, what does 'ROI' stand for?",
      options: ["Rate of Inflation", "Return on Investment", "Risk of Interest", "Revenue on Income"],
      correctAnswer: "Return on Investment"
    },
    {
      question: "Which of these is a 'Fixed Cost' for a business?",
      options: ["Raw materials", "Hourly wages", "Monthly rent", "Shipping fees"],
      correctAnswer: "Monthly rent"
    }
  ];
  res.json(localQuizData);
});

// --- 4. PAGE ROUTES ---
// We use path.join to ensure we are pointing directly to the files in public
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'public', 'quiz.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// --- 5. SMART CATCH-ALL ---
// This is updated to prevent it from accidentally catching .css or .js files
app.get('*', (req, res) => {
  if (req.path.includes('.')) {
    res.status(404).send('File not found');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews Platform: Stable Local Mode on ${PORT}`));
