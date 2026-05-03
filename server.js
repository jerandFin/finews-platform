const express = require('express');
const path = require('path');
const app = express();

app.use(express.json()); 

// 1. Matches your structure: public/css/styles.css and public/js/app.js
app.use(express.static(path.join(__dirname, 'public'))); 

// --- AI QUIZ ROUTE ---
app.post("/api/quiz", async (req, res) => {
  const { topics } = req.body;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_KEY) return res.status(500).json({ error: "Key missing" });

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
          content: `Generate a 5-question multiple choice quiz about ${topics}. Return ONLY a JSON array of objects. No conversational text.` 
        }]
      })
    });

    const data = await response.json();
    if (data.content && data.content[0]?.text) {
        // Strips any potential markdown formatting from the AI
        const cleanedText = data.content[0].text.replace(/```json\n?|```/g, '').trim();
        res.json(JSON.parse(cleanedText));
    } else {
        res.status(500).json({ error: "AI response malformed" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error during AI call" });
  }
});

// --- PAGE ROUTES (Matches root location for .html files) ---
app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, 'quiz.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- THE SMART CATCH-ALL (Fixes Render PathError & SyntaxError) ---
// This regex specifically ignores any request that looks like a file (contains a dot)
app.get(/^[^\.]*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
