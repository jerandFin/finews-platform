const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- (B) & (C) PRIORITY ASSET MAPPING ---
// Maps to: public/css/styles.css and public/js/app.js
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));

// --- (B) NEWS API WITH CACHE CONTROL ---
app.get("/api/news", async (req, res) => {
    // Prevent Render or the browser from caching news results
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        const apiKey = process.env.NEWS_API_KEY;
        const category = req.query.category || 'business';
        
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}`);
        const data = await response.json();
        
        // (A) Stability: If the API fails, send a clean empty list so the UI doesn't break
        if (data.status !== "ok") throw new Error("API Error");
        res.json(data);
    } catch (error) {
        res.status(200).json({ status: "ok", articles: [] });
    }
});

// --- (D) NON-REPETITIVE QUIZ ENGINE ---
const pool = {
    subjects: ["The Fed", "Bank of Canada", "OPEC+", "The IMF", "Wall Street"],
    verbs: ["pivots toward", "hikes", "deregulates", "subsidizes"],
    variables: ["interest rates", "bond yields", "liquidity", "taxes"],
    triggers: ["amidst inflation", "during a bull market", "to stop debt"]
};
let history = new Set();

app.post("/api/quiz", (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    try {
        let batch = [];
        while (batch.length < 3) {
            const key = `${pool.subjects[Math.floor(Math.random()*5)]}-${pool.verbs[Math.floor(Math.random()*4)]}-${pool.variables[Math.floor(Math.random()*4)]}-${pool.triggers[Math.floor(Math.random()*3)]}`;
            if (!history.has(key)) {
                history.add(key);
                batch.push({
                    id: `gen-${Date.now()}-${batch.length}`,
                    question: `If ${key.replace(/-/g, ' ')} occurs, what happens?`,
                    options: ["Supply Shift", "Demand Shift", "Price Hike", "No Change"].sort(() => Math.random() - 0.5),
                    correctAnswer: "Supply Shift"
                });
            }
            if (history.size > 500) history.clear();
        }
        res.json(batch);
    } catch (e) { res.json([]); }
});

// --- (C) ROOT FILE DELIVERY ---
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'quiz.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// (A) Error Guard: Never send HTML for API requests
app.use((req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: "Not Found" });
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
