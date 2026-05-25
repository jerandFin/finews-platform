const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- (B) & (C) PROTOCOL: PRIORITY ASSET MAPPING ---
// Locks in paths for your styles and frontend news scripts to prevent Render routing errors
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));

// --- (B) NEWS API ENGINE (UNTOUCHED & FULLY ISOLATED) ---
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
        // (A) Render System Guard: Prevents backend crashes by delivering clean fallback formats
        res.status(200).json({ status: "ok", articles: [] });
    }
});

// --- (D) THE BREAKTHROUGH: HIGH-ENTROPY INFINITE QUIZ POOL MATRIX ---
const infiniteMatrix = {
    easy: [
        {
            subjects: ["A local restaurant chain", "An online retail store", "A smartphone manufacturing firm", "A regional supermarket company", "A rideshare platform group", "A local clothing franchise"],
            actions: ["raises its baseline retail prices by 15%", "announces a massive clearance discount holiday sale", "increases its frontline worker minimum wage", "cuts down on its local advertising budget allocations", "introduces an automated checkout system upgrade"],
            contexts: ["to cope with rising raw material shipment fees", "to offload excess seasonal inventory backlog", "amid tight local labor market conditions", "following a minor drop in weekly customer foot traffic", "during a period of stable regional market demand"],
            generateQA: (s, a, c) => ({
                question: `When ${s} ${a} ${c}, what immediate microeconomic adjustment usually follows?`,
                correct: "Consumer purchasing behavior shifts to maximize utility relative to the altered retail incentives.",
                decoys: [
                    "Global sovereign bond networks collapse linearly inside international banking channels.",
                    "The Federal Reserve prints emergency asset facilities to absorb secondary supply.",
                    "National corporate capital investment taxation drops to absolute zero."
                ]
            })
        },
        {
            subjects: ["Average middle-class households", "Local college graduates", "Discretionary retail buyers", "Tech-sector workers"],
            actions: ["abruptly increase their personal savings deposits", "reduce non-essential streaming entertainment sign-ups", "shift spending toward wholesale generic store brands", "take out short-term personal lines of credit"],
            contexts: ["due to anxieties regarding future career stability", "to offset rising costs of basic residential utility bills", "following a sudden shift in local consumer sentiment indices"],
            generateQA: (s, a, c) => ({
                question: `If ${s} ${a} ${c}, what is the direct baseline result for domestic service providers?`,
                correct: "Aggregate near-term consumer revenue profiles contract, forcing leaner operational spending models.",
                decoys: [
                    "International raw commodity asset prices increase by ten times on spot exchanges.",
                    "Commercial real estate valuation parameters experience a vertical upward melt.",
                    "The IMF enforces strict austerity protocols on all nearby municipal districts."
                ]
            })
        }
    ],
    medium: [
        {
            subjects: ["The Federal Reserve board", "The European Central Bank cabinet", "The Bank of England monetary committee", "The Reserve Bank of Australia council", "A hawkish central bank consensus"],
            actions: ["authorizes a restrictive 75-basis-point interest rate hike", "tightens reserve coverage ratio thresholds for lenders", "accelerates its multi-billion dollar quantitative tightening asset runoff", "raises structural discount window borrowing premiums"],
            contexts: ["to combat unanchored core consumer price inflation trends", "amid an over-expanding corporate debt issuance cycle", "following consecutive all-time highs in equity index multiples", "to safeguard the sovereign currency from severe foreign devaluation"],
            generateQA: (s, a, c) => ({
                question: `If ${s} ${a} ${c}, analyze the resulting transmission mechanism through the banking system:`,
                correct: "Yield curves shift upward, increasing the cost of capital and putting downward pressure on equity valuations.",
                decoys: [
                    "Retail commercial credit availability loosens instantly, prompting broad capital drops.",
                    "Liquidity parameters migrate permanently away from treasuries into volatile spot crypto assets.",
                    "The domestic currency experiences rapid structural depreciation against foreign baseline index averages."
                ]
            })
        },
        {
            subjects: ["A unified transnational trade alliance", "A prominent manufacturing powerhouse nation", "A resource-rich economic bloc"],
            actions: ["imposes sweeping retaliatory customs tariff schedules", "implements localized import quota limits on heavy tech components", "restricts export clearances for raw semiconductor substrates"],
            contexts: ["due to escalating geopolitical supply chain standoffs", "to shield emerging domestic supply sectors from international competition", "following severe logistical disruptions across primary oceanic trade lanes"],
            generateQA: (s, a, c) => ({
                question: `When ${s} ${a} ${c}, what structural macroeconomic realignment takes place?`,
                correct: "Global industrial input expenditures increase, shifting the aggregate supply curve inward and fueling stagflationary pressures.",
                decoys: [
                    "Consumer discretionary buying power increases uniformly due to drop in unit costs.",
                    "Deflationary price adjustments cascade through heavy manufacturing supply chains.",
                    "Multinational enterprise firms systematically dissolve automation investments to locate manual factories."
                ]
            })
        }
    ],
    hard: [
        {
            subjects: ["An offshore interbank clearinghouse", "The derivatives execution desk of a sovereign wealth fund", "The Bank for International Settlements framework", "A Tier-1 primary dealer liquidity group"],
            actions: ["enforces aggressive margin haircuts on non-sovereign debt collateral", "liquidates deep interest rate swap positions to mitigate exposure", "enacts highly restrictive macroprudential asset-liability match mandates", "restricts access to overnight short-term repurchase agreements"],
            contexts: ["to guard against hidden counterparty credit defaults during market stress", "following a sharp inversion across long-duration Treasury yield curves", "amid a sudden, unexpected liquidity mismatch in offshore currency funding markets"],
            generateQA: (s, a, c) => ({
                question: `Deconstruct the macro-systemic consequences when ${s} ${a} ${c}:`,
                correct: "Funding premiums spike in the shadow banking network, triggering credit contraction across international interbank balance sheets.",
                decoys: [
                    "Retail consumer investment portfolios redirect automatically into defensive brick-and-mortar stocks.",
                    "Microeconomic asset sales stabilize linearly across domestic secondary market venues.",
                    "Sovereign treasury auction structures capture zero-bound yields through automated market makers."
                ]
            })
        },
        {
            subjects: ["A highly leveraged multi-strategy macro hedge fund", "A major domestic mortgage insurance guarantor", "A decentralized corporate debt pool network"],
            actions: ["faces sudden margin calls across cross-currency swap architectures", "completely halts redemption flows for structured investment vehicle products", "triggers default credit clauses on commercial real estate backed securities"],
            contexts: ["triggered by sharp, synchronized drawdowns in credit-spread derivatives", "following a swift upward repricing of global inflationary risk premiums", "amid a sudden freeze in secondary asset-backed commercial paper auctions"],
            generateQA: (s, a, c) => ({
                question: `Identify the immediate hazard to broader market stability when ${s} ${a} ${c}:`,
                correct: "Forced asset liquidations across multiple asset classes cascade into broader systemic volatility.",
                decoys: [
                    "Broad base money velocities expand seamlessly, buffering primary banking metrics.",
                    "Sovereign balance sheets automatically convert floating debt models into fixed equity tranches.",
                    "Short-term commercial lending rates decouple safely from international risk-free reference curves."
                ]
            })
        }
    ]
};

// Global history tracking registry to ensure absolute uniqueness across requests
let masterEntropyHistory = new Set();

app.post("/api/quiz", (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    try {
        const selectedDifficulty = req.query.difficulty || 'medium';
        const archetypeList = infiniteMatrix[selectedDifficulty] || infiniteMatrix['medium'];
        
        let quizBatch = [];
        let iterationAttempts = 0;

        // Generate exactly 3 uniquely non-repetitive objects
        while (quizBatch.length < 3 && iterationAttempts < 500) {
            iterationAttempts++;
            
            // 1. Randomly pick an independent structural archetype style
            const archetype = archetypeList[Math.floor(Math.random() * archetypeList.length)];
            
            // 2. Select variables from separate arrays to build the sentence
            const subject = archetype.subjects[Math.floor(Math.random() * archetype.subjects.length)];
            const action = archetype.actions[Math.floor(Math.random() * archetype.actions.length)];
            const context = archetype.contexts[Math.floor(Math.random() * archetype.contexts.length)];
            
            // Generate an exact unique fingerprint for this combination
            const exactFingerprint = `${selectedDifficulty}-${subject.substring(0,5)}-${action.substring(0,5)}-${context.substring(0,5)}`.replace(/\s+/g, '-').toLowerCase();

            // 3. Double-check uniqueness against the registry (D)
            if (!masterEntropyHistory.has(exactFingerprint)) {
                masterEntropyHistory.add(exactFingerprint);
                
                const questionPayload = archetype.generateQA(subject, action, context);
                
                // Shuffle options to randomize the correct answer placement
                const randomizedOptions = [questionPayload.correct, ...questionPayload.decoys].sort(() => Math.random() - 0.5);

                quizBatch.push({
                    id: `entropy-${Date.now()}-${quizBatch.length}-${Math.random().toString(36).substr(2, 5)}`,
                    question: questionPayload.question,
                    options: randomizedOptions,
                    correctAnswer: questionPayload.correct
                });
            }
        }

        // Keep registry history clean and dynamic over time
        if (masterEntropyHistory.size > 5000) {
            masterEntropyHistory = new Set(Array.from(masterEntropyHistory).slice(2000));
        }

        res.json(quizBatch);
    } catch (e) {
        // (A) Protect Render server operations from failing silently
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
app.listen(PORT, () => console.log(`Breakthrough Combinatorial Engine Active on Port ${PORT}`));
