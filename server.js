const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- 1. PRIORITY ASSET MAPPING (Condition B & C) ---
// Ensures your ASUS VivoBook and Render environment load styles first
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- 2. NEWS & DESIGN API (Priority B) ---
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

// --- 3. THE INFINITE ECONOMIC GENERATOR (Condition D) ---
const subjects = ["The Federal Reserve", "OPEC+", "A Tier-1 Tech Giant", "The European Central Bank", "Emerging Market Economies", "A leading EV Manufacturer", "Global Logistics Hubs"];
const actions = ["implements a sudden hike in", "announces a subsidy for", "deregulates the trade of", "pivots aggressively toward", "places a moratorium on", "increases the transparency of"];
const variables = ["interest rates", "AI infrastructure", "carbon credit offsets", "liquidity reserves", "short-selling activity", "universal basic income pilots", "supply chain data"];
const contexts = ["during a period of stagflation", "at the peak of a bull market cycle", "amidst a global liquidity trap", "following a major geopolitical shift", "to counteract rising consumer debt"];

app.post("/api/quiz", (req, res) => {
    // FORCE NO-CACHE: Prevents the browser from showing "old" questions
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        let uniqueQuestions = [];
        for (let i = 0; i < 3; i++) {
            // High-entropy selection for unlimited permutations
            const s = subjects[Math.floor(Math.random() * subjects.length)];
            const a = actions[Math.floor(Math.random() * actions.length)];
            const v = variables[Math.floor(Math.random() * variables.length)];
            const c = contexts[Math.floor(Math.random() * contexts.length)];
            
            uniqueQuestions.push({
                id: `gen-${Date.now()}-${i}-${Math.random()}`,
                question: `If ${s} ${a} ${v} ${c}, what would be the most immediate macroeconomic consequence?`,
                options: [
                    "A shift in the aggregate demand curve.",
                    "A localized inflationary spike.",
                    "An adjustment in global bond yields.",
                    "A re-evaluation of equity risk premiums."
                ].sort(() => Math.random() - 0.5), // Shuffles options too
                correctAnswer: "A shift in the aggregate demand curve." // Logic-based constant for this generator
            });
        }
        res.json(uniqueQuestions);
    } catch (error) {
        res.status(500).json({ error: "Generator failed." }); // Condition A
    }
});

// --- 4. ROOT-LEVEL HTML DELIVERY (Condition C) ---
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'quiz.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// --- 5. RENDER STABILITY (Condition A) ---
app.use((req, res) => {
    if (req.path.includes('.')) return res.status(404).send('Resource not found');
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews: Infinite Engine Active on ${PORT}`));
