// ============================================
// server.js — Updated with Quiz Logic
// ============================================

require("dotenv").config({ path: "./server/.env" });
const express = require("express");
const path = require("path"); // Add this for file paths
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public")); 

// --- FIX 1: Serve the Quiz Page ---
// This resolves "Cannot GET /quiz.html"
app.get("/quiz", (req, res) => {
  res.sendFile(path.join(__dirname, "../quiz.html"));
});

// --- FIX 2: Secure AI Route ---
// --- FIX 2: Secure AI Route ---
// This moves the Claude API call to the server to hide your API Key
app.post("/api/quiz", async (req, res) => {
  const { topics, count } = req.body;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY; 

  // The prompt is now safely stored on your server
  const prompt = `Generate exactly ${count} multiple choice quiz questions about: ${topics}.
  
  Rules:
  - Cover all selected topics evenly.
  - Mix difficulty: 30% easy, 50% medium, 20% hard.
  - Return ONLY a valid JSON array. No markdown, no backticks.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    res.json(data); 
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to generate quiz." });
  }
});
// --- Existing News Route ---
app.get("/news", async (req, res) => {
  const API_KEY = process.env.NEWS_API_KEY;
  const category = req.query.category || "business";
  const url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&apiKey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
