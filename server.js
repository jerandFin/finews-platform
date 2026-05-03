require("dotenv").config();
const express = require("express");
const path = require("path");

// Use standard fetch if available, otherwise fallback to node-fetch
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// --- THE MAPPING LOGIC ---
// This ensures /public/js/app.js and /public/css/styles.css are served correctly
app.use("/public", express.static(path.join(__dirname, "public")));

// --- SERVE HTML FROM ROOT ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// --- NEW: SERVE QUIZ PAGE ---
// Added to handle the link in your nav-inner logic
app.get("/quiz", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "quiz.html"));
});

// --- NEWS API ROUTE ---
app.get("/api/news", async (req, res) => {
  const category = req.query.category || "business";
  const API_KEY = process.env.NEWS_API_KEY; 
  
  if (!API_KEY) {
    console.error("Missing NEWS_API_KEY in Environment Variables.");
    return res.status(500).json({ error: "Server API key configuration missing" });
  }
  
  try {
    const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "error") {
      console.error("NewsAPI Error:", data.message);
      return res.status(data.code === "apiKeyInvalid" ? 401 : 400).json({ error: data.message });
    }
    
    res.json(data);
  } catch (error) {
    console.error("Server Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// --- AI QUIZ ROUTE ---
app.post("/api/quiz", async (req, res) => {
  const { topics } = req.body;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_KEY) {
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
        model: "claude-3-sonnet-20240229", // Latest stable version for 2026
        max_tokens: 2000,
        messages: [{ role: "user", content: `Generate a structured 5-question multiple choice quiz about ${topics}. Return ONLY JSON format.` }]
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "AI failed to respond" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
