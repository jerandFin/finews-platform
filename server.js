const express = require('express');
const path = require('path');
const practiceQuiz = require('./quiz-practice');
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
            console.warn("Live News API fetch failed for quiz generation.");
        }
    }
    return [];
}

// --- NEWS FEED API ENDPOINT (For Frontend Web Display) ---
app.get("/api/news", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const apiKey = process.env.NEWS_API_KEY;
    const category = req.query.category || 'business';

    if (apiKey) {
        try {
            const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=50&apiKey=${apiKey}`);
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
    res.status(200).json({ status: "ok", feedStatus: "fallback", articles: fallbackArticles });
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

const QUIZ_SIZE = 3;
const QUIZ_HISTORY_SIZE = 9;

function shuffled(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function questionKey(question) {
    return question.toLowerCase().replace(/[\p{P}\s]+/gu, ' ').trim();
}

function validateQuiz(questions, recent) {
    if (questions?.length !== QUIZ_SIZE) return null;

    const seen = new Set(recent);
    for (const item of questions) {
        if (typeof item?.question !== 'string' || !item.question.trim() || item.question.length > 500 ||
            !Array.isArray(item.options) || item.options.length !== 4 ||
            item.options.some(option => typeof option !== 'string' || !option.trim()) ||
            new Set(item.options.map(option => option.trim().toLowerCase())).size !== 4 ||
            !item.options.includes(item.correctAnswer)) {
            return null;
        }

        const key = questionKey(item.question);
        if (seen.has(key)) return null;
        seen.add(key);
    }
    return questions;
}

function selectPracticeQuiz(difficulty, recent) {
    const pool = practiceQuiz[difficulty];
    const recentRanks = new Map(recent.map((key, index) => [key, index]));
    const unseen = pool.filter(item => !recentRanks.has(questionKey(item.question)));
    const seen = pool.filter(item => recentRanks.has(questionKey(item.question)))
        .sort((a, b) => recentRanks.get(questionKey(a.question)) - recentRanks.get(questionKey(b.question)));
    return [...shuffled(unseen), ...seen].slice(0, QUIZ_SIZE);
}

app.post("/api/quiz", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const requestedDifficulty = req.query.difficulty;
    const difficulty = typeof requestedDifficulty === 'string' && Object.hasOwn(practiceQuiz, requestedDifficulty)
        ? requestedDifficulty : 'medium';
    const history = req.body?.recentQuestions;
    const recent = Array.isArray(history)
        ? history.slice(-QUIZ_HISTORY_SIZE)
            .filter(question => typeof question === 'string' && question.length <= 500)
            .map(questionKey)
        : [];

    let questions = null;
    if (process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY) {
        const headlines = await fetchLiveNewsHeadlines('business');
        if (headlines.length > 0) {
            questions = validateQuiz(await generateQuizWithGemini(headlines, difficulty), recent);
            if (!questions) {
                questions = validateQuiz(await generateQuizWithOpenRouter(headlines, difficulty), recent);
            }
        }
    }

    res.setHeader('X-Quiz-Source', questions ? 'news' : 'practice');
    res.json((questions || selectPracticeQuiz(difficulty, recent)).map((item, index) => ({
        id: `quiz-${Date.now()}-${index}`,
        question: item.question,
        options: shuffled(item.options),
        correctAnswer: item.correctAnswer
    })));
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
