// ============================================
// server.js — Optimized for Render Deployment
// ============================================

require("dotenv").config(); // Looks for .env in the root folder
const express = require("express");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

// --- FIX 1: Port Binding for Render ---
// Render specifically looks for process.env.PORT
const PORT = process.env.PORT || 10000;

app.use(express.json());

// --- FIX 2: Static File Serving ---
// This tells the server to serve EVERYTHING (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// --- FIX 3: Explicit Routes for HTML ---
// Landing Page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Quiz Page (Resolves "Cannot GET /quiz")
app.get("/quiz", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "quiz.html"));
});

// --- FIX 4: Secure AI Route ---
app.post("/api/quiz", async (req, res) => {
  const { topics, count } = req.body;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY; 

  const prompt = `Generate exactly ${count} multiple choice quiz questions about: ${topics}.
  Return ONLY a valid JSON array. No markdown, no backticks.
  Format: [{"question": "...", "options": ["A", "B", "C", "D"], "answer": "..."}]`;

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

// --- News Route ---
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

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
