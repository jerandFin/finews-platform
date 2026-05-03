const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- 1. FILE LOCATION COMPLIANCE (Condition C) ---
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- 2. PRIORITY: NEWS & DESIGN (Condition B) ---
app.get("/api/news", async (req, res) => {
    try {
        const NEWS_API_KEY = process.env.NEWS_API_KEY;
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=business&apiKey=${NEWS_API_KEY}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Priority news module failed." });
    }
});

// --- 3. UNLIMITED AI ENGINE WITH REPETITION BLOCKER (Condition D) ---
// Temporary in-memory storage to track what we've already shown
let servedQuestions = new Set();

app.post("/api/quiz", async (req, res) => {
    try {
        // High-entropy prompt to force the AI to branch out into niche finance/econ topics
        const prompt = `Generate 3 unique multiple-choice questions about Economics and Finance. 
        Focus on varied topics: Global Markets, Fiscal Policy, Microeconomics, or Crypto. 
        Avoid these previously used topics if possible: ${Array.from(servedQuestions).slice(-10).join(", ")}.
        Return ONLY a JSON array of objects with 'question', 'options' (4), and 'correctAnswer'.`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 1.0 // Maximum randomness for unlimited variety
            })
        });

        const data = await response.json();
        const newQuestions = JSON.parse(data.choices[0].message.content);

        // Track questions to prevent future repetition
        newQuestions.forEach(q => servedQuestions.add(q.question.substring(0, 30)));
        
        // Safety: Clear cache if it gets too large to prevent Render memory issues (Condition A)
        if (servedQuestions.size > 200) servedQuestions.clear();

        res.json(newQuestions);

    } catch (error) {
        console.error("AI Generation Error:", error);
        // Fallback: A massive randomized local bank to ensure NO RENDER ERRORS (Condition A)
        const localBank = [
            { question: "What is the 'Gini Coefficient' used to measure?", options: ["Inflation", "Income Inequality", "GDP Growth", "Market Volatility"], correctAnswer: "Income Inequality" },
            { question: "Which curve shows the relationship between tax rates and tax revenue?", options: ["Phillips Curve", "Laffer Curve", "Lorenz Curve", "Supply Curve"], correctAnswer: "Laffer Curve" },
            { question: "What is 'Deadweight Loss'?", options: ["Loss of efficiency in market", "Total debt", "Stock market crash", "High taxes"], correctAnswer: "Loss of efficiency in market" }
            // Add more here for a safety buffer
        ];
        res.json(localBank.sort(() => Math.random() - 0.5));
    }
});

// --- 4. HTML DELIVERY (Condition C) ---
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'quiz.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// --- 5. RENDER ERROR PROTECTION (Condition A) ---
app.use((req, res) => {
    if (req.path.includes('.')) return res.status(404).send('Not found');
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews: V4 Unlimited Engine Running on ${PORT}`));
