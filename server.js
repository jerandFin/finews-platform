require("dotenv").config();
const express = require("express");
const path = require("path");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// --- THE MAPPING LOGIC ---
// This tells the server that whenever the HTML asks for something starting with "/public", 
// it should look inside the actual 'public' folder in your directory.
app.use("/public", express.static(path.join(__dirname, "public")));

// --- SERVE HTML FROM ROOT ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// --- NEWS API ROUTE ---
app.get("/api/news", async (req, res) => {
  const category = req.query.category || "business";
  // CRITICAL: Ensure this variable name matches your Render Dashboard Key exactly
  const API_KEY = process.env.NEWS_API_KEY; 
  
  try {
    const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // If NewsAPI sends an error (like an invalid key), send it to the frontend console
    if (data.status === "error") {
      console.error("NewsAPI Error:", data.message);
      return res.status(401).json({ error: data.message });
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
