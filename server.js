const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- 1. PRIORITY ASSET MAPPING (Condition A & C) ---
// Keeps your styles and JS prioritized and error-free on Render
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- 2. NEWS & DESIGN API (Priority A) ---
// Your core news function remains untouched and prioritized
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
        res.status(500).json({ error: "News module failed." });
    }
});

// --- 3. DYNAMIC QUIZ LOGIC (FIXED FOR VARIETY) ---
app.post("/api/quiz", (req, res) => {
    // Significantly expanded pool to prevent early repeats
    const questionPool = [
        { question: "Which term describes a general increase in prices?", options: ["Deflation", "Inflation", "Stagnation", "Recession"], correctAnswer: "Inflation" },
        { question: "What is the primary indicator of a country's economic health?", options: ["GDP", "Stock Market Index", "Currency Strength", "Interest Rates"], correctAnswer: "GDP" },
        { question: "What happens to demand when price increases (ceteris paribus)?", options: ["Increases", "Decreases", "Stays same", "Fluctuates"], correctAnswer: "Decreases" },
        { question: "Which bank manages the money supply in the USA?", options: ["World Bank", "IMF", "The Federal Reserve", "Goldman Sachs"], correctAnswer: "The Federal Reserve" },
        { question: "A 'Bull Market' typically indicates what?", options: ["Falling prices", "Rising prices", "Stable prices", "Market crash"], correctAnswer: "Rising prices" },
        { question: "What is the term for a period of temporary economic decline?", options: ["Expansion", "Depression", "Recession", "Peak"], correctAnswer: "Recession" },
        { question: "Which system relies on supply and demand with little government intervention?", options: ["Command", "Mixed", "Traditional", "Market"], correctAnswer: "Market" },
        { question: "What is 'Opportunity Cost'?", options: ["Total production cost", "The value of the next best alternative", "Price of a new asset", "Sunk cost"], correctAnswer: "The value of the next best alternative" },
        { question: "What does 'Liquidity' refer to?", options: ["Company profits", "Ease of converting assets to cash", "Total debt", "Market volatility"], correctAnswer: "Ease of converting assets to cash" },
        { question: "Which of these is a 'Fiscal Policy' tool?", options: ["Interest rates", "Open market operations", "Government spending", "Reserve requirements"], correctAnswer: "Government spending" },
        { question: "What is the result of a government spending more than it collects in taxes?", options: ["Budget Surplus", "Budget Deficit", "Trade Balance", "National Debt"], correctAnswer: "Budget Deficit" },
        { question: "Which term refers to the 'price' of borrowing money?", options: ["Inflation", "Interest Rate", "Dividends", "Principal"], correctAnswer: "Interest Rate" },
        { question: "What is a 'Bear Market' characterized by?", options: ["Optimism", "Falling stock prices", "Rapid growth", "High employment"], correctAnswer: "Falling stock prices" },
        { question: "In economics, what is 'Scarcity'?", options: ["Unlimited resources", "Limited resources vs unlimited wants", "High prices", "Low demand"], correctAnswer: "Limited resources vs unlimited wants" },
        { question: "Which index tracks the 30 largest companies in the US?", options: ["S&P 500", "NASDAQ", "Dow Jones Industrial Average", "Russell 2000"], correctAnswer: "Dow Jones Industrial Average" },
        { question: "What is 'Diversification' in investing?", options: ["Buying one stock", "Spreading investments across different assets", "Selling all assets", "Shorting the market"], correctAnswer: "Spreading investments across different assets" },
        { question: "What is 'Hyperinflation'?", options: ["Slow price growth", "Extremely rapid/out-of-control inflation", "Falling prices", "Stable economy"], correctAnswer: "Extremely rapid/out-of-control inflation" },
        { question: "Which type of unemployment occurs during a recession?", options: ["Frictional", "Structural", "Cyclical", "Seasonal"], correctAnswer: "Cyclical" },
        { question: "What is the 'Law of Supply'?", options: ["Higher prices = Higher quantity supplied", "Higher prices = Lower supply", "Price doesn't affect supply", "Lower prices = Higher supply"], correctAnswer: "Higher prices = Higher quantity supplied" },
        { question: "What are 'Dividends'?", options: ["Stock market taxes", "Payments made by a corporation to its shareholders", "Interest on bonds", "Trading fees"], correctAnswer: "Payments made by a corporation to its shareholders" }
    ];

    // EXPERT SHUFFLE: Fisher-Yates algorithm for high-entropy randomness
    for (let i = questionPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionPool[i], questionPool[j]] = [questionPool[j], questionPool[i]];
    }

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
    console.log(`FinNews: Version 3.0 High-Entropy Quiz Active on Port ${PORT}`);
});
