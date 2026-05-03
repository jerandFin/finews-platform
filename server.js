const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- 1. PRIORITY ASSET MAPPING (Condition A & B) ---
// Maps your styles and scripts to their specific folders within 'public'
// This prevents MIME type errors (text/html) on Render
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));

// General fallback for any other static assets in the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Silences favicon 404 errors in the Render console
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- 2. NEWS & DESIGN API (Priority A) ---
// Core functionality: Fetches market and finance news
app.get("/api/news", async (req, res) => {
    try {
        const NEWS_API_KEY = process.env.NEWS_API_KEY;
        const category = req.query.category || 'business';
        const response = await fetch(
            `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${NEWS_API_KEY}`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "News module failed to fetch." });
    }
});

// --- 3. DYNAMIC QUIZ LOGIC ---
// Shuffles and serves 3 random questions per session
app.post("/api/quiz", (req, res) => {
    const questionPool = [
        { question: "Which term describes a general increase in prices?", options: ["Deflation", "Inflation", "Stagnation", "Recession"], correctAnswer: "Inflation" },
        { question: "What is the primary indicator of a country's economic health?", options: ["GDP", "Stock Market Index", "Currency Strength", "Interest Rates"], correctAnswer: "GDP" },
        { question: "What happens to demand when price increases (ceteris paribus)?", options: ["Increases", "Decreases", "Stays same", "Fluctuates"], correctAnswer: "Decreases" },
        { question: "Which bank manages the money supply in the USA?", options: ["World Bank", "IMF", "The Federal Reserve", "Goldman Sachs"], correctAnswer: "The Federal Reserve" },
        { question: "A 'Bull Market' typically indicates what?", options: ["Falling prices", "Rising prices", "Stable prices", "Market crash"], correctAnswer: "Rising prices" },
        { question: "What is the term for a period of temporary economic decline?", options: ["Expansion", "Depression", "Recession", "Peak"], correctAnswer: "Recession" }
    ];

    const shuffled = questionPool.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    res.json(selected);
});

// --- 4. ROOT-LEVEL HTML DELIVERY (Condition B) ---
// Delivers HTML files located in your root directory
app.get('/quiz', (req, res) => {
    res.sendFile(path.join(__dirname, 'quiz.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 5. RENDER STABILITY (Condition C) ---
// Handles client-side routing and unknown paths gracefully
app.use((req, res) => {
    if (req.path.includes('.')) {
        return res.status(404).send('Resource not found');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`FinNews: Operational on Port ${PORT}`);
});
