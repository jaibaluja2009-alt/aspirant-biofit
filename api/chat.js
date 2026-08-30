export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { message } = req.body || {};

        if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "Please enter a message" });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "Gemini API key is missing on server"
            });
        }

        const promptText = `
You are Sora AI, a friendly and supportive wellness and study assistant for students.

Answer the user's question helpfully and clearly. You can help with:
- Study habits and productivity
- General wellness habits
- Sleep routines
- Hydration
- Motivation and organization

Keep answers concise and easy to understand.
Do not claim to diagnose medical or mental health conditions.
For serious health concerns, encourage the user to talk to a trusted adult or qualified professional.

User's message:
${message}
`;

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: promptText
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await geminiResponse.json();

        if (!geminiResponse.ok) {
            console.error("Gemini API Error:", data);
            return res.status(geminiResponse.status).json({
                error: data?.error?.message || "Gemini API request failed"
            });
        }

        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
            "Sorry, I couldn't generate a response right now.";

        return res.status(200).json({ reply });

    } catch (error) {
        console.error("Server Chat Error:", error);
        return res.status(500).json({
            error: "Server chat error"
        });
    }
}
