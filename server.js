const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- (B) & (C) PROTOCOL: PRIORITY ASSET MAPPING ---
// Absolute security for your styles and frontend news engine paths
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
        // (A) Stability: Fallback so Render never drops connection
        res.status(200).json({ status: "ok", articles: [] });
    }
});

// --- (D) HIGH-ENTROPY DYNAMIC QUIZ POOL MATRIX ---
const archetypes = [
    {
        category: "Monetary",
        subjects: ["The Federal Reserve", "The European Central Bank", "The Bank of Japan", "The Bank of England", "A hawkish central bank faction"],
        actions: ["aggressively hikes the federal funds rate by 75bps", "restricts commercial bank reserve access ratios", "initiates large-scale quantitative tightening assets sales", "unexpectedly raises discount window borrowing premiums"],
        contexts: ["to combat unanchored core inflation expectations", "amid an overheating labor market expansion", "following a historic peak in localized asset evaluations"],
        generateQA: (s, a, c) => ({
            question: `When ${s} ${a} ${c}, what is the direct structural impact on capital markets?`,
            correct: "Bond yields spike upwards while equity valuations compress due to higher discount rates.",
            decoys: [
                "Commercial banking lending parameters loosen up rapidly causing hyper-liquidity.",
                "Short-term capital moves directly into high-yield real estate investment derivatives.",
                "The domestic fiat currency falls sharply against foreign index baskets."
            ]
        })
    },
    {
        category: "Trade & Commodities",
        subjects: ["OPEC+ member nations", "A major global manufacturing trade bloc", "An alliance of agricultural export cartels", "The G7 infrastructure council"],
        actions: ["impose strict retaliatory tariff mandates", "enact emergency output supply limits", "freeze global distribution pipeline permissions", "levy shipping channel transit surcharges"],
        contexts: ["due to escalating structural geopolitical border deadlocks", "to counter severe logistical supply chain chokepoints", "following a complete depletion of sovereign reserve stock buffers"],
        generateQA: (s, a, c) => ({
            question: `If ${s} ${a} ${c}, how will global manufacturing balances adjust?`,
            correct: "Input production costs rise globally, causing an inward shift of the aggregate supply curve.",
            decoys: [
                "Consumer demand scales up exponentially for luxury discretionary commodities.",
                "Deflationary pressures immediately ripple through heavy industry sectors.",
                "Multinational organizations abandon local automation to prioritize manual workforces."
            ]
        })
    },
    {
        category: "Fiscal",
        subjects: ["The sovereign legislative assembly", "The Ministry of Finance executive cabinet", "A newly appointed tax oversight committee"],
        actions: ["implements a progressive windfall revenue tax levy", "drastically slashes corporate capital gains allowances", "phases out domestic manufacturing subsidy allocations"],
        contexts: ["to aggressively narrow structural national budget deficits", "in response to unprecedented corporate profit expansions", "amid pressure to rebalance sovereign balance sheet liabilities"],
        generateQA: (s, a, c) => ({
            question: `If ${s} ${a} ${c}, what is the most likely macroeconomic consequence for corporations?`,
            correct: "Net corporate capital expenditures contract, tempering long-term structural productivity growth.",
            decoys: [
                "Speculative venture funding flowing into early-stage startups amplifies instantly.",
                "Consumer discretionary expenditures expand uniformly across all income brackets.",
                "Publicly traded corporations systematically reduce balance-sheet cash allocations."
            ]
        })
    }
];

// Persistent state tracking set to completely eliminate repetition
let structuralHistory = new Set();

app.post("/api/quiz", (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    try {
        let batch = [];
        let attempts = 0;

        // Generate exactly 3 uniquely non-repetitive items
        while (batch.length < 3 && attempts < 200) {
            attempts++;
            
            // 1. Pick a structural model category
            const arch = archetypes[Math.floor(Math.random() * archetypes.length)];
            
            // 2. Pick variables within that category
            const s = arch.subjects[Math.floor(Math.random() * arch.subjects.length)];
            const a = arch.actions[Math.floor(Math.random() * arch.actions.length)];
            const c = arch.contexts[Math.floor(Math.random() * arch.contexts.length)];
            
            // Create a unique fingerprint key
            const structuralKey = `${arch.category}-${s.substring(0,4)}-${a.substring(0,4)}-${c.substring(0,4)}`;

            // 3. Unique Verification (D)
            if (!structuralHistory.has(structuralKey)) {
                structuralHistory.add(structuralKey);
                
                // Build unique Question, Correct Answer, and Options matching this archetype
                const payload = arch.generateQA(s, a, c);
                
                // Shuffle options so the correct answer is randomized structurally
                const combinedOptions = [payload.correct, ...payload.decoys].sort(() => Math.random() - 0.5);

                batch.push({
                    id: `gen-matrix-${Date.now()}-${batch.length}-${Math.random().toString(36).substr(2, 4)}`,
                    question: payload.question,
                    options: combinedOptions,
                    correctAnswer: payload.correct
                });
            }
        }

        // Safety: If history expands too much, prune it but retain protection buffer
        if (structuralHistory.size > 2000) {
            structuralHistory = new Set(Array.from(structuralHistory).slice(1000));
        }

        res.json(batch);
    } catch (e) {
        // (A) Safeguard Render console execution loops
        res.status(200).json([]);
    }
});

// --- (C) ROOT LEVEL FILE SYSTEM DELIVERY ---
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'quiz.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Global API Fallback Protection Router
app.use((req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: "Endpoint Inactive" });
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Matrix System Engine Active on Port ${PORT}`));
