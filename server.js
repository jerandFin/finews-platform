const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- (B) & (C) PROTOCOL: PRIORITY ASSET MAPPING ---
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));

// --- (B) NEWS API ENGINE (UNTOUCHED & PROTECTED) ---
app.get("/api/news", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    try {
        const apiKey = process.env.NEWS_API_KEY;
        const category = req.query.category || 'business';
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}`);
        const data = await response.json();
        if (data.status !== "ok") throw new Error("API Limit");
        res.json(data);
    } catch (error) {
        // (A) Stability Fallback
        res.status(200).json({ status: "ok", articles: [] });
    }
});

// --- (D) HIGH-ENTROPY DIFFICULTY MATRICES ---
const difficultyPools = {
    easy: [
        {
            subjects: ["A local consumer market", "A retail business chain", "A tech start-up community"],
            actions: ["increases prices across its products", "offers large discounts to shoppers", "raises employee minimum wages"],
            contexts: ["during the holiday shopping season", "to clear out excess warehouse stock", "amid high local job competition"],
            generateQA: (s, a, c) => ({
                question: `If ${s} ${a} ${c}, what is the basic outcome?`,
                correct: "Consumer spending habits adjust to match the immediate change in pricing or incentives.",
                decoys: ["Global international shipping lanes halt operations entirely.", "The nation's central bank prints emergency fiat currency pools.", "Corporate income tax bands double overnight."]
            })
        }
    ],
    medium: [
        {
            subjects: ["The Federal Reserve", "The European Central Bank", "The Bank of Japan"],
            actions: ["aggressively hikes the target interest rate by 75bps", "restricts bank reserve availability parameters", "initiates strategic quantitative tightening asset roll-offs"],
            contexts: ["to combat unanchored core consumer inflation trends", "amid an over-expanding corporate credit market", "following unprecedented peaks in asset valuations"],
            generateQA: (s, a, c) => ({
                question: `When ${s} ${a} ${c}, what is the direct structural impact on capital markets?`,
                correct: "Bond yields spike upwards while equity valuations compress due to higher discount rates.",
                decoys: ["Commercial bank lending limits loosen instantly causing hyper-liquidity.", "Capital leaves sovereign bonds to buy high-risk real estate derivatives.", "The local currency falls dramatically against all foreign market baskets."]
            })
        }
    ],
    hard: [
        {
            subjects: ["An international clearinghouse", "A sovereign wealth fund's derivatives desk", "The Bank for International Settlements (BIS)"],
            actions: ["enforces severe cross-currency collateral haircuts", "unwinds multi-billion dollar interest rate swap positions", "implements stringent macroprudential liquidity rules"],
            contexts: ["to hedge against systemic counterparty contagion failures", "following an inversion of the long-duration yield curves", "amid a sudden liquidity squeeze in the overnight offshore repo markets"],
            generateQA: (s, a, c) => ({
                question: `Analyze the systemic transmission mechanism if ${s} ${a} ${c}:`,
                correct: "Offshore funding premiums escalate, driving credit contraction across transnational interbank balance sheets.",
                decoys: ["Retail consumer purchasing power moves directly into traditional manufacturing stocks.", "Domestic microeconomic sales volume equalizes smoothly across secondary markets.", "Sovereign treasury auction yields drop to zero linearly via automated market-making algorithms."]
            })
        }
    ]
};

let structuralHistory = new Set();

app.post("/api/quiz", (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    try {
        // (A) Check parameter inputs carefully; default to medium if empty
        const level = req.query.difficulty || 'medium';
        const archetypes = difficultyPools[level] || difficultyPools['medium'];
        
        let batch = [];
        let attempts = 0;

        while (batch.length < 3 && attempts < 200) {
            attempts++;
            
            const arch = archetypes[Math.floor(Math.random() * archetypes.length)];
            const s = arch.subjects[Math.floor(Math.random() * arch.subjects.length)];
            const a = arch.actions[Math.floor(Math.random() * arch.actions.length)];
            const c = arch.contexts[Math.floor(Math.random() * arch.contexts.length)];
            
            const structuralKey = `${level}-${s.substring(0,4)}-${a.substring(0,4)}-${c.substring(0,4)}`;

            // (D) Uniqueness Verification Protocol
            if (!structuralHistory.has(structuralKey)) {
                structuralHistory.add(structuralKey);
                
                const payload = arch.generateQA(s, a, c);
                const combinedOptions = [payload.correct, ...payload.decoys].sort(() => Math.random() - 0.5);

                batch.push({
                    id: `gen-matrix-${Date.now()}-${batch.length}-${Math.random().toString(36).substr(2, 4)}`,
                    question: payload.question,
                    options: combinedOptions,
                    correctAnswer: payload.correct
                });
            }
        }

        if (structuralHistory.size > 2000) {
            structuralHistory = new Set(Array.from(structuralHistory).slice(1000));
        }

        res.json(batch);
    } catch (e) {
        // (A) Safeguard server loop from crashes
        res.status(200).json([]);
    }
});

// --- (C) ROOT LEVEL FILE SYSTEM DELIVERY ---
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'quiz.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.use((req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: "Endpoint Inactive" });
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Difficulty Matrix Active on Port ${PORT}`));
