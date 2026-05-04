const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- 1. PRIORITY ASSET MAPPING (Condition B & C) ---
// We place these at the top so styles and scripts never "404" or load as HTML.
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. THE GENERATOR DATA POOL (Condition D) ---
const subjects = ["The Federal Reserve", "The Bank of Canada", "OPEC+", "A Global Fintech Leader", "Emerging Market Economies", "The IMF", "A Fortune 500 Retailer", "The European Central Bank", "Venture Capitalists", "Institutional Investors"];
const verbs = ["implements a sudden hike in", "announces a subsidy for", "deregulates the trade of", "pivots toward", "places a moratorium on", "increases transparency for", "restructures the debt of", "signals a decrease in"];
const variables = ["interest rates", "carbon credit offsets", "liquidity reserves", "short-selling activity", "AI infrastructure spending", "unemployment insurance", "capital gains taxes", "bond yields"];
const triggers = ["during a stagflationary period", "following a bull market peak", "amidst a global liquidity trap", "due to geopolitical shifts", "to counteract rising consumer debt", "at the start of a fiscal quarter"];

// Server-side memory to track recent questions (prevents repetition)
let seenQuestionIDs = new Set();

// --- 3. NEWS & DESIGN API (Priority B) ---
app.get("/api/news", async (req, res) => {
    try {
        const NEWS_API_KEY = process.env.NEWS_API_KEY;
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=business&apiKey=${NEWS_API_KEY}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "News module operational." });
    }
});

// --- 4. THE NON-REPETITIVE ENGINE (Condition D) ---
app.post("/api/quiz", (req, res) => {
    // FORCE ANTI-CACHE HEADERS
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        let batch = [];
        for (let i = 0; i < 3; i++) {
            let uniqueFound = false;
            let questionObj;

            // Loop until a truly unique question is built
            while (!uniqueFound) {
                const s = subjects[Math.floor(Math.random() * subjects.length)];
                const v = verbs[Math.floor(Math.random() * verbs.length)];
                const varb = variables[Math.floor(Math.random() * variables.length)];
                const t = triggers[Math.floor(Math.random() * triggers.length)];
                
                const qID = `${s}-${v}-${varb}-${t}`; // Unique ID for this combination

                if (!seenQuestionIDs.has(qID)) {
                    seenQuestionIDs.add(qID);
                    questionObj = {
                        id: `gen-${Date.now()}-${i}-${Math.random()}`,
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
                
                // Safety: if set gets too big, clear it to prevent Render memory errors
                if (seenQuestionIDs.size > 5000) seenQuestionIDs.clear();
            }
            batch.push(questionObj);
        }
        res.json(batch);
    } catch (error) {
        res.status(500).json({ error: "Generator Error" }); // Condition A
    }
});

// --- 5. ROOT-LEVEL DELIVERY (Condition C) ---
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'quiz.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.use((req, res) => {
    if (req.path.includes('.')) return res.status(404).send('Not Found');
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews: Infinite Pool Active on ${PORT}`));
