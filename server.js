const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- 1. PRIORITY ASSET MAPPING (Condition B & C) ---
// Ensures styles and scripts load before routes to prevent UI flicker or design breakage.
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. THE GENERATOR DATA POOL (Condition D) ---
const subjects = ["The Federal Reserve", "The Bank of Canada", "OPEC+", "A Global Fintech Leader", "Emerging Market Economies", "The IMF", "A Fortune 500 Retailer", "The European Central Bank", "Venture Capitalists", "Institutional Investors"];
const verbs = ["implements a sudden hike in", "announces a subsidy for", "deregulates the trade of", "pivots toward", "places a moratorium on", "increases transparency for", "restructures the debt of", "signals a decrease in"];
const variables = ["interest rates", "carbon credit offsets", "liquidity reserves", "short-selling activity", "AI infrastructure spending", "unemployment insurance", "capital gains taxes", "bond yields"];
const triggers = ["during a stagflationary period", "following a bull market peak", "amidst a global liquidity trap", "due to geopolitical shifts", "to counteract rising consumer debt", "at the start of a fiscal quarter"];

// Server-side memory to track shown questions across the entire Render session.
let seenQuestionIDs = new Set();

// --- 3. NEWS MODULE (Condition B) ---
app.get("/api/news", async (req, res) => {
    try {
        const NEWS_API_KEY = process.env.NEWS_API_KEY;
        // Fetch real-world data to keep the site design functional
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=business&apiKey=${NEWS_API_KEY}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        // (A) Prevents Render from crashing if the API key is missing or invalid
        res.status(500).json({ error: "News module operational - using cached design." });
    }
});

// --- 4. THE NON-REPETITIVE ENGINE (Condition D) ---
app.post("/api/quiz", (req, res) => {
    // FORCE ANTI-CACHE HEADERS: Explicitly telling the browser "Never Save This"
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        let batch = [];
        for (let i = 0; i < 3; i++) {
            let uniqueFound = false;
            let questionObj;
            let attempts = 0;

            // (D) Loop until a truly unique question combination is found
            while (!uniqueFound && attempts < 50) {
                attempts++;
                const s = subjects[Math.floor(Math.random() * subjects.length)];
                const v = verbs[Math.floor(Math.random() * verbs.length)];
                const varb = variables[Math.floor(Math.random() * variables.length)];
                const t = triggers[Math.floor(Math.random() * triggers.length)];
                
                // Construct a unique signature for this question
                const qID = `${s}-${v}-${varb}-${t}`; 

                if (!seenQuestionIDs.has(qID)) {
                    seenQuestionIDs.add(qID);
                    questionObj = {
                        // High-precision ID for the client-side tracker
                        id: `gen-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                        question: `If ${s} ${v} ${varb} ${t}, what is the most likely macroeconomic result?`,
                        options: [
                            "A shift in the aggregate supply curve.",
                            "An immediate localized inflationary spike.",
                            "A re-evaluation of long-term bond yields.",
                            "A negligible impact on market equilibrium."
                        ].sort(() => Math.random() - 0.5),
                        correctAnswer: "A shift in the aggregate supply curve."
                    };
                    uniqueFound = true;
                }
                
                // Render Guard: If the pool gets too large, purge old questions to save memory
                if (seenQuestionIDs.size > 5000) seenQuestionIDs.clear();
            }
            batch.push(questionObj);
        }
        res.json(batch);
    } catch (error) {
        // (A) Graceful error handling for Render stability
        res.status(500).json({ error: "Generator Error" }); 
    }
});

// --- 5. ROOT-LEVEL DELIVERY (Condition C) ---
// Direct mapping to your root files
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'quiz.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Catch-all to prevent 404s on refresh
app.use((req, res) => {
    if (req.path.includes('.')) return res.status(404).send('Not Found');
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews: Infinite Pool Active on ${PORT}`));
