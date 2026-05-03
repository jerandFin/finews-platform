const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- 1. PRIORITY ASSET MAPPING (Condition B & C) ---
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- 2. NEWS & DESIGN API (Priority B) ---
app.get("/api/news", async (req, res) => {
    try {
        const NEWS_API_KEY = process.env.NEWS_API_KEY;
        const category = req.query.category || 'business';
        const response = await fetch(
            `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${NEWS_API_KEY}`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "News module failed." });
    }
});

// --- 3. UNLIMITED AI QUIZ GENERATION (Condition D) ---
app.post("/api/quiz", async (req, res) => {
    try {
        // We use a prompt-based logic to ensure the AI generates fresh, 
        // unique questions for every individual request.
        const prompt = "Generate 3 unique multiple-choice questions about Economics and Finance. Return ONLY a JSON array of objects with 'question', 'options' (array of 4), and 'correctAnswer'.";
        
        // This simulates the AI Receptionist/Botpress logic you've worked on
        // to provide a truly unlimited stream of content.
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.9 // Higher temperature ensures more variety and randomness
            })
        });

        const data = await response.json();
        const questions = JSON.parse(data.choices[0].message.content);
        res.json(questions);

    } catch (error) {
        // Fallback to a shuffled pool if AI fails, to prevent Render errors (Condition A)
        const fallback = [
            { question: "What is the primary goal of Macroeconomics?", options: ["Individual choice", "National economy performance", "Corporate profit", "Stock picking"], correctAnswer: "National economy performance" },
            { question: "What does 'Quantitative Easing' refer to?", options: ["Tax cuts", "Increasing money supply", "Raising interest rates", "Reducing debt"], correctAnswer: "Increasing money supply" },
            { question: "What is a 'Laggard' indicator?", options: ["Predicts future trends", "Changes after the economy changes", "Real-time data", "Random data"], correctAnswer: "Changes after the economy changes" }
        ];
        res.json(fallback.sort(() => 0.5 - Math.random()));
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
app.listen(PORT, () => console.log(`FinNews: Unlimited AI Quiz Engine Active on ${PORT}`));
