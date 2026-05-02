require("dotenv").config();
const express = require("express");
const path = require("path");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// --- THE MAPPING LOGIC (UPDATED) ---
// This tells the server to look inside the 'public' folder for your JS and CSS
app.use("/public", express.static(path.join(__dirname, "public")));

// --- SERVE HTML FROM ROOT ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/quiz", (req, res) => {
  res.sendFile(path.join(__dirname, "quiz.html"));
});

// --- NEWS API ROUTE ---
// Adding this to make sure your news actually generates!
app.get("/api/news", async (req, res) => {
  const category = req.query.category || "business";
  const NEWS_API_KEY = process.env.NEWS_API_KEY; 
  
  try {
    const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${NEWS_API_KEY}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// --- AI QUIZ ROUTE ---
app.post("/api/quiz", async (req, res) => {
  const { topics } = req.body;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

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
        messages: [{ role: "user", content: `Generate a quiz about ${topics}` }]
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
