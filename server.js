const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- 1. PRIORITY ASSET MAPPING (Condition A & C) ---
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- 2. NEWS & DESIGN API (Priority A) ---
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

// --- 3. DYNAMIC QUIZ LOGIC (FIXED FOR VARIETY) ---
app.post("/api/quiz", (req, res) => {
    // Expanded Pool to ensure high variety
    const questionPool = [
        { question: "Which term describes a general increase in prices?", options: ["Deflation", "Inflation", "Stagnation", "Recession"], correctAnswer: "Inflation" },
        { question: "What is the primary indicator of a country's economic health?", options: ["GDP", "Stock Market Index", "Currency Strength", "Interest Rates"], correctAnswer: "GDP" },
        { question: "What happens to demand when price increases (ceteris paribus)?", options: ["Increases", "Decreases", "Stays same", "Fluctuates"], correctAnswer: "Decreases" },
        { question: "Which bank manages the money supply in the USA?", options: ["World Bank", "IMF", "The Federal Reserve", "Goldman Sachs"], correctAnswer: "The Federal Reserve" },
        { question: "A 'Bull Market' typically indicates what?", options: ["Falling prices", "Rising prices", "Stable prices", "Market crash"], correctAnswer: "Rising prices" },
        { question: "What is the term for a period of temporary economic decline?", options: ["Expansion", "Depression", "Recession", "Peak"], correctAnswer: "Recession" },
        { question: "Which economic system relies on supply and demand with little government intervention?", options: ["Command", "Mixed", "Traditional", "Market"], correctAnswer: "Market" },
        { question: "What is 'Opportunity Cost'?", options: ["Total cost of production", "The value of the next best alternative", "Price of a new opportunity", "Sunk cost"], correctAnswer: "The value of the next best alternative" },
        { question: "What does 'Liquidity' refer to in finance?", options: ["Company profits", "Ease of converting assets to cash", "Total debt", "Market volatility"], correctAnswer: "Ease of converting assets to cash" },
        { question: "Which of these is a 'Fiscal Policy' tool?", options: ["Interest rates", "Open market operations", "Government spending", "Reserve requirements"], correctAnswer: "Government spending" }
    ];

    // EXPERT SHUFFLE: Fisher-Yates algorithm for true randomness
    for (let i = questionPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionPool[i], questionPool[j]] = [questionPool[j], questionPool[i]];
    }

    // Select 3 unique questions from the shuffled pool
    const selected = questionPool.slice(0, 3);
    res.json(selected);
});

// --- 4. ROOT-LEVEL HTML DELIVERY (Condition C) ---
app.get('/quiz', (req, res) => {
    res.sendFile(path.join(__dirname, 'quiz.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 5. RENDER STABILITY (Condition B) ---
app.use((req, res) => {
    if (req.path.includes('.')) {
        return res.status(404).send('Resource not found');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`FinNews: Version 2.0 Randomized Quiz Active on Port ${PORT}`);
});
