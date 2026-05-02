require("dotenv").config();
const express = require("express");
const path = require("path");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// --- THE MAPPING LOGIC ---
// This tells the server exactly where to find your assets
app.use("/js", express.static(path.join(__dirname, "js"))); // Look in the 'js' folder at root
app.use("/css", express.static(path.join(__dirname, "public/css"))); // Look in 'public/css'

// --- SERVE HTML FROM ROOT ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/quiz", (req, res) => {
  res.sendFile(path.join(__dirname, "quiz.html"));
});

// --- AI QUIZ ROUTE ---
app.post("/api/quiz", async (req, res) => {
  const { topics, count } = req.body;
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
