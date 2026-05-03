const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// Redirect middleware for /public links
app.use((req, res, next) => {
  if (req.url.startsWith('/public/')) {
    req.url = req.url.replace('/public/', '/');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// --- NEW: NEWS API ROUTE ---
// This fixes the "Fetch error" by providing the news data your app is looking for
app.get("/api/news", async (req, res) => {
  try {
    const NEWS_API_KEY = process.env.NEWS_API_KEY; // Make sure this is in Render!
    const category = req.query.category || 'business';
    
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${NEWS_API_KEY}`
    );
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("News Route Error:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// --- AI QUIZ ROUTE ---
app.post("/api/quiz", async (req, res) => {
  const { topics } = req.body;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: "API key missing" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620", 
        max_tokens: 2000,
        messages: [{ role: "user", content: `Generate a 5-question quiz about ${topics} as a JSON array.` }]
      })
    });
    const data = await response.json();
    if (data.content && data.content[0]?.text) {
        const cleanedText = data.content[0].text.replace(/```json\n?|```/g, '').trim();
        res.json(JSON.parse(cleanedText));
    } else {
        res.status(500).json({ error: "AI error" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- PAGE ROUTES ---
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'quiz.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// --- THE SMART CATCH-ALL ---
app.get(/^[^\.]*$/, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
