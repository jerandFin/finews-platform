const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- (B) & (C) PRIORITY ASSET MAPPING ---
// Placed at the top to ensure Styles/News design never break.
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));

// --- (D) HIGH-ENTROPY POOL ---
const pool = {
    subjects: ["The Federal Reserve", "Bank of Canada", "OPEC+", "A Fortune 500 CEO", "The IMF", "Wall Street Analysts", "Silicon Valley Tech Giants", "The ECB", "Emerging Market Investors", "Retail Trade Groups"],
    verbs: ["pivots toward", "announces a freeze on", "implements a surprise hike in", "deregulates", "subsidizes AI integration for", "restructures debt regarding", "signals a massive shift in"],
    variables: ["interest rates", "carbon offsets", "liquidity reserves", "bond yields", "capital gains taxes", "unemployment insurance", "short-selling regulations"],
    triggers: ["amidst a liquidity trap", "during a stagflationary cycle", "following a bull market peak", "due to geopolitical volatility", "to counteract rising debt", "at the start of a fiscal year"]
};

// State tracker to prevent repetition in the same session
let sessionHistory = new Set();

app.post("/api/quiz", (req, res) => {
    // Force browser to fetch fresh data every time
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        let batch = [];
        while (batch.length < 3) {
            const s = pool.subjects[Math.floor(Math.random() * pool.subjects.length)];
            const v = pool.verbs[Math.floor(Math.random() * pool.verbs.length)];
            const varb = pool.variables[Math.floor(Math.random() * pool.variables.length)];
            const t = pool.triggers[Math.floor(Math.random() * pool.triggers.length)];
            
            const uniqueKey = `${s}-${v}-${varb}-${t}`;

            if (!sessionHistory.has(uniqueKey)) {
                sessionHistory.add(uniqueKey);
                batch.push({
                    id: `gen-${Date.now()}-${batch.length}-${Math.random().toString(36).substr(2, 5)}`,
                    question: `If ${s} ${v} ${varb} ${t}, what is the most likely macroeconomic result?`,
                    options: [
                        "A shift in the aggregate supply curve.",
                        "An immediate localized inflationary spike.",
                        "A re-evaluation of long-term bond yields.",
                        "A negligible impact on market equilibrium."
                    ].sort(() => Math.random() - 0.5),
                    correctAnswer: "A shift in the aggregate supply curve."
                });
            }
            if (sessionHistory.size > 1000) sessionHistory.clear();
        }
        res.json(batch);
    } catch (err) {
        // (A) Stability: Fallback so Render doesn't throw a 500 error
        res.json([{ id: "err", question: "Analyzing market data... please refresh.", options: ["Retry"], correctAnswer: "Retry" }]);
    }
});

// --- (C) ROOT FILE DELIVERY ---
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'quiz.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews Active on ${PORT}`));
