const express = require('express');
const path = require('path');
const app = express();

// 1. Initialize middleware
app.use(express.json()); // Essential to read 'topics' from your quiz page
app.use(express.static(path.join(__dirname, 'public'))); // Serves your HTML/CSS

// --- AI QUIZ ROUTE ---
app.post("/api/quiz", async (req, res) => {
  const { topics } = req.body;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_KEY) {
    console.error("Error: ANTHROPIC_API_KEY is missing from environment variables.");
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
    
    // Log the data to Render console for debugging
    console.log("AI Response Data:", JSON.stringify(data));
    
    // Send back the specific content block
    if (data.content && data.content[0] && data.content[0].text) {
        res.json(JSON.parse(data.content[0].text));
    } else {
        res.status(500).json({ error: "Empty or malformed AI response", raw: data });
    }
    
  } catch (error) {
    console.error("AI Route Error:", error);
    res.status(500).json({ error: "AI failed to respond" });
  }
});

// 2. Set the port and start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
