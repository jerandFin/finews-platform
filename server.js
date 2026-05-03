const express = require('express');
const path = require('path');
const app = express();

// 1. Middleware
app.use(express.json());

/**
 * CRITICAL FIX for image_4fe236.jpg: 
 * This middleware catches any request starting with "/public" and 
 * strips it so the server can actually find your CSS/JS files.
 */
app.use((req, res, next) => {
  if (req.url.startsWith('/public/')) {
    req.url = req.url.replace('/public/', '/');
  }
  next();
});

// 2. Static Files (Serves your css/styles.css and js/app.js)
app.use(express.static(path.join(__dirname, 'public')));

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
        messages: [{ 
          role: "user", 
          content: `Generate a 5-question multiple choice quiz about ${topics}. Return ONLY a JSON array. No conversational text.` 
        }]
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
    console.error("AI Route Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// --- PAGE ROUTES ---
// Serve HTML files from your main root directory
app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, 'quiz.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- THE SMART CATCH-ALL ---
// This regex specifically avoids files with dots (like .css, .js) 
// so the MIME type error in image_4fe236.jpg is finally resolved.
app.get(/^[^\.]*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`FinNews Server running on port ${PORT}`);
});
