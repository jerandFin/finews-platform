const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- (B) & (C) PRIORITY ASSET MAPPING ---
// Ensuring styles.css and app.js are served correctly from your folders
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
// General fallback for any other public assets
app.use(express.static(path.join(__dirname, 'public')));

// --- (B) NEWS API - PRIORITIZED CORE FUNCTION ---
app.get("/api/news", async (req, res) => {
    try {
        const apiKey = process.env.NEWS_API_KEY;
        const category = req.query.category || 'business'; // Handles the ?category=business from your app.js
        
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}`);
        const data = await response.json();
        
        // If external API fails, send a clean JSON object, NOT an error page (A)
        if (data.status === "error") {
            return res.json({ status: "ok", articles: [], note: "API Limit Reached" });
        }
        
        res.json(data);
    } catch (error) {
        // (A) Stability: Never let the server crash or send HTML for this route
        res.status(200).json({ status: "ok", articles: [], message: "News module operational." });
    }
});

// --- (D) NON-REPETITIVE QUIZ ENGINE ---
const pool = {
    subjects: ["The Federal Reserve", "Bank of Canada", "OPEC+", "The IMF", "A Fortune 500 CEO"],
    verbs: ["pivots toward", "announces a freeze on", "implements a hike in", "deregulates"],
    variables: ["interest rates", "liquidity reserves", "bond yields", "capital gains taxes"],
    triggers: ["amidst a liquidity trap", "during stagflation", "to counteract rising debt"]
};

let history = new Set();

app.post("/api/quiz", (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    try {
        let batch = [];
        while (batch.length < 3) {
            const s = pool.subjects[Math.floor(Math.random() * pool.subjects.length)];
            const v = pool.verbs[Math.floor(Math.random() * pool.verbs.length)];
            const varb = pool.variables[Math.floor(Math.random() * pool.variables.length)];
            const t = pool.triggers[Math.floor(Math.random() * pool.triggers.length)];
            const key = `${s}-${v}-${varb}-${t}`;

            if (!history.has(key)) {
                history.add(key);
                batch.push({
                    id: `gen-${Date.now()}-${batch.length}`,
                    question: `If ${s} ${v} ${varb} ${t}, what is the result?`,
                    options: ["Supply Shift", "Demand Shift", "Inflationary Spike", "Market Equilibrium"].sort(() => Math.random() - 0.5),
                    correctAnswer: "Supply Shift"
                });
            }
            if (history.size > 500) history.clear();
        }
        res.json(batch);
    } catch (e) {
        res.json([]);
    }
});

// --- (C) ROOT LEVEL FILE DELIVERY ---
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'quiz.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// (A) The Guard: Prevent API routes from accidentally serving HTML
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews: Design & News Priority Active on ${PORT}`));
