const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- (B) & (C) FILE PATH MAPPINGS ---
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));

// --- NEWS API ENGINE ---
async function fetchLiveNewsHeadlines(category = 'business') {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) return [];
    try {
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}`);
        const data = await response.json();
        if (data.status === "ok" && data.articles) {
            return data.articles
                .filter(a => a.title && a.title !== "[Removed]")
                .slice(0, 5)
                .map(a => `- ${a.title}: ${a.description || ''}`);
        }
    } catch (err) {
        console.warn("News API fetch failed, proceeding with fallback.");
    }
    return [];
}

app.get("/api/news", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    try {
        const apiKey = process.env.NEWS_API_KEY;
        const category = req.query.category || 'business';
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}`);
        const data = await response.json();
        if (data.status !== "ok") throw new Error("API Limit");
        res.json(data);
    } catch (error) {
        // (A) Render System Guard
        res.status(200).json({ status: "ok", articles: [] });
    }
});

// --- AI GENERATOR: GEMINI API ENGINE ---
async function generateQuizWithGemini(headlines, difficulty) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const prompt = `You are a financial news editor. Based on today's live news headlines:
${headlines.join('\n')}

Generate exactly 3 multiple-choice quiz questions testing financial and economic reasoning based on these headlines.
Target difficulty level: ${difficulty}.

Return ONLY valid JSON matching this exact array structure, with no extra text or markdown formatting:
[
  {
    "question": "Question text based on a headline?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A"
  }
]`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    responseMimeType: "application/json" 
                }
            })
        });

        if (!response.ok) {
            console.warn(`Gemini API returned status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!rawText) return null;

        const parsed = JSON.parse(rawText);
        return Array.isArray(parsed) ? parsed : null;
    } catch (err) {
        console.warn("Gemini generation failed, reverting to fallback matrix:", err.message);
        return null;
    }
}

// --- FALLBACK MATRIX (Guarantees zero Render errors if AI or News API is down) ---
const fallbackMatrix = [
    {
        question: "How do unexpected interest rate changes by central banks typically impact corporate borrowing?",
        options: [
            "Higher rates increase debt service costs, reducing profit margins.",
            "Lower rates instantly halt all consumer retail purchasing.",
            "Rate shifts have zero effect on corporate balance sheets.",
            "Bond prices rise linearly whenever short-term rates increase."
        ],
        correctAnswer: "Higher rates increase debt service costs, reducing profit margins."
    },
    {
        question: "When energy commodity supply faces unexpected international sanctions, what is the primary market result?",
        options: [
            "Global industrial input costs rise, driving inflationary pressures.",
            "Retail inflation drops to zero across all consumer markets.",
            "Equities in heavy manufacturing gain value automatically.",
            "Foreign exchange trading stops across all global markets."
        ],
        correctAnswer: "Global industrial input costs rise, driving inflationary pressures."
    },
    {
        question: "What does an inverted yield curve historically signal to financial markets?",
        options: [
            "An increased market expectation of an impending economic slowdown.",
            "Guaranteed immediate expansion in private equity valuations.",
            "A drop in foreign central bank treasury allocations.",
            "Instant stabilization of foreign exchange rates."
        ],
        correctAnswer: "An increased market expectation of an impending economic slowdown."
    }
];

// --- (D) LIVE AI QUIZ ROUTE ---
app.post("/api/quiz", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    try {
        const difficulty = req.query.difficulty || 'medium';
        const headlines = await fetchLiveNewsHeadlines('business');
        
        let quizQuestions = null;

        // 1. Generate quiz with Gemini if headlines exist
        if (headlines.length > 0 && process.env.GEMINI_API_KEY) {
            quizQuestions = await generateQuizWithGemini(headlines, difficulty);
        }

        // 2. Fallback if Gemini key is absent, rate-limited, or headlines failed (A)
        if (!quizQuestions || !Array.isArray(quizQuestions) || quizQuestions.length === 0) {
            quizQuestions = fallbackMatrix;
        }

        // Format payload and shuffle options
        const batch = quizQuestions.map((q, idx) => ({
            id: `news-gemini-${Date.now()}-${idx}`,
            question: q.question,
            options: [...q.options].sort(() => Math.random() - 0.5),
            correctAnswer: q.correctAnswer
        }));

        res.json(batch);
    } catch (e) {
        console.error("Quiz API Error:", e);
        // (A) System Guard: Return fallback array instead of crashing
        res.json(fallbackMatrix);
    }
});

// --- ROUTING ---
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'quiz.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.use((req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: "Endpoint Inactive" });
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`FinNews Gemini Engine active on port ${PORT}`));
