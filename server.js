// ============================================
// server.js — Final Root-Structure Logic
// ============================================

require("dotenv").config();
const express = require("express");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

// --- STEP 1: Port Binding for Render ---
const PORT = process.env.PORT || 10000;

app.use(express.json());

// --- STEP 2: Link your Styles and Scripts ---
// This tells the HTML files to find the CSS and JS inside the public folder
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js", express.static(path.join(__dirname, "public/js")));

// --- STEP 3: Serve HTML from the Root ---
// These match your current file locations on GitHub
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/quiz", (req, res) => {
  res.sendFile(path.join(__dirname, "quiz.html"));
});

// --- STEP 4: News API Route ---
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

// --- STEP 5: Secure AI Quiz Route ---
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

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
