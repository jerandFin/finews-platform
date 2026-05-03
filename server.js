const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// 1. THE REDIRECT FIX: Keeps your styles and design from breaking
app.use((req, res, next) => {
  if (req.url.startsWith('/public/')) {
    req.url = req.url.replace('/public/', '/');
  }
  next();
});

// 2. STATIC FILES: Serves your CSS and JS folders
app.use(express.static(path.join(__dirname, 'public')));

// --- 3. NEWS API ROUTE (KEEPING THIS WORKING) ---
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

// --- 4. ULTIMATE AI QUIZ ROUTE FIX ---
app.post("/api/quiz", async (req, res) => {
  const { topics } = req.body;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_KEY) {
    console.error("CRITICAL: ANTHROPIC_API_KEY is missing in Render environment.");
    return res.status(500).json({ error: "Server Configuration Error: Key Missing" });
  }

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
        messages: [{ 
          role: "user", 
          content: `Generate a 5-question multiple choice quiz about ${topics}. 
          Return ONLY a JSON array of objects with 'question', 'options' (4 strings), and 'correctAnswer' (string). 
          No conversational text, no backticks, no markdown.` 
        }]
      })
    });

    const data = await response.json();

    // Log error if Anthropic rejects the request
    if (!response.ok) {
        console.error("Anthropic API Error Details:", data);
        return res.status(response.status).json({ error: "AI Service Error", details: data });
    }

    if (data.content && data.content[0]?.text) {
        let rawText = data.content[0].text.trim();
        
        // Advanced cleaning: Removes markdown code blocks if Claude adds them anyway
        const cleanedText = rawText.replace(/```json|```/g, "").trim();

        try {
            const quizData = JSON.parse(cleanedText);
            return res.json(quizData);
        } catch (parseErr) {
            console.error("JSON Parse Error. Raw output was:", rawText);
            return res.status(500).json({ error: "AI returned unreadable data format." });
        }
    } else {
        return res.status(500).json({ error: "Empty response from AI" });
    }
  } catch (error) {
    console.error("Quiz Route Crash:", error);
    res.status(500).json({ error: "Server-side crash in Quiz Route" });
  }
});

// --- 5. PAGE ROUTES ---
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'quiz.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// --- 6. SMART CATCH-ALL: Prevents MIME type errors for assets ---
app.get(/^[^\.]*$/, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews Server running on port ${PORT}`));
