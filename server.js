const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// --- FILE PATH MAPPINGS ---
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));

// --- FALLBACK NEWS DATASET (Ensures feed never breaks on Render) ---
const fallbackArticles = [
    {
        title: "Federal Reserve Holds Rates Steady Amid Mixed Inflation Indicators",
        description: "Central bank policymakers signal a cautious approach to future monetary adjustments as economic data shows resilient labor growth.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80",
        publishedAt: new Date().toISOString(),
        source: { name: "Wall Street Journal" }
    },
    {
        title: "Global Commodity Markets Adjust as Energy Supply Chains Stabilize",
        description: "Oil and natural gas futures settled lower this morning following updated shipping route forecasts and increased inventory reports.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80",
        publishedAt: new Date().toISOString(),
        source: { name: "Bloomberg" }
    },
    {
        title: "Tech Equities Lead Market Rally Following Quarterly Earnings Surprises",
        description: "Major semiconductor and cloud computing software providers reported profit margins above consensus analyst projections.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80",
        publishedAt: new Date().toISOString(),
        source: { name: "Reuters" }
    },
    {
        title: "Treasury Yields Flatten as Bond Traders Reevaluate Growth Expectations",
        description: "Short-term sovereign debt yields shifted today in response to updated fiscal spending disclosures and international trade metrics.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=600&q=80",
        publishedAt: new Date().toISOString(),
        source: { name: "Financial Times" }
    }
];

// --- NEWS API FETCH HELPER FOR AI ---
async function fetchLiveNewsHeadlines(category = 'business') {
    const apiKey = process.env.NEWS_API_KEY;
    if (apiKey) {
        try {
            const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}`);
            const data = await response.json();
            if (data.status === "ok" && data.articles && data.articles.length > 0) {
                return data.articles
                    .filter(a => a.title && a.title !== "[Removed]")
                    .slice(0, 5)
                    .map(a => `- ${a.title}: ${a.description || ''}`);
            }
        } catch (err) {
            console.warn("Live News API fetch failed; utilizing server fallback headlines.");
        }
    }
    // Fallback headline strings for AI prompt
    return fallbackArticles.map(a => `- ${a.title}: ${a.description}`);
}

// --- NEWS FEED API ENDPOINT (For Frontend Web Display) ---
app.get("/api/news", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const apiKey = process.env.NEWS_API_KEY;
    const category = req.query.category || 'business';

    if (apiKey) {
        try {
            const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}`);
            const data = await response.json();
            
            // If NewsAPI responds successfully with articles
            if (data.status === "ok" && data.articles && data.articles.length > 0) {
                return res.json(data);
            }
        } catch (error) {
            console.warn("News API remote fetch blocked or failed.");
        }
    }

    // System Guard: Deliver Fallback News Feed so UI never stays empty
    res.status(200).json({ status: "ok", articles: fallbackArticles });
});

// Helper: Safely parse JSON string returned by LLMs (strips markdown code blocks)
function safeParseLLMJson(rawText) {
    if (!rawText) return null;
    try {
        const cleaned = rawText.replace(/```json\n?|\n?```/gi, '').trim();
        const parsed = JSON.parse(cleaned);
        
        if (Array.isArray(parsed)) return parsed;
        if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
        if (parsed.quiz && Array.isArray(parsed.quiz)) return parsed.quiz;
        return null;
    } catch (e) {
        console.warn("JSON Parse Error on AI output:", e.message);
        return null;
    }
}

// --- AI GENERATOR 1: GEMINI API ENGINE ---
async function generateQuizWithGemini(headlines, difficulty) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const prompt = `You are a financial news editor. Based on today's live news headlines:
${headlines.join('\n')}

Generate exactly 3 multiple-choice quiz questions testing financial and economic reasoning based on these headlines.
Target difficulty level: ${difficulty}.

Return ONLY valid JSON matching this exact array structure, with no extra text:
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

        if (!response.ok) return null;

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return safeParseLLMJson(rawText);
    } catch (err) {
        console.warn("Gemini generation failed:", err.message);
        return null;
    }
}

// --- AI GENERATOR 2: OPENROUTER ENGINE (No Region Restriction) ---
async function generateQuizWithOpenRouter(headlines, difficulty) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;

    const prompt = `You are a financial news editor. Based on today's headlines:
${headlines.join('\n')}

Generate exactly 3 multiple-choice financial quiz questions (Difficulty: ${difficulty}).
Return ONLY a valid JSON array like this:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A"
  }
]`;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://finnews-quiz.onrender.com",
                "X-Title": "FinNews Quiz App"
            },
            body: JSON.stringify({
                model: "openrouter/free", 
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        });

        if (!response.ok) return null;

        const data = await response.json();
        const rawText = data?.choices?.[0]?.message?.content;
        return safeParseLLMJson(rawText);
    } catch (e) {
        console.warn("OpenRouter generation failed:", e.message);
        return null;
    }
}

// --- FALLBACK QUIZ MATRIX ---
const fallbackMatrixPool = [
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
    },
    {
        question: "When a nation's central bank engages in Quantitative Easing (QE), what is the direct objective?",
        options: [
            "Inject liquidity into commercial banks to lower long-term interest rates.",
            "Directly increase tax rates on large financial institutions.",
            "Decrease the overall national debt held by private investors.",
            "Freeze international currency conversion rates indefinitely."
        ],
        correctAnswer: "Inject liquidity into commercial banks to lower long-term interest rates."
    }
];

function getRandomFallbackQuestions(pool, count = 3) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// --- LIVE AI QUIZ ROUTE ---
app.post("/api/quiz", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    try {
        const difficulty = req.query.difficulty || 'medium';
        const headlines = await fetchLiveNewsHeadlines('business');
        
        let quizQuestions = null;

        if (headlines.length > 0) {
            // 1. Primary Engine: Gemini API
            if (process.env.GEMINI_API_KEY) {
                quizQuestions = await generateQuizWithGemini(headlines, difficulty);
            }

            // 2. Secondary Engine: OpenRouter AI Fallback
            if ((!quizQuestions || !Array.isArray(quizQuestions) || quizQuestions.length === 0) && process.env.OPENROUTER_API_KEY) {
                console.log("Routing quiz request to OpenRouter fallback AI...");
                quizQuestions = await generateQuizWithOpenRouter(headlines, difficulty);
            }
        }

        // 3. System Guard: Randomized Offline Fallback Pool
        if (!quizQuestions || !Array.isArray(quizQuestions) || quizQuestions.length === 0) {
            console.log("All AI models unavailable. Delivering randomized offline question matrix.");
            quizQuestions = getRandomFallbackQuestions(fallbackMatrixPool, 3);
        }

        const batch = quizQuestions.map((q, idx) => ({
            id: `news-ai-${Date.now()}-${idx}`,
            question: q.question,
            options: [...q.options].sort(() => Math.random() - 0.5),
            correctAnswer: q.correctAnswer
        }));

        res.json(batch);
    } catch (e) {
        console.error("Quiz API Route Error:", e);
        res.json(getRandomFallbackQuestions(fallbackMatrixPool, 3));
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
app.listen(PORT, () => console.log(`FinNews Multi-Engine Server active on port ${PORT}`));
