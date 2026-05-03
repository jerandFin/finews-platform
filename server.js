const express = require('express');
const path = require('path');
const app = express();

// 1. Initialize middleware
app.use(express.json()); 

// Serve static assets (CSS/JS) from the public folder
app.use(express.static(path.join(__dirname, 'public'))); 

// --- AI QUIZ ROUTE ---
app.post("/api/quiz", async (req, res) => {
  const { topics } = req.body;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_KEY) {
    console.error("Error: ANTHROPIC_API_KEY is missing.");
    return res.status(500).json({ error: "Anthropic API key missing" });
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
          content: `Generate a structured 5-question multiple choice quiz about ${topics}. Return ONLY a JSON array of objects with 'question', 'options' (array of 4 strings), and 'correctAnswer' (string matching the correct option) keys. Do not include any conversational text.` 
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
        console.error("Anthropic API Error:", data);
        return res.status(response.status).json({ error: "AI API Error", details: data });
    }

    if (data.content && data.content[0] && data.content[0].text) {
        const rawText = data.content[0].text;
        // Strip Markdown code blocks to prevent JSON.parse errors
        const cleanedText = rawText.replace(/```json\n?|```/g, '').trim();

        try {
            const quizData = JSON.parse(cleanedText);
            return res.json(quizData);
        } catch (parseError) {
            console.error("JSON Parsing Error. Raw Claude Output:", rawText);
            return res.status(500).json({ error: "AI returned malformed data. Please try again." });
        }
    } else {
        return res.status(500).json({ error: "Empty or malformed AI response", raw: data });
    }
    
  } catch (error) {
    console.error("AI Route Error:", error);
    return res.status(500).json({ error: "AI failed to respond", details: error.message });
  }
});

// --- PAGE ROUTES ---

app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, 'quiz.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- THE FIX FOR RENDER PATH ERROR ---
// Use ':any*' to capture all remaining paths without using restricted regex characters
app.get('/:any*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Start the server ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
