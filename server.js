// --- AI QUIZ ROUTE ---
app.post("/api/quiz", async (req, res) => {
  const { topics } = req.body;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_KEY) {
    return res.status(500).json({ error: "Anthropic API key missing" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        // FIXED: Changed from claude-3-sonnet-20240229 to 3-5-sonnet
        model: "claude-3-5-sonnet-20240620", 
        max_tokens: 2000,
        messages: [{ 
          role: "user", 
          content: `Generate a structured 5-question multiple choice quiz about ${topics}. Return ONLY a JSON array of objects with 'question', 'options' (array), and 'correctAnswer' keys.` 
        }]
      })
    });
    const data = await response.json();
    
    // Safety check: log the data to Render console so you can see it
    console.log("AI Response Data:", JSON.stringify(data));
    
    res.json(data);
  } catch (error) {
    console.error("AI Route Error:", error);
    res.status(500).json({ error: "AI failed to respond" });
  }
});
