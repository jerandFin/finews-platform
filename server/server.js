// ============================================
// server.js — FinNews Platform Server
// Now using REAL data from NewsAPI
// ============================================


// --- Load tools ---
require("dotenv").config({ path: "./server/.env" });
const express = require("express");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3000;


// --- Allow browser to talk to server ---
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(express.json());
app.use(express.static("public"));


// --- The news route ---
// Fetches real live articles from NewsAPI
app.get("/news", async (req, res) => {

  // Read your secret API key from the .env file
  const API_KEY = process.env.NEWS_API_KEY;

  // Read which category the browser is asking for
  const category = req.query.category || "business";

  // Build the NewsAPI request URL
  const url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&sortBy=publishedAt&apiKey=${API_KEY}`;

  try {
    // Contact NewsAPI and wait for real articles
    const response = await fetch(url);

    // Convert the response into usable data
    const data = await response.json();

    // Send the real articles back to your browser
    res.json(data);

  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Failed to fetch news." });
  }

});


// --- Start the server ---
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
  console.log(`🌍 Now fetching REAL articles from NewsAPI`);
});