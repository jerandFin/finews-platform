const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// 1. STYLE PROTECTOR: Keeps your design from breaking
app.use((req, res, next) => {
  if (req.url.startsWith('/public/')) {
    req.url = req.url.replace('/public/', '/');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// --- 2. NEWS API ROUTE ---
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

// --- 3. FIXED GEMINI QUIZ ROUTE ---
app.post("/api/quiz", async (req, res) => {
  const { topics } = req.body;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_KEY) return res.status(500).json({ error: "Gemini Key Missing" });

  try {
    const prompt = `Generate a 5-question multiple choice quiz about ${topics}. 
    Return ONLY a raw JSON array of objects with "question", "options" (4 strings), and "correctAnswer" (string). 
    No markdown, no backticks, no text before or after the JSON.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      let rawText = data.candidates[0].content.parts[0].text.trim();
      
      // FIXED LINE: Using split/join instead of regex to avoid the SyntaxError
      const cleanedJson = rawText.split('```json').join('').split('```').join('').trim();
      
      res.json(JSON.parse(cleanedJson));
    } else {
      res.status(500).json({ error: "Gemini failed to generate text" });
    }
  } catch (error) {
    console.error("Quiz Route Error:", error);
    res.status(500).json({ error: "Quiz Server Error" });
  }
});

// --- 4. PAGE ROUTES ---
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'quiz.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// --- 5. SMART CATCH-ALL ---
app.get(/^[^\.]*$/, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews running on ${PORT}`));
